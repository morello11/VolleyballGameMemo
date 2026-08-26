// Dokunma ve klavye okuma. Oyun mantığı yok; sadece {left, right, jump} üretir.
// Dokunma bölgeleri: ekranın sol yarısı hareket (yarımın solu = sol, sağı = sağ),
// sağ yarısı zıplama. Klavye: ok tuşları + boşluk.

export function createInput() {
  const keys = { left: false, right: false, jump: false };
  const touchZones = new Map(); // dokunuş id -> o dokunuşun bölgesi

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
      if (ending) touchZones.delete(touch.identifier);
      else touchZones.set(touch.identifier, zoneFor(touch));
    }
  }

  function zoneFor(touch) {
    const w = window.innerWidth;
    if (touch.clientX >= w / 2) return { left: false, right: false, jump: true };
    return { left: touch.clientX < w / 4, right: touch.clientX >= w / 4, jump: false };
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
