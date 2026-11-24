// Sound (synthesised with Web Audio, no files), vibration and confetti.
import { state } from './store.js';

let ctx = null;

function audio() {
  if (!state.settings.sound) return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, start, dur, { type = 'sine', gain = 0.18 } = {}) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + start;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sound = {
  correct(combo = 0) {
    const lift = Math.min(combo, 8) * 40;
    tone(660 + lift, 0, 0.12, { type: 'triangle' });
    tone(990 + lift, 0.09, 0.18, { type: 'triangle' });
  },
  wrong() {
    tone(220, 0, 0.18, { type: 'square', gain: 0.07 });
    tone(165, 0.12, 0.25, { type: 'square', gain: 0.07 });
  },
  tick() {
    tone(1800, 0, 0.025, { type: 'square', gain: 0.03 });
  },
  fanfare() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.28, { type: 'triangle', gain: 0.16 }));
  },
  badge() {
    [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.07, 0.2, { type: 'sine', gain: 0.14 }));
  },
};

export function vibrate(pattern) {
  if (state.settings.vibrate && navigator.vibrate) navigator.vibrate(pattern);
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function confetti(amount = 90) {
  if (reducedMotion()) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  const c = canvas.getContext('2d');
  c.scale(dpr, dpr);
  const colors = ['#ffd23f', '#3ddc97', '#ff6b6b', '#4cc9f0', '#b388ff'];
  const parts = Array.from({ length: amount }, () => ({
    x: window.innerWidth / 2 + (Math.random() - 0.5) * 80,
    y: window.innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 12,
    vy: -Math.random() * 12 - 4,
    s: 5 + Math.random() * 6,
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    c: colors[Math.floor(Math.random() * colors.length)],
  }));
  const start = performance.now();
  function frame(now) {
    const t = now - start;
    c.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (const p of parts) {
      p.vy += 0.35;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.r);
      c.fillStyle = p.c;
      c.globalAlpha = Math.max(0, 1 - t / 1800);
      c.fillRect(-p.s / 2, -p.s / 3, p.s, p.s / 1.5);
      c.restore();
    }
    if (t < 1800) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}
