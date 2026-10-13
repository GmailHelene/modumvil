// Analog clock as SVG. Display-only or interactive (drag the hands / arrow keys).
// State is one number: `total` = minutes on the dial, not wrapped, so hands
// always turn the short way and never spin backwards across 12.
import { fromDial, mod, phrase, digital } from './time-no.js';

const NS = 'http://www.w3.org/2000/svg';
const C = 100; // centre
const R = 94; // face radius

function el(name, attrs = {}, parent = null) {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (parent) parent.appendChild(node);
  return node;
}

function polar(r, deg) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
}

function sector(r, fromDeg, toDeg) {
  const [x1, y1] = polar(r, fromDeg);
  const [x2, y2] = polar(r, toDeg);
  const large = toDeg - fromDeg > 180 ? 1 : 0;
  return `M${C},${C} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`;
}

// Zone sectors (minutes) used for teaching "over / på halv / over halv / på".
const ZONES = [
  { from: 0, to: 20, cls: 'z-over', label: 'over', at: 10 },
  { from: 20, to: 30, cls: 'z-pahalv', label: 'på halv', at: 25 },
  { from: 30, to: 40, cls: 'z-overhalv', label: 'over halv', at: 35 },
  { from: 40, to: 60, cls: 'z-pa', label: 'på', at: 50 },
];

export class Clock {
  constructor(host, opts = {}) {
    this.host = host;
    this.interactive = !!opts.interactive;
    this.step = opts.step || 5;
    this.helper = !!opts.helper;
    this.zones = !!opts.zones;
    this.onChange = opts.onChange || (() => {});
    this.onTick = opts.onTick || (() => {});
    this.total = 0;
    this.dragging = null;
    this.build();
    this.render(false);
  }

  build() {
    const svg = el('svg', {
      viewBox: '0 0 200 200',
      class: `clock${this.interactive ? ' clock--interactive' : ''}`,
      role: this.interactive ? 'slider' : 'img',
    });
    if (this.interactive) {
      svg.setAttribute('tabindex', '0');
      svg.setAttribute('aria-label', 'Klokke du kan stille. Dra viserne, eller bruk piltastene. Page Up og Page Down flytter en hel time.');
      svg.setAttribute('aria-valuemin', '0');
      svg.setAttribute('aria-valuemax', '719');
    }
    this.svg = svg;

    el('circle', { cx: C, cy: C, r: R + 4, class: 'clock-rim' }, svg);
    el('circle', { cx: C, cy: C, r: R, class: 'clock-face' }, svg);

    this.zoneLayer = el('g', { class: 'clock-zones' }, svg);
    for (const z of ZONES) {
      el('path', { d: sector(R - 1, z.from * 6, z.to * 6), class: z.cls }, this.zoneLayer);
      const [x, y] = polar(R * 0.33, z.at * 6);
      const t = el('text', { x, y, class: 'zone-label' }, this.zoneLayer);
      t.textContent = z.label;
    }

    const ticks = el('g', { class: 'clock-ticks' }, svg);
    for (let i = 0; i < 60; i += 1) {
      const big = i % 5 === 0;
      const [x1, y1] = polar(R - (big ? 9 : 5), i * 6);
      const [x2, y2] = polar(R - 2, i * 6);
      el('line', { x1, y1, x2, y2, class: big ? 'tick tick--big' : 'tick' }, ticks);
    }

    this.minuteLabels = el('g', { class: 'clock-minute-labels' }, svg);
    for (let i = 0; i < 12; i += 1) {
      const [x, y] = polar(R - 15, i * 30);
      const t = el('text', { x, y, class: 'minute-label' }, this.minuteLabels);
      t.textContent = String(i * 5).padStart(2, '0');
    }

    this.numbers = el('g', { class: 'clock-numbers' }, svg);
    this.numberNodes = [];
    for (let i = 1; i <= 12; i += 1) {
      const t = el('text', { class: 'hour-number' }, this.numbers);
      t.textContent = String(i);
      this.numberNodes.push([t, i]);
    }

    this.hourHand = el('g', { class: 'hand hand--hour' }, svg);
    el('line', { x1: C, y1: C + 10, x2: C, y2: C - 48, class: 'hand-line' }, this.hourHand);
    this.minuteHand = el('g', { class: 'hand hand--minute' }, svg);
    el('line', { x1: C, y1: C + 14, x2: C, y2: C - 76, class: 'hand-line' }, this.minuteHand);
    if (this.interactive) {
      // Larger invisible grab areas make the hands easy to hit on a phone.
      el('line', { x1: C, y1: C, x2: C, y2: C - 50, class: 'hand-grab' }, this.hourHand);
      el('line', { x1: C, y1: C, x2: C, y2: C - 80, class: 'hand-grab' }, this.minuteHand);
      el('circle', { cx: C, cy: C - 74, r: 4.5, class: 'hand-knob' }, this.minuteHand);
      el('circle', { cx: C, cy: C - 46, r: 4.5, class: 'hand-knob' }, this.hourHand);
    }
    el('circle', { cx: C, cy: C, r: 5, class: 'clock-cap' }, svg);

    this.host.replaceChildren(svg);
    this.applyOptions();
    if (this.interactive) this.bindInput();
  }

