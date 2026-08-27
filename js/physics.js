// Saf oyun mantığı. DOM/canvas'a asla dokunmaz; ileride aynen sunucuda çalışacak.
// Koordinatlar: x sağa, y yukarı artar; zemin y=0. Slime konumu taban merkezi,
// top konumu dairenin merkezi. Taraflar: 0 = sol, 1 = sağ.

import { CONFIG } from './config.js';

// chaos: lobide seçilen kaos olayları, ör. {wind, ballModes, invert}.
export function createInitialState(chaos = {}) {
  return {
    slimes: [newSlime(0), newSlime(1)],
    ball: servedBall(0),
    score: [0, 0],
    pointPause: 0, // sıfırdan büyükken top düştüğü yerde yatar (sayı görünür kalır)
    servePause: 0, // sıfırdan büyükken top servis noktasında asılı bekler
    lastScorer: null, // son sayıyı alan taraf (skor vurgusu için)
    winner: null, // maç bitince kazanan taraf; oyun donar
    events: [], // bu tikte olanlar ('hit', 'smash', 'bounce', 'score', 'win', 'chaos')
    rally: 0, // bu sayıdaki karşılıklı vuruş sayısı (taraf değiştikçe artar)
    lastHitter: null, // topa son vuran taraf
    chaos: { wind: !!chaos.wind, ballModes: !!chaos.ballModes, invert: !!chaos.invert },
    chaosTimer: nextChaosDelay(), // bir sonraki kaos olayına kalan saniye
    activeChaos: null, // {type, timeLeft, windVx?, ballScale?}
  };
}

// inputs: taraf sırasıyla iki {left, right, jump} nesnesi.
export function update(state, inputs, dt) {
  state.events = [];
  if (state.winner !== null) return;

  const inverted = state.activeChaos && state.activeChaos.type === 'invert';
  for (let side = 0; side < state.slimes.length; side++) {
    const raw = inputs[side];
    const applied = inverted ? { left: raw.right, right: raw.left, jump: raw.jump } : raw;
    updateSlime(state.slimes[side], applied, dt);
  }
  if (state.pointPause > 0) {
    state.pointPause -= dt;
    if (state.pointPause <= 0) serve(state);
    return;
  }
  if (state.servePause > 0) {
    state.servePause -= dt;
    return;
  }
  updateChaos(state, dt);
  updateBall(state, dt);
}

// Sayı arası bitti: top servis konumuna, slimelar yerlerine.
function serve(state) {
  state.activeChaos = null;
  state.ball = servedBall(state.lastScorer);
  state.servePause = CONFIG.servePause;
  for (const slime of state.slimes) {
    slime.x = startX(slime.side);
    slime.y = 0;
    slime.vx = 0;
    slime.vy = 0;
  }
}

// Etkin top yarıçapı: kaos top boyutunu değiştirebilir.
export function ballRadius(state) {
  const scale = state.activeChaos && state.activeChaos.ballScale ? state.activeChaos.ballScale : 1;
  return CONFIG.ballRadius * scale;
}

function updateChaos(state, dt) {
  if (state.activeChaos) {
    state.activeChaos.timeLeft -= dt;
    if (state.activeChaos.timeLeft <= 0) state.activeChaos = null;
    return;
  }
  const enabled = chaosPool(state.chaos);
  if (enabled.length === 0) return;
  state.chaosTimer -= dt;
  if (state.chaosTimer > 0) return;
  state.chaosTimer = nextChaosDelay();
  state.activeChaos = startChaos(enabled[Math.floor(Math.random() * enabled.length)]);
  state.events.push('chaos');
}

function chaosPool(chaos) {
  const pool = [];
  if (chaos.wind) pool.push('wind');
  if (chaos.ballModes) pool.push('ballBig', 'ballSmall');
  if (chaos.invert) pool.push('invert');
  return pool;
}

function startChaos(type) {
  const c = CONFIG.chaos;
  if (type === 'wind') {
    const direction = Math.random() < 0.5 ? -1 : 1;
    return { type, timeLeft: c.windDuration, windVx: direction * c.windStrength };
  }
  if (type === 'ballBig') return { type, timeLeft: c.ballModeDuration, ballScale: c.ballScaleBig };
  if (type === 'ballSmall') return { type, timeLeft: c.ballModeDuration, ballScale: c.ballScaleSmall };
  return { type: 'invert', timeLeft: c.invertDuration };
}

