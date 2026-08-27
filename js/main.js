// Döngü ve bağlama: sabit zaman adımı (accumulator) + requestAnimationFrame.
// Modlar: 'local' (tek başına ısınma; sağ oyuncu masaüstünde W/A/D ile test
// edilir) ve 'online' (fizik sunucuda koşar; buradan sadece girdi gider,
// gelen durum çizilir). Lobi kapanana kadar arkada yerel sahne akar.

import { CONFIG } from './config.js';
import { createInitialState, update, updateSlime } from './physics.js';
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
let mySide = null; // online'da hangi taraftayız
let mySlime = null; // gecikme telafisi: kendi slime'ımızın yerelde önden oynayan kopyası

// Sunucu karesi gelince tahmini yumuşakça düzelt; büyük sapmada anında hizala.
function reconcileMySlime(serverState) {
  if (mySide === null) return;
  const server = serverState.slimes[mySide];
  if (!mySlime) {
    mySlime = { ...server };
    return;
  }
  const errX = server.x - mySlime.x;
  const errY = server.y - mySlime.y;
  if (Math.hypot(errX, errY) > CONFIG.predictSnapDist) {
    mySlime = { ...server };
  } else {
    mySlime.x += errX * CONFIG.predictCorrection;
    mySlime.y += errY * CONFIG.predictCorrection;
  }
}

function playEvents(events) {
  if (!events || lobby.isVisible()) return; // lobi arkasındaki ısınma sahnesi sessiz
  for (const event of events) sound.playEvent(event);
}

// Maç sonu ekranında herhangi bir dokunuş/tuş: yerelde yeni maç, online'da rövanş isteği.
// Düğme ve kutulara dokunuşlar oyun akışına karışmaz.
function onAnyPress(e) {
  sound.unlock();
  if (e.target && e.target.closest && e.target.closest('button, input, label')) return;
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

const exitBtn = document.getElementById('exitBtn');
let exitArmed = false; // yanlışlıkla çıkışa karşı iki dokunuşlu onay

const lobby = createLobby({
  onSolo() {
    leaveOnline();
    state = createInitialState(lobby.getChaos());
    enterGame();
  },
  onCreate() {
    openConnection((n) => n.createRoom(lobby.getChaos()));
  },
  onJoin(code) {
    openConnection((n) => n.joinRoom(code));
  },
  onCancel() {
    exitToLobby('');
  },
});
lobby.showMenu();

function enterGame() {
  lobby.hide();
  exitBtn.style.display = 'block';
}

function exitToLobby(message) {
  leaveOnline();
  exitBtn.style.display = 'none';
  disarmExit();
  lobby.showMenu(message);
}

exitBtn.addEventListener('click', () => {
  if (!exitArmed) {
    exitArmed = true;
    exitBtn.textContent = 'Çıkılsın mı?';
    setTimeout(disarmExit, 2000);
    return;
  }
  exitToLobby('');
});

function disarmExit() {
  exitArmed = false;
  exitBtn.textContent = '✕';
}

// Ücretsiz sunucu boşta uyur; ilk bağlantı reddedilirse uyanana kadar dene.
function openConnection(afterOpen) {
  leaveOnline();
  attemptConnection(afterOpen, CONFIG.connectRetries);
}

function attemptConnection(afterOpen, retriesLeft) {
  lobby.showMessage(
    retriesLeft === CONFIG.connectRetries
      ? 'Bağlanılıyor...'
      : 'Sunucu uyandırılıyor, ilk bağlantı ~1 dakika sürebilir...'
  );
  let opened = false;
  net = connectNet(onNetMessage, () => {
    if (opened) {
      onNetClose();
      return;
    }
    if (!net) return; // kullanıcı vazgeçti
    if (retriesLeft > 0) {
      lobby.showMessage('Sunucu uyandırılıyor, ilk bağlantı ~1 dakika sürebilir...');
      setTimeout(() => {
        if (net) attemptConnection(afterOpen, retriesLeft - 1);
      }, CONFIG.connectRetryDelay * 1000);
    } else {
      leaveOnline();
      lobby.showMenu('Sunucuya ulaşılamadı. İnterneti kontrol edip tekrar dene.');
    }
  });
  net.whenOpen(() => {
    opened = true;
    afterOpen(net);
  });
}

function onNetMessage(msg) {
  if (msg.type === 'created' || msg.type === 'joined') {
    mySide = msg.side;
    if (msg.type === 'created') lobby.showWaiting(msg.code);
  } else if (msg.type === 'start') {
    mode = 'online';
    onlineState = null;
    mySlime = null;
    enterGame();
  } else if (msg.type === 'state') {
    if (onlineState && onlineState.winner !== null && msg.state.winner === null) {
      rematchSent = false; // rövanş başladı
    }
    onlineState = msg.state;
    reconcileMySlime(msg.state);
    playEvents(msg.state.events);
  } else if (msg.type === 'peer_left') {
    exitToLobby('Rakip ayrıldı.');
  } else if (msg.type === 'error') {
    lobby.showMessage(msg.message);
  }
}

function onNetClose() {
  const wasOnline = mode === 'online';
  exitToLobby(wasOnline ? 'Bağlantı koptu.' : 'Sunucuya ulaşılamadı.');
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
  mySide = null;
  mySlime = null;
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
      predictMySlime(inputs[0]);
    } else {
      update(state, inputs, STEP);
      playEvents(state.events);
    }
    accumulator -= STEP;
  }
  renderer.draw(currentDrawState(), { rematchWaiting: rematchSent });
  requestAnimationFrame(frame);
}

// Gecikme telafisi: kendi slime'ımızı sunucuyu beklemeden yerelde oynat.
function predictMySlime(rawInput) {
  if (!mySlime || !onlineState || onlineState.winner !== null) return;
  const inverted = onlineState.activeChaos && onlineState.activeChaos.type === 'invert';
  const applied = inverted
    ? { left: rawInput.right, right: rawInput.left, jump: rawInput.jump }
    : rawInput;
  updateSlime(mySlime, applied, STEP);
}

function currentDrawState() {
  if (mode !== 'online' || !onlineState) return state;
  if (!mySlime) return onlineState;
  return {
    ...onlineState,
    slimes: onlineState.slimes.map((slime, side) => (side === mySide ? mySlime : slime)),
  };
}

requestAnimationFrame(frame);