  applyOptions() {
    this.zoneLayer.style.display = this.zones ? '' : 'none';
    this.minuteLabels.style.display = this.helper ? '' : 'none';
    const r = this.helper ? R - 32 : R - 22;
    for (const [t, i] of this.numberNodes) {
      const [x, y] = polar(r, i * 30);
      t.setAttribute('x', x);
      t.setAttribute('y', y);
    }
  }

  setOptions({ helper, zones, step } = {}) {
    if (helper !== undefined) this.helper = helper;
    if (zones !== undefined) this.zones = zones;
    if (step !== undefined) this.step = step;
    this.applyOptions();
  }

  get() {
    return fromDial(this.total);
  }

  get dial() {
    return mod(this.total, 720);
  }

  // Move to h:m. `animate` turns the hands the shortest way round.
  set(h, m, animate = true) {
    const target = mod(h, 12) * 60 + m;
    const cur = this.total;
    let diff = mod(target - cur, 720);
    if (diff > 360) diff -= 720;
    this.total = cur + diff;
    this.render(animate);
  }

  render(animate) {
    this.svg.classList.toggle('clock--animate', !!animate);
    this.minuteHand.style.transform = `rotate(${this.total * 6}deg)`;
    this.hourHand.style.transform = `rotate(${this.total * 0.5}deg)`;
    if (this.interactive) {
      const { h, m } = this.get();
      this.svg.setAttribute('aria-valuenow', String(this.dial));
      this.svg.setAttribute('aria-valuetext', `${phrase(h, m)}, ${digital(h, m, false)}`);
    }
  }

  change(delta) {
    if (!delta) return;
    const before = this.get().m;
    this.total += delta;
    this.render(false);
    const { h, m } = this.get();
    if (m !== before) this.onTick(m);
    this.onChange(h, m);
  }

  pointerAngle(ev) {
    const rect = this.svg.getBoundingClientRect();
    const x = ((ev.clientX - rect.left) / rect.width) * 200 - C;
    const y = ((ev.clientY - rect.top) / rect.height) * 200 - C;
    const deg = mod((Math.atan2(y, x) * 180) / Math.PI + 90, 360);
    return { deg, r: Math.hypot(x, y) };
  }

  pickHand(deg, r) {
    const angDist = (a, b) => {
      const d = Math.abs(mod(a, 360) - b);
      return Math.min(d, 360 - d);
    };
    const dMin = angDist(this.total * 6, deg);
    const dHour = angDist(this.total * 0.5, deg);
    if (r < 56 && dHour < 35) return 'hour';
    if (dMin < 25 && dHour < 25) return r < 56 ? 'hour' : 'minute';
    return dHour < dMin && r < 70 ? 'hour' : 'minute';
  }

  dragTo(deg) {
    if (this.dragging === 'minute') {
      const snapped = mod(Math.round(deg / 6 / this.step) * this.step, 60);
      let delta = snapped - mod(this.total, 60);
      if (delta > 30) delta -= 60;
      if (delta < -30) delta += 60;
      this.change(delta);
    } else {
      // The hour hand is geared to the minute hand, like a real clock.
      const snapped = Math.round((deg * 2) / this.step) * this.step;
      let delta = mod(snapped - this.dial, 720);
      if (delta > 360) delta -= 720;
      this.change(delta);
    }
  }

  bindInput() {
    const svg = this.svg;
    svg.addEventListener('pointerdown', (ev) => {
      if (ev.button !== undefined && ev.button !== 0) return;
      const { deg, r } = this.pointerAngle(ev);
      this.dragging = this.pickHand(deg, r);
      svg.setPointerCapture(ev.pointerId);
      svg.classList.add(`clock--drag-${this.dragging}`);
      this.dragTo(deg);
      ev.preventDefault();
    });
    svg.addEventListener('pointermove', (ev) => {
      if (!this.dragging) return;
      this.dragTo(this.pointerAngle(ev).deg);
    });
    const end = () => {
      if (!this.dragging) return;
      svg.classList.remove('clock--drag-minute', 'clock--drag-hour');
      this.dragging = null;
    };
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
    svg.addEventListener('lostpointercapture', end);

    svg.addEventListener('keydown', (ev) => {
      const map = {
        ArrowUp: this.step, ArrowRight: this.step,
        ArrowDown: -this.step, ArrowLeft: -this.step,
        PageUp: 60, PageDown: -60,
      };
      if (ev.key in map) {
        ev.preventDefault();
        // Keep on the step grid even if the clock was set off-grid.
        const off = mod(this.total, this.step);
        const d = map[ev.key];
        this.change(off && Math.abs(d) === this.step ? (d > 0 ? this.step - off : -off) : d);
      }
    });
  }
}
