export const fa = (n, d = 0) => Number(n).toLocaleString('fa-IR', { maximumFractionDigits: d, minimumFractionDigits: d });
export const faDigits = (s) => String(s).replace(/\d/g, (c) => '۰۱۲۳۴۵۶۷۸۹'[c]);
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function toman(n) {
  if (n >= 1e9) return `${fa(n / 1e9, 2)}<small>میلیارد تومان</small>`;
  if (n >= 1e6) return `${fa(n / 1e6, 1)}<small>میلیون تومان</small>`;
  return `${fa(n)}<small>تومان</small>`;
}

// count-up animation for numbers already rendered with data-count
export function countUp(root) {
  root.querySelectorAll('[data-count]').forEach((el) => {
    const end = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), dur = 1600, t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      el.textContent = fa(end * e, dec);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

// smooth catmull-rom → bezier path
export function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}

let gid = 0;
export function sparkline(values, { w = 200, h = 38, color = '#d4af6a' } = {}) {
  const min = Math.min(...values), max = Math.max(...values), id = `sp${gid++}`;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 3 - ((v - min) / (max - min || 1)) * (h - 6)]);
  const line = smoothPath(pts);
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".35"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
    <path d="${line} L${w},${h} L0,${h}Z" fill="url(#${id})"/>
    <path d="${line}" fill="none" stroke="${color}" stroke-width="1.6" vector-effect="non-scaling-stroke"/>
  </svg>`;
}

// interactive area chart with crosshair + tooltip
export function areaChart(el, values, labels, { h = 220, fmt = (v) => fa(v) } = {}) {
  const w = 800, pad = { t: 14, b: 26, l: 8, r: 8 };
  const min = Math.min(...values) * 0.995, max = Math.max(...values) * 1.003;
  const X = (i) => pad.l + (i / (values.length - 1)) * (w - pad.l - pad.r);
  const Y = (v) => pad.t + (1 - (v - min) / (max - min)) * (h - pad.t - pad.b);
  const pts = values.map((v, i) => [X(i), Y(v)]);
  const line = smoothPath(pts), id = `ac${gid++}`;
  const grid = [0.25, 0.5, 0.75].map((k) => `<line x1="0" x2="${w}" y1="${pad.t + k * (h - pad.t - pad.b)}" y2="${pad.t + k * (h - pad.t - pad.b)}" stroke="rgba(212,175,106,.08)" stroke-dasharray="2 6"/>`).join('');
  const xl = labels.map((l, i) => (i % Math.ceil(labels.length / 7) === 0 ? `<text x="${X(i)}" y="${h - 6}" fill="#857a68" font-size="11" text-anchor="middle">${l}</text>` : '')).join('');
  el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="height:${h}px">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4af6a" stop-opacity=".38"/><stop offset=".7" stop-color="#d4af6a" stop-opacity=".04"/><stop offset="1" stop-color="#d4af6a" stop-opacity="0"/></linearGradient>
    <linearGradient id="${id}s" x1="0" x2="1"><stop offset="0" stop-color="#8a6a2f"/><stop offset=".6" stop-color="#d4af6a"/><stop offset="1" stop-color="#f7e4b5"/></linearGradient></defs>
    ${grid}
    <path d="${line} L${X(values.length - 1)},${h - pad.b} L${X(0)},${h - pad.b}Z" fill="url(#${id})"/>
    <path class="ln" d="${line}" fill="none" stroke="url(#${id}s)" stroke-width="2" vector-effect="non-scaling-stroke" style="stroke-dasharray:3000;stroke-dashoffset:3000;animation:draw 2.2s cubic-bezier(.2,.8,.2,1) forwards"/>
    <circle cx="${pts.at(-1)[0]}" cy="${pts.at(-1)[1]}" r="4" fill="#f7e4b5"><animate attributeName="r" values="4;9;4" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;.3;1" dur="2s" repeatCount="indefinite"/></circle>
    ${xl}
    <line class="cx" x1="0" x2="0" y1="${pad.t}" y2="${h - pad.b}" stroke="rgba(247,228,181,.5)" opacity="0"/>
    <circle class="cd" r="5" fill="#0c0a0c" stroke="#f7e4b5" stroke-width="2" opacity="0"/>
    <rect x="0" y="0" width="${w}" height="${h}" fill="transparent"/>
  </svg><div class="tip"></div>`;
  if (!document.getElementById('drawkf')) { const st = document.createElement('style'); st.id = 'drawkf'; st.textContent = '@keyframes draw{to{stroke-dashoffset:0}}'; document.head.appendChild(st); }
  const svg = el.querySelector('svg'), tip = el.querySelector('.tip'), cx = el.querySelector('.cx'), cd = el.querySelector('.cd');
  svg.addEventListener('pointermove', (e) => {
    const r = svg.getBoundingClientRect(); const x = ((e.clientX - r.left) / r.width) * w;
    const i = Math.max(0, Math.min(values.length - 1, Math.round(((x - pad.l) / (w - pad.l - pad.r)) * (values.length - 1))));
    cx.setAttribute('x1', X(i)); cx.setAttribute('x2', X(i)); cx.setAttribute('opacity', 1);
    cd.setAttribute('cx', X(i)); cd.setAttribute('cy', Y(values[i])); cd.setAttribute('opacity', 1);
    tip.style.opacity = 1; tip.style.left = `${(X(i) / w) * 100}%`; tip.style.top = `${(Y(values[i]) / h) * 100}%`;
    tip.innerHTML = `<span class="muted">${labels[i]}</span> &nbsp; <b>${fmt(values[i])}</b>`;
  });
  svg.addEventListener('pointerleave', () => { tip.style.opacity = 0; cx.setAttribute('opacity', 0); cd.setAttribute('opacity', 0); });
}

