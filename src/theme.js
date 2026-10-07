// Three moods over one layout: emerald (default), graphite, noir.
const KEY = 'aghigh-theme';
export const THEMES = [
  { id: 'emerald', label: 'زمردی', swatch: '#0e5a44' },
  { id: 'blue', label: 'آبی برند', swatch: '#0a1e35' },
  { id: 'graphite', label: 'خاکستری', swatch: '#5a6066' },
  { id: 'noir', label: 'مشکی مینیمال', swatch: '#0b0b0c' },
];
const subs = new Set();

export function getTheme() { return document.documentElement.dataset.theme || 'emerald'; }

export function setTheme(id, animate = true) {
  if (!THEMES.some((t) => t.id === id)) id = 'emerald';
  const html = document.documentElement;
  if (animate) { html.classList.add('theme-swap'); setTimeout(() => html.classList.remove('theme-swap'), 600); }
  if (id === 'emerald') delete html.dataset.theme; else html.dataset.theme = id;
  try { localStorage.setItem(KEY, id); } catch {}
  subs.forEach((f) => f(id));
}

export function initTheme() {
  let id = new URLSearchParams(location.search).get('theme');
  if (!id) { try { id = localStorage.getItem(KEY); } catch {} }
  setTheme(id || 'emerald', false);
}

export const onTheme = (f) => { subs.add(f); return () => subs.delete(f); };

// colours for canvas / WebGL, read from the live CSS tokens
export function palette() {
  const cs = getComputedStyle(document.documentElement), v = (n) => cs.getPropertyValue(n).trim();
  return { hi: v('--vel-hi'), deep: v('--vel-mid'), night: v('--vel-low'), brand: v('--emerald'), mid: v('--emerald-mid'), onDark: v('--emerald-on-dark'), noir: getTheme() === 'noir' };
}
