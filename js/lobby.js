// Lobi ekranı: "Oda kur" / "Koda katıl" / tek başına ısınma.
// Sadece DOM gösterimi; ağ ve oyun akışını main.js yönetir.

import { CONFIG } from './config.js';

export function createLobby(handlers) {
  const el = document.getElementById('lobby');
  const codeInput = document.getElementById('codeInput');
  const message = document.getElementById('lobbyMsg');
  const buttons = document.getElementById('lobbyButtons');
  const waiting = document.getElementById('lobbyWaiting');
  const waitingCode = document.getElementById('waitingCode');

  el.style.background = CONFIG.colors.sky;
  codeInput.maxLength = CONFIG.roomCodeLength;

  document.getElementById('createBtn').addEventListener('click', () => handlers.onCreate());
  document.getElementById('joinBtn').addEventListener('click', () => {
    const code = codeInput.value.trim().toUpperCase();
    if (code.length !== CONFIG.roomCodeLength) {
      showMessage(`${CONFIG.roomCodeLength} harfli oda kodunu gir.`);
      return;
    }
    handlers.onJoin(code);
  });
  document.getElementById('soloBtn').addEventListener('click', () => handlers.onSolo());

  function showMenu(text) {
    el.style.display = 'flex';
    buttons.style.display = 'flex';
    waiting.style.display = 'none';
    showMessage(text || '');
  }

  function showWaiting(code) {
    el.style.display = 'flex';
    buttons.style.display = 'none';
    waiting.style.display = 'block';
    waitingCode.textContent = code;
    showMessage('');
  }

  function hide() {
    el.style.display = 'none';
  }

  function showMessage(text) {
    message.textContent = text;
  }

  return { showMenu, showWaiting, hide, showMessage };
}
