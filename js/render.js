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

  function draw(state) {
    const w = canvas.width;
    const h = canvas.height;
    const scale = w / CONFIG.fieldWidth;
    const groundY = h * (1 - CONFIG.groundScreenFrac);
    const toX = (x) => x * scale;
    const toY = (y) => groundY - y * scale;

    ctx.fillStyle = CONFIG.colors.sky;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = CONFIG.colors.ground;
    ctx.fillRect(0, groundY, w, h - groundY);

    drawTouchHints(w, h);
    drawScore(state.score, w, h);
    drawNet(toX, toY, scale);
    for (const slime of state.slimes) drawSlime(slime, state.ball, toX, toY, scale);
    drawBall(state.ball, toX, toY, scale);
  }

  function drawScore(score, w, h) {
    const size = Math.round(h * CONFIG.scoreSizeFrac);
    const y = h * CONFIG.scoreYFrac;
    ctx.font = `bold ${size}px system-ui, sans-serif`;
    ctx.textBaseline = 'top';
    ctx.fillStyle = CONFIG.colors.leftSlime;
    ctx.textAlign = 'left';
    ctx.fillText(String(score[0]), w * CONFIG.scoreXFrac, y);
    ctx.fillStyle = CONFIG.colors.rightSlime;
    ctx.textAlign = 'right';
    ctx.fillText(String(score[1]), w * (1 - CONFIG.scoreXFrac), y);
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

    ctx.fillStyle = slime.side === 0 ? CONFIG.colors.leftSlime : CONFIG.colors.rightSlime;
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, 0);
    ctx.closePath();
    ctx.fill();

    // Topa bakan tek göz: göz topa doğru konumlanır, bebek de topa doğru kayar.
    const angle = Math.atan2(toY(ball.y) - cy, toX(ball.x) - cx);
    const eyeR = r * CONFIG.eyeRadiusFrac;
    const eyeX = cx + Math.cos(angle) * r * CONFIG.eyeOffsetFrac;
    const eyeY = Math.min(cy - eyeR, cy + Math.sin(angle) * r * CONFIG.eyeOffsetFrac);
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
