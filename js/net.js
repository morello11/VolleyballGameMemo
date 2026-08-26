// Sunucu bağlantısı. Oyun mantığı yok; mesaj gönderir, geleni iletir.
// CONFIG.serverUrl doluysa oraya, boşsa sayfanın sunulduğu makinedeki yerel
// sunucuya (test) bağlanır.

import { CONFIG } from './config.js';

export function connectNet(onMessage, onClose) {
  const url = CONFIG.serverUrl || `ws://${location.hostname}:${CONFIG.serverPort}`;
  const ws = new WebSocket(url);
  let closed = false;

  ws.onmessage = (e) => {
    let msg;
    try {
      msg = JSON.parse(e.data);
    } catch {
      return;
    }
    onMessage(msg);
  };
  const reportClose = () => {
    if (closed) return;
    closed = true;
    onClose();
  };
  ws.onclose = reportClose;
  ws.onerror = reportClose;

  const send = (msg) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  };

  return {
    whenOpen(fn) {
      if (ws.readyState === WebSocket.OPEN) fn();
      else ws.onopen = fn;
    },
    createRoom(chaos) {
      send({ type: 'create', chaos });
    },
    joinRoom(code) {
      send({ type: 'join', code });
    },
    sendInput(input) {
      send({ type: 'input', input });
    },
    sendRematch() {
      send({ type: 'rematch' });
    },
    close() {
      closed = true;
      ws.close();
    },
  };
}
