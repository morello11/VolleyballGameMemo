// Döngü ve bağlama: sabit zaman adımı (accumulator) + requestAnimationFrame.

import { CONFIG } from './config.js';
import { createInitialState, update } from './physics.js';
import { createInput } from './input.js';
import { createRenderer } from './render.js';

const STEP = 1 / CONFIG.physicsHz;
const MAX_FRAME_TIME = 0.25; // sekme arka plana düşüp dönünce fizik patlamasın

document.body.style.background = CONFIG.colors.sky;
document.getElementById('rotate').style.background = CONFIG.colors.sky;

const state = createInitialState();
const input = createInput();
const renderer = createRenderer(document.getElementById('game'));

let last = performance.now();
let accumulator = 0;

function frame(now) {
  accumulator += Math.min((now - last) / 1000, MAX_FRAME_TIME);
  last = now;
  while (accumulator >= STEP) {
    update(state, input.read(), STEP);
    accumulator -= STEP;
  }
  renderer.draw(state);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
