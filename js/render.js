// Canvas çizimi. Oyun mantığı yok; sadece verilen state'i çizer.
// Mantıksal koordinatlar ekrana genişlik üzerinden ölçeklenir; zemin çizgisi
// ekranın altından groundScreenFrac kadar yukarıdadır.

import { CONFIG } from './config.js';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
  }
  window.addEventListener('resize', resize);
  resize();

  // hints: {rematchWaiting} gibi arayüz ipuçları (oyun durumu değil).
  function draw(state, hints = {}) {
    const w = canvas.width;
    const h = canvas.height;
    const scale = w / CONFIG.fieldWidth;
    const groundY = h * (1 - CONFIG.groundScreenFrac);
    const toX = (x) => x * scale;
    const toY = (y) => groundY - y * scale;

    ctx.fillStyle = CONFIG.colors.sky;
    ctx.fillRect(0, 0, w, h);
    drawDecor(w, h);
    ctx.fillStyle = CONFIG.colors.ground;
    ctx.fillRect(0, groundY, w, h - groundY);

    drawTouchHints(w, h);
    drawScore(state, w, h);
    drawNet(toX, toY, scale);
    for (const slime of state.slimes) drawSlime(slime, state.ball, toX, toY, scale);
    drawBall(state.ball, toX, toY, scale);
    if (state.winner !== null) drawWinner(state.winner, hints, w, h);
  }

  function drawDecor(w, h) {
    const sun = CONFIG.decor.sun;
    ctx.fillStyle = CONFIG.colors.sun;
    ctx.beginPath();
    ctx.arc(w * sun.x, h * sun.y, h * sun.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = CONFIG.colors.cloud;
    for (const cloud of CONFIG.decor.clouds) {
      const cx = w * cloud.x;
      const cy = h * cloud.y;
      const s = h * cloud.s;
      ctx.beginPath();
      ctx.arc(cx - s * 1.1, cy, s * 0.8, 0, Math.PI * 2);
      ctx.arc(cx, cy - s * 0.4, s, 0, Math.PI * 2);
      ctx.arc(cx + s * 1.2, cy, s * 0.85, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawScore(state, w, h) {
    const y = h * CONFIG.scoreYFrac;
    for (const side of [0, 1]) {
      // Son sayıyı alan tarafın skoru servis beklemesi boyunca büyür.
      const pulsing = state.servePause > 0 && state.lastScorer === side;
      const size = Math.round(h * CONFIG.scoreSizeFrac * (pulsing ? 1.4 : 1));
      ctx.font = `bold ${size}px system-ui, sans-serif`;
      ctx.textBaseline = 'top';
      ctx.fillStyle = side === 0 ? CONFIG.colors.leftSlime : CONFIG.colors.rightSlime;
      ctx.textAlign = side === 0 ? 'left' : 'right';
      const x = side === 0 ? w * CONFIG.scoreXFrac : w * (1 - CONFIG.scoreXFrac);
      ctx.fillText(String(state.score[side]), x, y);
    }
  }

  function drawWinner(winner, hints, w, h) {
    const name = winner === 0 ? 'KIRMIZI' : 'MAVİ';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const o = CONFIG.overlay;
    ctx.fillStyle = winner === 0 ? CONFIG.colors.leftSlime : CONFIG.colors.rightSlime;
    ctx.font = `bold ${Math.round(h * o.titleSizeFrac)}px system-ui, sans-serif`;
    ctx.fillText(`${name} KAZANDI!`, w / 2, h * o.titleYFrac);
    ctx.fillStyle = CONFIG.colors.overlayText;
    ctx.font = `bold ${Math.round(h * o.subSizeFrac)}px system-ui, sans-serif`;
    ctx.fillText(hints.rematchWaiting ? 'Rakip bekleniyor...' : 'Yeniden oynamak için dokun', w / 2, h * o.subYFrac);
  }

  function drawNet(toX, toY, scale) {
    ctx.fillStyle = CONFIG.colors.net;
    const netW = CONFIG.netWidth * scale;
    ctx.fillRect(toX(CONFIG.fieldWidth / 2) - netW / 2, toY(CONFIG.netHeight), netW, CONFIG.netHeight * scale);
  }

  function drawSlime(slime, ball, toX, toY, scale) {
    const cx = toX(slime.x);
    const cy = toY(slime.y);
    const r = CONFIG.slimeRadius * scale;

    // Squash & stretch: havadayken hız oranında dikey uzar, yatayda incelir.
    const speedFrac = Math.min(1, Math.abs(slime.vy) / CONFIG.jumpSpeed);
    const stretch = slime.y > 0 ? 1 + CONFIG.slimeStretchFrac * speedFrac : 1;

    ctx.fillStyle = slime.side === 0 ? CONFIG.colors.leftSlime : CONFIG.colors.rightSlime;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1 / Math.sqrt(stretch), stretch);
    ctx.beginPath();
    ctx.arc(0, 0, r, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Topa bakan tek göz: göz topa doğru konumlanır, bebek de topa doğru kayar.
    // Ara ara göz kırpar (yalnızca görsel; iki slime farklı zamanda kırpsın diye kaydırılır).
    const angle = Math.atan2(toY(ball.y) - cy, toX(ball.x) - cx);
    const eyeR = r * CONFIG.eyeRadiusFrac;
    const eyeX = cx + Math.cos(angle) * r * CONFIG.eyeOffsetFrac;
    const eyeY = Math.min(cy - eyeR, cy + Math.sin(angle) * r * CONFIG.eyeOffsetFrac);
    const blinking = (performance.now() + slime.side * 1700) % CONFIG.blinkPeriodMs < CONFIG.blinkDurationMs;
    if (blinking) {
      ctx.strokeStyle = CONFIG.colors.pupil;
      ctx.lineWidth = Math.max(1, eyeR / 3);
      ctx.beginPath();
      ctx.moveTo(eyeX - eyeR, eyeY);
      ctx.lineTo(eyeX + eyeR, eyeY);
      ctx.stroke();
      return;
    }
    ctx.fillStyle = CONFIG.colors.eye;
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = CONFIG.colors.pupil;
    ctx.beginPath();
    ctx.arc(
      eyeX + Math.cos(angle) * eyeR * CONFIG.pupilShiftFrac,
      eyeY + Math.sin(angle) * eyeR * CONFIG.pupilShiftFrac,
      eyeR / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  function drawBall(ball, toX, toY, scale) {
    const cx = toX(ball.x);
    const cy = toY(ball.y);
    const r = CONFIG.ballRadius * scale;

    ctx.fillStyle = CONFIG.colors.ball;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Tek dikiş çizgisi: topla birlikte dönen bir çap.
    ctx.strokeStyle = CONFIG.colors.ballSeam;
    ctx.lineWidth = Math.max(1, r / 8);
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(ball.rot) * r * 0.8, cy - Math.sin(ball.rot) * r * 0.8);
    ctx.lineTo(cx + Math.cos(ball.rot) * r * 0.8, cy + Math.sin(ball.rot) * r * 0.8);
    ctx.stroke();
  }

  function drawTouchHints(w, h) {
    const size = h * CONFIG.hintSizeFrac;
    const y = h * CONFIG.hintYFrac;
    ctx.save();
    ctx.globalAlpha = CONFIG.hintOpacity;
    ctx.fillStyle = CONFIG.colors.hint;
    drawTriangle(w * CONFIG.hintLeftXFrac, y, size, -1, 0); // sol yarı: bas ve sola kaydır
    drawTriangle(w * CONFIG.hintRightXFrac, y, size, 1, 0); // sol yarı: bas ve sağa kaydır
    drawTriangle(w * CONFIG.hintJumpXFrac, y, size, 0, -1); // sağ yarı: zıpla
    ctx.restore();
  }

  function drawTriangle(x, y, size, dirX, dirY) {
    ctx.beginPath();
    ctx.moveTo(x + dirX * size, y + dirY * size);
    ctx.lineTo(x - dirY * size, y + dirX * size);
    ctx.lineTo(x + dirY * size, y - dirX * size);
    ctx.closePath();
    ctx.fill();
  }

  return { draw };
}
