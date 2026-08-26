// Dokunma ve klavye okuma. Oyun mantığı yok; taraf sırasıyla iki
// {left, right, jump} üretir. Dokunma ve ok tuşları + boşluk sol oyuncuyu
// sürer. Sağ oyuncu W/A/D ile sürülür — bu sadece masaüstünde test içindir;
// online adımında yerini ağdaki rakibin girdisi alacak.
// Dokunma: sol yarıda ilk basılan nokta merkez olur, başparmağı merkezin
// sağına/soluna kaydırmak hareket ettirir (sanal joystick). Sağ yarı = zıpla.
// Bölge, dokunuşun başladığı yere göre belirlenir ve dokunuş boyunca değişmez.

import { CONFIG } from './config.js';

export function createInput(canvas) {
  const keys = { left: false, right: false, jump: false };
  const keysRight = { left: false, right: false, jump: false };
  const touchZones = new Map(); // dokunuş id -> o dokunuşun bölgesi/durumu

  window.addEventListener('keydown', (e) => setKey(e, true));
  window.addEventListener('keyup', (e) => setKey(e, false));
  // Dokunma dinleyicileri canvas'ta: lobi açıkken düğmeler normal tıklanabilir.
  for (const type of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) {
    canvas.addEventListener(type, onTouch, { passive: false });
  }

  function setKey(e, down) {
    if (e.target.tagName === 'INPUT') return; // lobideki kod kutusuna yazmayı engelleme
    if (e.code === 'ArrowLeft') keys.left = down;
    else if (e.code === 'ArrowRight') keys.right = down;
    else if (e.code === 'Space' || e.code === 'ArrowUp') keys.jump = down;
    else if (e.code === 'KeyA') keysRight.left = down;
    else if (e.code === 'KeyD') keysRight.right = down;
    else if (e.code === 'KeyW') keysRight.jump = down;
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
    return { jump: false, left: false, right: false, centerX: touch.clientX, peakX: touch.clientX };
  }

  function updateZone(zone, touch) {
    if (zone.jump) return;
    const x = touch.clientX;

    // Bir yön basılıyken parmağı geri çekmek merkezi ulaşılan ucun hemen
    // gerisine taşır: yön değiştirmek, ne kadar sürüklenmiş olursa olsun hep
    // aynı küçük harekettir (hafif geri çekiş durdurur, büyüğü ters yöne geçirir).
    if (zone.left || zone.right) {
      zone.peakX = zone.right ? Math.max(zone.peakX, x) : Math.min(zone.peakX, x);
      if (zone.right && x < zone.peakX - CONFIG.moveDragPullback) {
        zone.centerX = zone.peakX - CONFIG.moveDragPullback;
      } else if (zone.left && x > zone.peakX + CONFIG.moveDragPullback) {
        zone.centerX = zone.peakX + CONFIG.moveDragPullback;
      }
    }

    const dx = x - zone.centerX;
    zone.left = dx < -CONFIG.moveDragDeadZone;
    zone.right = dx > CONFIG.moveDragDeadZone;
    if (zone.left || zone.right) zone.peakX = x;
  }

  return {
    read() {
      const leftPlayer = { left: keys.left, right: keys.right, jump: keys.jump };
      for (const zone of touchZones.values()) {
        leftPlayer.left = leftPlayer.left || zone.left;
        leftPlayer.right = leftPlayer.right || zone.right;
        leftPlayer.jump = leftPlayer.jump || zone.jump;
      }
      const rightPlayer = { left: keysRight.left, right: keysRight.right, jump: keysRight.jump };
      return [leftPlayer, rightPlayer];
    },
  };
}
