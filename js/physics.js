// Saf oyun mantığı. DOM/canvas'a asla dokunmaz; ileride aynen sunucuda çalışacak.
// Koordinatlar: x sağa, y yukarı artar; zemin y=0. Slime konumu taban merkezi,
// top konumu dairenin merkezi.

import { CONFIG } from './config.js';

export function createInitialState() {
  return {
    slime: { x: CONFIG.slimeStartX, y: 0, vx: 0, vy: 0 },
    ball: spawnedBall(),
  };
}

export function update(state, inputs, dt) {
  updateSlime(state.slime, inputs, dt);
  updateBall(state.ball, state.slime, dt);
}

function spawnedBall() {
  return { x: CONFIG.slimeStartX, y: CONFIG.ballSpawnHeight, vx: 0, vy: 0, rot: 0 };
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

  // Slime sol yarıda kalır: sol duvar ile filenin sol yüzü arasında.
  const netLeft = CONFIG.fieldWidth / 2 - CONFIG.netWidth / 2;
  slime.x = clamp(slime.x, CONFIG.slimeRadius, netLeft - CONFIG.slimeRadius);
}

function updateBall(ball, slime, dt) {
  ball.vy -= CONFIG.gravity * dt;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  ball.rot += (ball.vx / CONFIG.ballRadius) * dt;

  collideBallGround(ball);
  collideBallWalls(ball);
  collideBallNet(ball);
  collideBallSlime(ball, slime);
  clampBallSpeed(ball);

  if (isBallAtRest(ball)) Object.assign(ball, spawnedBall());
}

function collideBallGround(ball) {
  if (ball.y >= CONFIG.ballRadius) return;
  ball.y = CONFIG.ballRadius;
  if (ball.vy < 0) ball.vy = -ball.vy * CONFIG.ballBounceWall;
  ball.vx *= CONFIG.ballGroundFriction;
}

function collideBallWalls(ball) {
  const r = CONFIG.ballRadius;
  if (ball.x < r) {
    ball.x = r;
    if (ball.vx < 0) ball.vx = -ball.vx * CONFIG.ballBounceWall;
  }
  if (ball.x > CONFIG.fieldWidth - r) {
    ball.x = CONFIG.fieldWidth - r;
    if (ball.vx > 0) ball.vx = -ball.vx * CONFIG.ballBounceWall;
  }
}

function collideBallNet(ball) {
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
  }
}

function collideBallSlime(ball, slime) {
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

function isBallAtRest(ball) {
  const onGround = ball.y <= CONFIG.ballRadius + 1;
  return onGround && Math.hypot(ball.vx, ball.vy) < CONFIG.ballRestSpeed;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
