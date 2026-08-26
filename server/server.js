// Oda tabanlı oyun sunucusu: Node + WebSocket, sunucu-yetkili fizik.
// İstemcideki saf js/physics.js ve js/config.js burada aynen çalışır;
// istemciler sadece girdi yollar, sunucu 60 Hz fizik koşup durumu yayınlar.
//
// Protokol (JSON):
//   istemci -> sunucu: {type:'create'} | {type:'join', code} | {type:'input', input}
//   sunucu -> istemci: {type:'created', code, side} | {type:'joined', code, side}
//                      {type:'start'} | {type:'state', state}
//                      {type:'peer_left'} | {type:'error', message}

import http from 'node:http';
import { WebSocketServer } from 'ws';
import { CONFIG } from '../js/config.js';
import { createInitialState, update } from '../js/physics.js';

const port = process.env.PORT || CONFIG.serverPort;
const rooms = new Map(); // kod -> oda

const httpServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('slime-volley sunucusu calisiyor\n');
});
const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', (data) => {
    let msg;
    try {
      msg = JSON.parse(data);
    } catch {
      return;
    }
    if (msg.type === 'create') createRoom(ws);
    else if (msg.type === 'join') joinRoom(ws, msg.code);
    else if (msg.type === 'input') receiveInput(ws, msg.input);
  });
  ws.on('close', () => leaveRoom(ws));
});

// Kopan bağlantıları temizlemek için periyodik ping.
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false;
    ws.ping();
  }
}, 30000);

function createRoom(ws) {
  if (ws.room) return;
  const code = newRoomCode();
  const room = {
    code,
    players: [ws],
    inputs: [idleInput(), idleInput()],
    state: null,
    timer: null,
  };
  rooms.set(code, room);
  ws.room = room;
  ws.side = 0;
  send(ws, { type: 'created', code, side: 0 });
}

function joinRoom(ws, code) {
  if (ws.room) return;
  const room = rooms.get(String(code || '').trim().toUpperCase());
  if (!room) return send(ws, { type: 'error', message: 'Oda bulunamadı. Kodu kontrol et.' });
  if (room.players.length >= 2) return send(ws, { type: 'error', message: 'Oda dolu.' });
  room.players.push(ws);
  ws.room = room;
  ws.side = 1;
  send(ws, { type: 'joined', code: room.code, side: 1 });
  startGame(room);
}

function startGame(room) {
  room.state = createInitialState();
  room.timer = setInterval(() => tick(room), 1000 / CONFIG.physicsHz);
  broadcast(room, { type: 'start' });
}

function tick(room) {
  update(room.state, room.inputs, 1 / CONFIG.physicsHz);
  broadcast(room, { type: 'state', state: room.state });
}

function receiveInput(ws, input) {
  const room = ws.room;
  if (!room || !input) return;
  room.inputs[ws.side] = { left: !!input.left, right: !!input.right, jump: !!input.jump };
}

function leaveRoom(ws) {
  const room = ws.room;
  if (!room) return;
  ws.room = null;
  if (room.timer) clearInterval(room.timer);
  rooms.delete(room.code);
  for (const player of room.players) {
    if (player !== ws && player.readyState === player.OPEN) {
      player.room = null;
      send(player, { type: 'peer_left' });
    }
  }
}

function newRoomCode() {
  const chars = CONFIG.roomCodeAlphabet;
  let code;
  do {
    code = '';
    for (let i = 0; i < CONFIG.roomCodeLength; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (rooms.has(code));
  return code;
}

function idleInput() {
  return { left: false, right: false, jump: false };
}

function send(ws, msg) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
}

function broadcast(room, msg) {
  const text = JSON.stringify(msg);
  for (const player of room.players) {
    if (player.readyState === player.OPEN) player.send(text);
  }
}

httpServer.listen(port, () => {
  console.log(`slime-volley sunucusu ${port} portunda`);
});