// donut with hover tooltips; colors fixed per entity
export function donut(el, parts, { size = 180, center = '' } = {}) {
  const tot = parts.reduce((a, p) => a + p.v, 0), R = 70, r = 54, C = 90;
  let a0 = -Math.PI / 2;
  const gap = 0.025;
  const arcs = parts.map((p) => {
    const a1 = a0 + (p.v / tot) * Math.PI * 2;
    const s = a0 + gap / 2, e = a1 - gap / 2, large = e - s > Math.PI ? 1 : 0;
    const P = (ang, rad) => `${C + Math.cos(ang) * rad},${C + Math.sin(ang) * rad}`;
    const d = `M${P(s, R)} A${R},${R} 0 ${large} 1 ${P(e, R)} L${P(e, r)} A${r},${r} 0 ${large} 0 ${P(s, r)}Z`;
    a0 = a1;
    return `<path d="${d}" fill="${p.c}" data-l="${p.l}" data-v="${fa((p.v / tot) * 100, 1)}٪ · ${p.t || fa(p.v)}" style="transition:transform .3s;transform-origin:${C}px ${C}px"/>`;
  }).join('');
  el.innerHTML = `<div class="chart" style="width:${size}px;margin-inline:auto"><svg viewBox="0 0 180 180">${arcs}
    <text x="90" y="86" text-anchor="middle" fill="#f1e8d6" font-size="20" font-weight="300">${center}</text>
    <text x="90" y="106" text-anchor="middle" fill="#857a68" font-size="10">کیلوگرم</text></svg><div class="tip"></div></div>`;
  const tip = el.querySelector('.tip');
  el.querySelectorAll('path').forEach((p) => {
    p.addEventListener('pointerenter', () => { p.style.transform = 'scale(1.05)'; tip.style.opacity = 1; tip.innerHTML = `${p.dataset.l} <b>${p.dataset.v}</b>`; tip.style.left = '50%'; tip.style.top = '0%'; });
    p.addEventListener('pointerleave', () => { p.style.transform = ''; tip.style.opacity = 0; });
  });
}

export function bars(values, labels, { h = 150, hi = -1, fmt = (v) => fa(v) } = {}) {
  const max = Math.max(...values);
  return `<div style="display:flex;align-items:flex-end;gap:10px;height:${h}px">${values.map((v, i) => `
    <div style="flex:1;display:grid;gap:8px;justify-items:center;height:100%;align-content:end" title="${labels[i]}: ${fmt(v)}">
      <span style="font-size:10.5px;color:${i === hi ? '#f7e4b5' : '#857a68'}">${fmt(v)}</span>
      <div style="width:100%;max-width:34px;height:${(v / max) * (h - 44)}px;border-radius:1px;background:${i === hi ? '#CB9B2D' : 'rgba(255,255,255,.13)'};transform-origin:bottom;animation:grow2 1.2s ${i * 0.06}s cubic-bezier(.2,.8,.2,1) both"></div>
      <span style="font-size:11px;color:#857a68">${labels[i]}</span></div>`).join('')}</div>
    <style>@keyframes grow2{from{transform:scaleY(0)}}</style>`;
}
