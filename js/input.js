// Dokunma ve klavye okuma. Oyun mantığı yok; sadece {left, right, jump} üretir.
// Dokunma: sol yarıda ilk basılan nokta merkez olur, başparmağı merkezin
// sağına/soluna kaydırmak hareket ettirir (sanal joystick). Sağ yarı = zıpla.
// Bölge, dokunuşun başladığı yere göre belirlenir ve dokunuş boyunca değişmez.
// Klavye: ok tuşları + boşluk.

import { CONFIG } from './config.js';

export function createInput() {
  const keys = { left: false, right: false, jump: false };
  const touchZones = new Map(); // dokunuş id -> o dokunuşun bölgesi/durumu

  window.addEventListener('keydown', (e) => setKey(e, true));
  window.addEventListener('keyup', (e) => setKey(e, false));
  for (const type of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) {
    window.addEventListener(type, onTouch, { passive: false });
  }

  function setKey(e, down) {
    if (e.code === 'ArrowLeft') keys.left = down;
    else if (e.code === 'ArrowRight') keys.right = down;
    else if (e.code === 'Space' || e.code === 'ArrowUp') keys.jump = down;
    else return;
    e.preventDefault();
  }

  function onTouch(e) {
    e.preventDefault(); // kaydırma ve çift-tık zoom'u engeller
    const ending = e.type === 'touchend' || e.type === 'touchcancel';
    for (const touch of e.changedTouches) {
      if (ending) {
        touchZones.delete(touch.identifier);
      } else {
        const zone = touchZones.get(touch.identifier) || newZone(touch);
        touchZones.set(touch.identifier, zone);
        updateZone(zone, touch);
      }
    }
  }

  function newZone(touch) {
    if (touch.clientX >= window.innerWidth / 2) {
      return { jump: true, left: false, right: false };
    }
    return { jump: false, left: false, right: false, centerX: touch.clientX };
  }

  function updateZone(zone, touch) {
    if (zone.jump) return;
    const dx = touch.clientX - zone.centerX;
    zone.left = dx < -CONFIG.moveDragDeadZone;
    zone.right = dx > CONFIG.moveDragDeadZone;
  }

  return {
    read() {
      const inputs = { left: keys.left, right: keys.right, jump: keys.jump };
      for (const zone of touchZones.values()) {
        inputs.left = inputs.left || zone.left;
        inputs.right = inputs.right || zone.right;
        inputs.jump = inputs.jump || zone.jump;
      }
      return inputs;
    },
  };
}
