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

  // Yarı saydam zemin: arkadaki ısınma sahnesi hafifçe görünür.
  el.style.background = CONFIG.colors.sky + 'd9';
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
  codeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('joinBtn').click();
  });
  document.getElementById('soloBtn').addEventListener('click', () => handlers.onSolo());
  document.getElementById('cancelWaitBtn').addEventListener('click', () => handlers.onCancel());

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

  return {
    showMenu,
    showWaiting,
    hide,
    showMessage,
    isVisible: () => el.style.display !== 'none',
    // Seçili kaos olayları; odayı kuran belirler, katılan aynı ayarları alır.
    getChaos: () => ({
      wind: document.getElementById('chaosWind').checked,
      ballModes: document.getElementById('chaosBall').checked,
      invert: document.getElementById('chaosInvert').checked,
    }),
  };
}
