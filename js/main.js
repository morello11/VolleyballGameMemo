// Döngü ve bağlama: sabit zaman adımı (accumulator) + requestAnimationFrame.
// Modlar: 'local' (tek başına ısınma; sağ oyuncu masaüstünde W/A/D ile test
// edilir) ve 'online' (fizik sunucuda koşar; buradan sadece girdi gider,
// gelen durum çizilir). Lobi kapanana kadar arkada yerel sahne akar.

import { CONFIG } from './config.js';
import { createInitialState, update } from './physics.js';
import { createInput } from './input.js';
import { createRenderer } from './render.js';
import { createLobby } from './lobby.js';
import { connectNet } from './net.js';
import { createSound } from './sound.js';

const STEP = 1 / CONFIG.physicsHz;
const MAX_FRAME_TIME = 0.25; // sekme arka plana düşüp dönünce fizik patlamasın

document.body.style.background = CONFIG.colors.sky;
document.getElementById('rotate').style.background = CONFIG.colors.sky;

const canvas = document.getElementById('game');
const input = createInput(canvas);
const renderer = createRenderer(canvas);
const sound = createSound();

let mode = 'local';
let state = createInitialState();
let net = null;
let onlineState = null; // sunucudan gelen son durum
let rematchSent = false; // maç sonunda "yeniden oyna" isteğimiz gitti mi

function playEvents(events) {
  if (!events || lobby.isVisible()) return; // lobi arkasındaki ısınma sahnesi sessiz
  for (const event of events) sound.playEvent(event);
}

// Maç sonu ekranında herhangi bir dokunuş/tuş: yerelde yeni maç, online'da rövanş isteği.
function onAnyPress() {
  sound.unlock();
  if (mode === 'local' && state.winner !== null) {
    state = createInitialState();
  } else if (mode === 'online' && net && onlineState && onlineState.winner !== null && !rematchSent) {
    net.sendRematch();
    rematchSent = true;
  }
}
window.addEventListener('touchstart', onAnyPress, { passive: true });
window.addEventListener('mousedown', onAnyPress);
window.addEventListener('keydown', onAnyPress);

const lobby = createLobby({
  onSolo() {
    leaveOnline();
    state = createInitialState(lobby.getChaos());
    lobby.hide();
  },
  onCreate() {
    openConnection((n) => n.createRoom(lobby.getChaos()));
  },
  onJoin(code) {
    openConnection((n) => n.joinRoom(code));
  },
});
lobby.showMenu();

function openConnection(afterOpen) {
  leaveOnline();
  lobby.showMessage('Bağlanılıyor...');
  net = connectNet(onNetMessage, onNetClose);
  net.whenOpen(() => afterOpen(net));
}

function onNetMessage(msg) {
  if (msg.type === 'created') {
    lobby.showWaiting(msg.code);
  } else if (msg.type === 'start') {
    mode = 'online';
    onlineState = null;
    lobby.hide();
  } else if (msg.type === 'state') {
    if (onlineState && onlineState.winner !== null && msg.state.winner === null) {
      rematchSent = false; // rövanş başladı
    }
    onlineState = msg.state;
    playEvents(msg.state.events);
  } else if (msg.type === 'peer_left') {
    leaveOnline();
    lobby.showMenu('Rakip ayrıldı.');
  } else if (msg.type === 'error') {
    lobby.showMessage(msg.message);
  }
}

function onNetClose() {
  const wasOnline = mode === 'online';
  leaveOnline();
  lobby.showMenu(wasOnline ? 'Bağlantı koptu.' : 'Sunucuya ulaşılamadı.');
}

function leaveOnline() {
  if (net) {
    const old = net;
    net = null;
    old.close();
  }
  mode = 'local';
  onlineState = null;
  rematchSent = false;
  state = createInitialState();
}

// İlk dokunuşta tam ekrana geç ve yatay moda kilitle — tarayıcı çubuğu kaybolur.
// Desteklemeyen tarayıcılarda (ör. iOS Safari) sessizce normal devam eder.
window.addEventListener(
  'touchstart',
  async () => {
    if (document.fullscreenElement || !document.documentElement.requestFullscreen) return;
    try {
      await document.documentElement.requestFullscreen();
      await screen.orientation.lock('landscape');
    } catch {
      // tam ekran ya da kilit reddedildiyse oyun pencerede devam eder
    }
  },
  { passive: true }
);

let last = performance.now();
let accumulator = 0;

function frame(now) {
  accumulator += Math.min((now - last) / 1000, MAX_FRAME_TIME);
  last = now;
  while (accumulator >= STEP) {
    const inputs = input.read();
    if (mode === 'online' && net) {
      net.sendInput(inputs[0]); // dokunma + ok tuşları kendi slime'ını sürer
    } else {
      update(state, inputs, STEP);
      playEvents(state.events);
    }
    accumulator -= STEP;
  }
  renderer.draw(mode === 'online' && onlineState ? onlineState : state, { rematchWaiting: rematchSent });
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
