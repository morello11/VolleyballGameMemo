// Sentezlenmiş mini ses efektleri (WebAudio, ses dosyası yok).
// Tarayıcı kuralı gereği ilk kullanıcı etkileşiminde unlock() çağrılmalı.

import { CONFIG } from './config.js';

export function createSound() {
  let ctx = null;

  function unlock() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  // Tek nota: sıklık kayması ve sönümle basit "pop" karakteri.
  function tone(freqFrom, freqTo, duration, delay = 0, type = 'sine') {
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqFrom, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqTo, 1), t + duration);
    gain.gain.setValueAtTime(CONFIG.soundVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration);
  }

  function playEvent(event) {
    if (event === 'hit') tone(330, 550, 0.09);
    else if (event === 'bounce') tone(220, 160, 0.06);
    else if (event === 'score') {
      tone(590, 590, 0.1);
      tone(790, 790, 0.16, 0.1);
    } else if (event === 'win') {
      tone(520, 520, 0.12);
      tone(660, 660, 0.12, 0.12);
      tone(790, 790, 0.3, 0.24);
    }
  }

  return { unlock, playEvent };
}
