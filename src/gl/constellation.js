import { createOrb } from './orb.js';

// Agents orbit a molten-gold core; each one periodically sends a data pulse inward.
export function createConstellation(wrap, agents, { onPulse } = {}) {
  const cv = wrap.querySelector('canvas.cst'), g = cv.getContext('2d');
  const core = createOrb(wrap.querySelector('canvas.core'));
  const tip = wrap.querySelector('.cst-tip');
  const rings = [0.34, 0.6, 0.86];
  const nodes = agents.map((a, i) => ({
    a, ring: i % 3, ang: (i / agents.length) * Math.PI * 2 + (i % 3) * 0.4,
    sp: (0.05 + (i % 3) * -0.02 + (i % 2 ? 0.012 : -0.008)) * (i % 2 ? 1 : -1), x: 0, y: 0, hot: 0,
  }));
  const pulses = [];
  let W = 0, H = 0, cx = 0, cy = 0, rx = 0, ry = 0, hover = null, alive = true, mx = -1, my = -1;
  const fit = () => {
    const r = wrap.getBoundingClientRect(); W = r.width; H = r.height;
    cv.width = W * devicePixelRatio; cv.height = H * devicePixelRatio; g.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    cx = W / 2; cy = H / 2; rx = W * 0.46; ry = H * 0.42;
  };
  fit(); const ro = new ResizeObserver(fit); ro.observe(wrap);
  const move = (e) => { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; };
  const leave = () => { mx = my = -1; };
  cv.addEventListener('pointermove', move); cv.addEventListener('pointerleave', leave);

  const fire = (n) => { pulses.push({ n, t: 0 }); n.hot = 1; };
  const iv = setInterval(() => { const n = nodes[(Math.random() * nodes.length) | 0]; fire(n); onPulse?.(n.a); }, 900);

  let last = performance.now();
  (function loop(t) {
    if (!alive) return;
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    g.clearRect(0, 0, W, H);
    // orbits
    rings.forEach((k, i) => {
      g.beginPath(); g.ellipse(cx, cy, rx * k, ry * k, 0, 0, Math.PI * 2);
      g.strokeStyle = i === 1 ? 'rgba(125,156,196,.25)' : `rgba(214,178,110,${0.12 + i * 0.03})`; g.lineWidth = 1; g.setLineDash(i === 1 ? [2, 6] : []); g.stroke();
    });
    g.setLineDash([]);
    const prev = hover; hover = null;
    nodes.forEach((n) => {
      n.ang += n.sp * dt * (n === prev ? 0.1 : 1);
      const k = rings[n.ring];
      n.x = cx + Math.cos(n.ang) * rx * k; n.y = cy + Math.sin(n.ang) * ry * k;
      if (mx >= 0 && Math.hypot(mx - n.x, my - n.y) < 22) hover = n;
    });
    // links to core
    nodes.forEach((n) => {
      const a = 0.05 + n.hot * 0.5 + (n === hover ? 0.5 : 0);
      const grd = g.createLinearGradient(n.x, n.y, cx, cy);
      grd.addColorStop(0, `rgba(251,231,182,${a})`); grd.addColorStop(1, 'rgba(251,231,182,0)');
      g.strokeStyle = grd; g.lineWidth = n === hover ? 1.5 : 1;
      g.beginPath(); g.moveTo(n.x, n.y); g.lineTo(cx, cy); g.stroke();
      n.hot = Math.max(0, n.hot - dt * 0.8);
    });
    // pulses travelling inward
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i]; p.t += dt * 0.9;
      if (p.t >= 1) { pulses.splice(i, 1); core.setEnergy(0.8); setTimeout(() => core.setEnergy(0.15), 160); continue; }
      const e = p.t * p.t, x = p.n.x + (cx - p.n.x) * e, y = p.n.y + (cy - p.n.y) * e;
      const rg = g.createRadialGradient(x, y, 0, x, y, 10);
      rg.addColorStop(0, 'rgba(255,246,220,1)'); rg.addColorStop(0.3, 'rgba(246,220,152,.7)'); rg.addColorStop(1, 'rgba(214,178,110,0)');
      g.fillStyle = rg; g.beginPath(); g.arc(x, y, 10, 0, 7); g.fill();
    }
    // nodes
    nodes.forEach((n) => {
      const crit = n.a.st === 'crit', warn = n.a.st === 'warn';
      const r = 6 + n.hot * 4 + (n === hover ? 4 : 0);
      const rg = g.createRadialGradient(n.x - r * 0.3, n.y - r * 0.4, 0, n.x, n.y, r);
      rg.addColorStop(0, '#fff6dc'); rg.addColorStop(0.45, crit ? '#e0553f' : '#e2bb6c'); rg.addColorStop(1, crit ? '#6a140c' : '#6b4614');
      g.fillStyle = rg; g.beginPath(); g.arc(n.x, n.y, r, 0, 7); g.fill();
      if (crit || warn) { g.strokeStyle = crit ? 'rgba(224,85,63,.6)' : 'rgba(230,182,92,.45)'; g.lineWidth = 1; g.beginPath(); g.arc(n.x, n.y, r + 5 + Math.sin(t / 300) * 2, 0, 7); g.stroke(); }
      g.font = `${n === hover ? 600 : 400} 12px Meem`; g.textAlign = 'center';
      g.fillStyle = n === hover ? '#fbe7b6' : 'rgba(247,242,232,.62)';
      g.fillText(n.a.name, n.x, n.y + r + 16);
    });
    if (hover) {
      tip.style.opacity = 1; tip.style.transform = `translate(${hover.x}px, ${hover.y}px)`;
      tip.innerHTML = `<b>${hover.a.name}</b><span>${hover.a.metric}: ${hover.a.val}</span>`;
      cv.style.cursor = 'pointer';
    } else { tip.style.opacity = 0; cv.style.cursor = ''; }
    requestAnimationFrame(loop);
  })(last);

  cv.addEventListener('click', () => { if (hover) { fire(hover); onPulse?.(hover.a, true); } });
  return { dispose() { alive = false; clearInterval(iv); ro.disconnect(); core.dispose(); } };
}
