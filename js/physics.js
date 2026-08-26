// Saf oyun mantığı. DOM/canvas'a asla dokunmaz; ileride aynen sunucuda çalışacak.
// Koordinatlar: x sağa, y yukarı artar; zemin y=0. Slime konumu taban merkezi,
// top konumu dairenin merkezi. Taraflar: 0 = sol, 1 = sağ.

import { CONFIG } from './config.js';

export function createInitialState() {
  return {
    slimes: [newSlime(0), newSlime(1)],
    ball: servedBall(0),
    score: [0, 0],
    servePause: 0, // sıfırdan büyükken top servis noktasında asılı bekler
    lastScorer: null, // son sayıyı alan taraf (skor vurgusu için)
    winner: null, // maç bitince kazanan taraf; oyun donar
    events: [], // bu tikte olanlar ('hit', 'bounce', 'score', 'win') — ses/efekt için
  };
}

// inputs: taraf sırasıyla iki {left, right, jump} nesnesi.
export function update(state, inputs, dt) {
  state.events = [];
  if (state.winner !== null) return;
  for (let side = 0; side < state.slimes.length; side++) {
    updateSlime(state.slimes[side], inputs[side], dt);
  }
  if (state.servePause > 0) {
    state.servePause -= dt;
    return;
  }
  updateBall(state, dt);
}

function newSlime(side) {
  return { side, x: startX(side), y: 0, vx: 0, vy: 0 };
}

function servedBall(side) {
  return { x: startX(side), y: CONFIG.ballSpawnHeight, vx: 0, vy: 0, rot: 0 };
}

function startX(side) {
  return side === 0 ? CONFIG.slimeStartX : CONFIG.fieldWidth - CONFIG.slimeStartX;
}

function updateSlime(slime, inputs, dt) {
  slime.vx = 0;
  if (inputs.left) slime.vx -= CONFIG.moveSpeed;
  if (inputs.right) slime.vx += CONFIG.moveSpeed;

  if (inputs.jump && slime.y <= 0) slime.vy = CONFIG.jumpSpeed;
  slime.vy -= CONFIG.gravity * dt;

  slime.x += slime.vx * dt;
  slime.y += slime.vy * dt;

  if (slime.y < 0) {
    slime.y = 0;
    slime.vy = 0;
  }

  // Her slime kendi yarısında kalır: duvar ile filenin kendi yüzü arasında.
  const netLeft = CONFIG.fieldWidth / 2 - CONFIG.netWidth / 2;
  const netRight = CONFIG.fieldWidth / 2 + CONFIG.netWidth / 2;
  if (slime.side === 0) {
    slime.x = clamp(slime.x, CONFIG.slimeRadius, netLeft - CONFIG.slimeRadius);
  } else {
    slime.x = clamp(slime.x, netRight + CONFIG.slimeRadius, CONFIG.fieldWidth - CONFIG.slimeRadius);
  }
}

function updateBall(state, dt) {
  const ball = state.ball;
  ball.vy -= CONFIG.gravity * dt;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  ball.rot += (ball.vx / CONFIG.ballRadius) * dt;

  if (ball.y < CONFIG.ballRadius) {
    scorePoint(state);
    return;
  }

  collideBallWalls(ball, state.events);
  collideBallNet(ball, state.events);
  for (const slime of state.slimes) collideBallSlime(ball, slime, state.events);
  clampBallSpeed(ball);
}

// Top yere değdi: karşı taraf sayıyı alır ve servisi kullanır.
function scorePoint(state) {
  const scorer = state.ball.x < CONFIG.fieldWidth / 2 ? 1 : 0;
  state.score[scorer] += 1;
  state.lastScorer = scorer;
  state.ball = servedBall(scorer);
  state.servePause = CONFIG.servePause;
  for (const slime of state.slimes) {
    slime.x = startX(slime.side);
    slime.y = 0;
    slime.vx = 0;
    slime.vy = 0;
  }
  if (state.score[scorer] >= CONFIG.matchTarget) {
    state.winner = scorer;
    state.events.push('win');
  } else {
    state.events.push('score');
  }
}

function collideBallWalls(ball, events) {
  const r = CONFIG.ballRadius;
  if (ball.x < r) {
    ball.x = r;
    if (ball.vx < 0) {
      ball.vx = -ball.vx * CONFIG.ballBounceWall;
      events.push('bounce');
    }
  }
  if (ball.x > CONFIG.fieldWidth - r) {
    ball.x = CONFIG.fieldWidth - r;
    if (ball.vx > 0) {
      ball.vx = -ball.vx * CONFIG.ballBounceWall;
      events.push('bounce');
    }
  }
}

function collideBallNet(ball, events) {
  // Daire-dikdörtgen çarpışması: filenin topa en yakın noktasından sektir.
  const netX = CONFIG.fieldWidth / 2;
  const nearX = clamp(ball.x, netX - CONFIG.netWidth / 2, netX + CONFIG.netWidth / 2);
  const nearY = clamp(ball.y, 0, CONFIG.netHeight);
  const dx = ball.x - nearX;
  const dy = ball.y - nearY;
  const dist = Math.hypot(dx, dy);
  if (dist === 0 || dist >= CONFIG.ballRadius) return;

  const nx = dx / dist;
  const ny = dy / dist;
  ball.x = nearX + nx * CONFIG.ballRadius;
  ball.y = nearY + ny * CONFIG.ballRadius;
  const vn = ball.vx * nx + ball.vy * ny;
  if (vn < 0) {
    ball.vx -= (1 + CONFIG.ballBounceWall) * vn * nx;
    ball.vy -= (1 + CONFIG.ballBounceWall) * vn * ny;
    events.push('bounce');
  }
}

function collideBallSlime(ball, slime, events) {
  const dx = ball.x - slime.x;
  const dy = ball.y - slime.y;
  const dist = Math.hypot(dx, dy);
  const minDist = CONFIG.slimeRadius + CONFIG.ballRadius;
  // dy < 0: slime yarım daire, alt yarısı yok.
  if (dist === 0 || dist >= minDist || dy < 0) return;

  const nx = dx / dist;
  const ny = dy / dist;
  ball.x = slime.x + nx * minDist;
  ball.y = slime.y + ny * minDist;

  // Slime'ın hareket çerçevesinde sektir: vuruş slime'ın hızıyla yönlendirilir.
  const rvx = ball.vx - slime.vx;
  const rvy = ball.vy - slime.vy;
  const vn = rvx * nx + rvy * ny;
  if (vn < 0) {
    ball.vx = rvx - (1 + CONFIG.ballBounceSlime) * vn * nx + slime.vx;
    ball.vy = rvy - (1 + CONFIG.ballBounceSlime) * vn * ny + slime.vy;
    events.push('hit');
  }
}

function clampBallSpeed(ball) {
  const speed = Math.hypot(ball.vx, ball.vy);
  if (speed > CONFIG.maxBallSpeed) {
    const k = CONFIG.maxBallSpeed / speed;
    ball.vx *= k;
    ball.vy *= k;
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
