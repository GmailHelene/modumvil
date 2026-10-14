// Small DOM helpers shared by app.js and arcade.js.
import { save } from './store.js';
import { checkBadges } from './badges.js';
import { sound } from './fx.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const binds = (name) => [...document.querySelectorAll(`[data-bind="${name}"]`)];
export const bind = (name) => binds(name)[0];
export const setText = (name, text) => binds(name).forEach((n) => { n.textContent = text; });

export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

let toastTimer = null;
export function toast(html, ms = 2800) {
  const t = bind('toast');
  t.innerHTML = html;
  t.hidden = false;
  t.classList.remove('toast--show');
  void t.offsetWidth; // restart animation
  t.classList.add('toast--show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, ms);
}

// Check for new badges, celebrate them, and return them.
export function award() {
  const earned = checkBadges();
  if (earned.length) {
    save();
    sound.badge();
    toast(earned.slice(0, 3).map((b) => `<span aria-hidden="true">${b.icon}</span> Nytt merke: <b>${esc(b.title)}</b>`).join('<br>')
      + (earned.length > 3 ? `<br>... og ${earned.length - 3} til!` : ''), 3600);
  }
  return earned;
}

export function badgeList(list) {
  return list.map((b) => `<li><span aria-hidden="true">${b.icon}</span> <b>${esc(b.title)}</b> <small>${esc(b.desc)}</small></li>`).join('');
}

export function starsHtml(n) {
  return [1, 2, 3].map((i) => `<span class="${i <= n ? 'on' : ''}">★</span>`).join('');
}