function nextChaosDelay() {
  const c = CONFIG.chaos;
  return c.minDelay + Math.random() * (c.maxDelay - c.minDelay);
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

// Dışa da açık: online modda istemci kendi slime'ını bununla önden oynatır.
export function updateSlime(slime, inputs, dt) {
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

  clampSlimeX(slime);
}

// Her slime kendi yarısında kalır: duvar ile filenin kendi yüzü arasında.
function clampSlimeX(slime) {
  const netLeft = CONFIG.fieldWidth / 2 - CONFIG.netWidth / 2;
  const netRight = CONFIG.fieldWidth / 2 + CONFIG.netWidth / 2;
  if (slime.side === 0) {
    slime.x = clamp(slime.x, CONFIG.slimeRadius, netLeft - CONFIG.slimeRadius);
  } else {
    slime.x = clamp(slime.x, netRight + CONFIG.slimeRadius, CONFIG.fieldWidth - CONFIG.slimeRadius);
  }
}

// Ağ görünümü için ileri sarma (dead reckoning): gelen kareyi gecikme kadar
// öne alarak çizmek için kullanılır. Saftır, durumu değiştirmez; slime
// çarpışması ve sayı kararı sunucuya aittir (top yere varırsa orada bırakılır).
export function extrapolateBall(state, seconds) {
  const ball = { ...state.ball };
  const r = ballRadius(state);
  const noEvents = [];
  let remaining = seconds;
  while (remaining > 0) {
    const dt = Math.min(1 / CONFIG.physicsHz, remaining);
    remaining -= dt;
    if (state.activeChaos && state.activeChaos.windVx) ball.vx += state.activeChaos.windVx * dt;
    ball.vy -= CONFIG.gravity * dt;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    ball.rot += (ball.vx / r) * dt;
    if (ball.y < r) {
      ball.y = r;
      break;
    }
    collideBallWalls(ball, r, noEvents);
    collideBallNet(ball, r, noEvents);
  }
  return ball;
}

// Rakip slime'ı mevcut hızıyla ileri sarar (görsel; girdisi bilinmediği için
// hız sabit varsayılır).
export function extrapolateSlime(slime, seconds) {
  const copy = { ...slime };
  let remaining = seconds;
  while (remaining > 0) {
    const dt = Math.min(1 / CONFIG.physicsHz, remaining);
    remaining -= dt;
    copy.vy -= CONFIG.gravity * dt;
    copy.x += copy.vx * dt;
    copy.y += copy.vy * dt;
    if (copy.y < 0) {
      copy.y = 0;
      copy.vy = 0;
    }
    clampSlimeX(copy);
  }
  return copy;
}

function updateBall(state, dt) {
  const ball = state.ball;
  const r = ballRadius(state);
  if (state.activeChaos && state.activeChaos.windVx) ball.vx += state.activeChaos.windVx * dt;
  ball.vy -= CONFIG.gravity * dt;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  ball.rot += (ball.vx / r) * dt;

  if (ball.y < r) {
    scorePoint(state);
    return;
  }

  collideBallWalls(ball, r, state.events);
  collideBallNet(ball, r, state.events);
  for (const slime of state.slimes) {
    const hitType = collideBallSlime(ball, r, slime);
    if (hitType) {
      // Ralli karşılıklı vuruşları sayar; kendi kafanda sektirmek saymaz.
      if (state.lastHitter !== slime.side) {
        state.rally += 1;
        state.lastHitter = slime.side;
      }
      state.events.push(hitType);
    }
  }
  clampBallSpeed(ball);
}

// Top yere değdi: karşı taraf sayıyı alır; top düştüğü yerde görünür kalır,
// servis pointPause sonra serve() ile kurulur.
function scorePoint(state) {
  const scorer = state.ball.x < CONFIG.fieldWidth / 2 ? 1 : 0;
  state.score[scorer] += 1;
  state.lastScorer = scorer;
  state.ball.y = ballRadius(state);
  state.ball.vx = 0;
  state.ball.vy = 0;
  state.rally = 0;
  state.lastHitter = null;
  if (state.score[scorer] >= CONFIG.matchTarget) {
    state.winner = scorer;
    state.events.push('win');
  } else {
    state.pointPause = CONFIG.pointPause;
    state.events.push('score');
  }
}

function collideBallWalls(ball, r, events) {
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

function collideBallNet(ball, r, events) {
  // Daire-dikdörtgen çarpışması: filenin topa en yakın noktasından sektir.
  const netX = CONFIG.fieldWidth / 2;
  const nearX = clamp(ball.x, netX - CONFIG.netWidth / 2, netX + CONFIG.netWidth / 2);
  const nearY = clamp(ball.y, 0, CONFIG.netHeight);
  const dx = ball.x - nearX;
  const dy = ball.y - nearY;
  const dist = Math.hypot(dx, dy);
  if (dist === 0 || dist >= r) return;

  const nx = dx / dist;
  const ny = dy / dist;
  ball.x = nearX + nx * r;
  ball.y = nearY + ny * r;
  const vn = ball.vx * nx + ball.vy * ny;
  if (vn < 0) {
    ball.vx -= (1 + CONFIG.ballBounceWall) * vn * nx;
    ball.vy -= (1 + CONFIG.ballBounceWall) * vn * ny;
    events.push('bounce');
  }
}

// Çarpışma olduysa vuruş türünü ('hit' | 'smash'), olmadıysa null döner.
function collideBallSlime(ball, r, slime) {
  const dx = ball.x - slime.x;
  const dy = ball.y - slime.y;
  const dist = Math.hypot(dx, dy);
  const minDist = CONFIG.slimeRadius + r;
  // dy < 0: slime yarım daire, alt yarısı yok.
  if (dist === 0 || dist >= minDist || dy < 0) return null;

  const nx = dx / dist;
  const ny = dy / dist;
  ball.x = slime.x + nx * minDist;
  ball.y = slime.y + ny * minDist;

  // Slime'ın hareket çerçevesinde sektir: vuruş slime'ın hızıyla yönlendirilir.
  const rvx = ball.vx - slime.vx;
  const rvy = ball.vy - slime.vy;
  const vn = rvx * nx + rvy * ny;
  if (vn >= 0) return null;
  ball.vx = rvx - (1 + CONFIG.ballBounceSlime) * vn * nx + slime.vx;
  ball.vy = rvy - (1 + CONFIG.ballBounceSlime) * vn * ny + slime.vy;
  const speed = Math.hypot(ball.vx, ball.vy);
  return speed > CONFIG.smashSpeedFrac * CONFIG.maxBallSpeed ? 'smash' : 'hit';
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
