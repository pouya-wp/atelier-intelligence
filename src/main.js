import './styles.css';
import { createBackground } from './gl/background.js';
import { createOrb } from './gl/orb.js';
import * as sfx from './sfx.js';
import { I, LOGO } from './icons.js';
import { NAV, ROLES, OWNER, ORDERS_ANOMALY } from './data.js';
import { VIEWS, reportText } from './views.js';
import { live, onPrice } from './price.js';
import { fa, $, $$ } from './util.js';

const bg = createBackground($('#bg'));
$$('.brand .mark').forEach((m) => (m.innerHTML = LOGO));
$('#seal').innerHTML = LOGO;

/* ------------------------------------------------ Midas dust: the cursor sheds gold */
(function dust() {
  const c = $('#dust'), g = c.getContext('2d'), P = [];
  const fit = () => { c.width = innerWidth * devicePixelRatio; c.height = innerHeight * devicePixelRatio; g.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); };
  fit(); addEventListener('resize', fit);
  let lx = 0, ly = 0;
  addEventListener('pointermove', (e) => {
    const sp = Math.hypot(e.clientX - lx, e.clientY - ly); lx = e.clientX; ly = e.clientY;
    for (let i = 0; i < Math.min(4, sp / 6); i++) P.push({ x: e.clientX, y: e.clientY, vx: (Math.random() - 0.5) * 0.8, vy: Math.random() * 0.6 + 0.2, l: 1, s: Math.random() * 1.8 + 0.4 });
  });
  (function loop() {
    g.clearRect(0, 0, innerWidth, innerHeight);
    g.globalCompositeOperation = 'lighter';
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.015; p.l -= 0.018;
      if (p.l <= 0) { P.splice(i, 1); continue; }
      g.fillStyle = `rgba(247,${200 + p.l * 28 | 0},${130 + p.l * 50 | 0},${p.l * 0.85})`;
      g.beginPath(); g.arc(p.x, p.y, p.s * p.l + 0.3, 0, 7); g.fill();
    }
    requestAnimationFrame(loop);
  })();
})();

/* ------------------------------------------------ Vault intro */
const vaultSvg = $('#vaultSvg');
(function buildVault() {
  const C = 200; let s = '';
  s += `<defs><linearGradient id="vg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7e4b5"/><stop offset=".5" stop-color="#d4af6a"/><stop offset="1" stop-color="#6e5022"/></linearGradient>
    <filter id="vglow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
  // r1: fine ticks
  s += `<g class="ring r1">`; for (let i = 0; i < 120; i++) { const a = (i / 120) * Math.PI * 2, r0 = i % 10 ? 186 : 178; s += `<line x1="${C + Math.cos(a) * r0}" y1="${C + Math.sin(a) * r0}" x2="${C + Math.cos(a) * 194}" y2="${C + Math.sin(a) * 194}" stroke="url(#vg)" stroke-width="${i % 10 ? 0.6 : 1.4}" opacity="${i % 10 ? 0.5 : 1}"/>`; } s += `</g>`;
  // r2: numerals (karats & station names)
  const words = ['۷۵۰', 'ریخته‌گری', '۹۹۹٫۹', 'ساخت', '۷۰۵', 'تراش', '۸۷۵', 'آبکاری', '۹۱۶', 'خزانه'];
  s += `<g class="ring r2"><circle cx="${C}" cy="${C}" r="158" fill="none" stroke="rgba(212,175,106,.25)"/>`;
  words.forEach((w, i) => { const a = (i / words.length) * 360; s += `<text x="${C}" y="${C - 164}" transform="rotate(${a} ${C} ${C})" fill="#d4af6a" font-size="10" text-anchor="middle" opacity=".75" font-family="Vazirmatn">${w}</text>`; });
  s += `<circle cx="${C}" cy="${C}" r="140" fill="none" stroke="rgba(212,175,106,.18)" stroke-dasharray="1 5"/></g>`;
  // r3: bolts
  s += `<g class="ring r3">`; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; s += `<circle cx="${C + Math.cos(a) * 124}" cy="${C + Math.sin(a) * 124}" r="4" fill="url(#vg)" opacity=".8"/>`; } s += `</g>`;
  // progress arc
  s += `<circle id="prog" cx="${C}" cy="${C}" r="104" fill="none" stroke="url(#vg)" stroke-width="3" stroke-linecap="round" filter="url(#vglow)" transform="rotate(-90 ${C} ${C})" stroke-dasharray="653.5" stroke-dashoffset="653.5"/>`;
  vaultSvg.innerHTML = s;
})();

const LOG = [
  ['vault', 'treasury agent', 'reconciled 186.42 kg'],
  ['calc', 'pricing agent', 'live feed · XAU ' + live.ounce],
  ['face', 'face-id agent', '142/150 on site'],
  ['sync', 'rayvarz bridge', '412 vouchers synced'],
  ['alert', 'order sentinel', '1 anomaly held'],
  ['cube', 'render agent', 'GPU warm'],
];
let holding = false, prog = 0, unlocked = false, logShown = 0;
const HOLD = 1.6;
const seal = $('#seal'), vault = $('#vault'), progEl = $('#prog'), log = $('#bootLog');
function holdStart(e) {
  e.preventDefault();
  if (unlocked) return;
  sfx.initAudio().resume();
  holding = true; vault.classList.add('charging');
  sfx.chargeStart(HOLD * (1 - prog));
  $('#bootHint').innerHTML = 'در حال احراز هویت <b class="gold-text">مهر مدیر</b>…';
}
function holdEnd() {
  if (!holding || unlocked) return;
  holding = false; vault.classList.remove('charging'); sfx.chargeStop();
  $('#bootHint').innerHTML = 'مهر طلایی را <b class="gold-text">نگه دارید</b> تا خزانه باز شود';
}
seal.addEventListener('pointerdown', holdStart);
addEventListener('pointerup', holdEnd); addEventListener('pointercancel', holdEnd);
addEventListener('keydown', (e) => { if (!unlocked && (e.code === 'Enter' || e.code === 'Space') && !e.repeat) holdStart(e); });
addEventListener('keyup', (e) => { if (!unlocked && (e.code === 'Enter' || e.code === 'Space')) holdEnd(); });
let lastT = performance.now();
(function vaultLoop(t) {
  const dt = (t - lastT) / 1000; lastT = t;
  if (!unlocked) {
    prog = Math.max(0, Math.min(1, prog + (holding ? dt / HOLD : -dt * 1.5)));
    progEl.setAttribute('stroke-dashoffset', 653.5 * (1 - prog));
    bg.setIntensity(1.6 + prog * 2.4);
    const want = Math.floor(prog * LOG.length);
    while (logShown < want) {
      const [, a, b] = LOG[logShown++];
      log.innerHTML += `<div><b>▸ ${a}</b> … ${b} <span class="ok">✓</span></div>`;
      sfx.ting(880 + logShown * 220, 0.04, 0.5);
    }
    if (prog >= 1) openVault();
    requestAnimationFrame(vaultLoop);
  }
})(lastT);

function openVault() {
  unlocked = true; holding = false;
  sfx.unlock(); bg.pulse(2.5); bg.setIntensity(0.9);
  const fl = $('#flash'); fl.classList.add('go');
  const iris = $('#iris'); iris.classList.add('on');
  iris.innerHTML = Array.from({ length: 10 }, () => '<i></i>').join('');
  $('#boot').classList.add('gone');
  setTimeout(() => { $('#boot').remove(); }, 1200);
  $$('#iris i').forEach((b, i) => {
    const a = i * 36;
    b.animate([{ transform: `rotate(${a}deg) translateX(0)` }, { transform: `rotate(${a + 50}deg) translateX(110vmax)` }], { duration: 1500, delay: 250, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' });
  });
  setTimeout(() => { $('#app').classList.add('in'); document.body.classList.add('unlocked'); }, 450);
  setTimeout(() => { iris.remove(); sfx.startDrone(); }, 1900);
  setTimeout(() => toast('خوش آمدید، آقای ' + OWNER.short, 'خزانه باز شد. ۱۴ ایجنت گزارش آماده دارند.', 'vault'), 1600);
  setTimeout(() => { sfx.alarm(); toast('نگهبان سفارش — هشدار', `سفارش ${ORDERS_ANOMALY.who}: ${fa(ORDERS_ANOMALY.x)} برابر حد نرمال`, 'alert', 'crit'); }, 7000);
}

/* ------------------------------------------------ Shell: roles, nav, ticker, clock */
let role = 'owner', current = null, cleanup = null;

function renderRoles() {
  const r = $('#roles');
  r.innerHTML = '<span class="pill"></span>' + ROLES.map((x) => `<button data-role="${x.id}" class="${x.id === role ? 'on' : ''}">${x.label}</button>`).join('');
  requestAnimationFrame(movePill);
}
function movePill() {
  const on = $('#roles button.on'), pill = $('#roles .pill');
  if (!on) return;
  pill.style.left = `${on.offsetLeft}px`; pill.style.width = `${on.offsetWidth}px`;
}
$('#roles').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b || b.dataset.role === role) return;
  role = b.dataset.role;
  $$('#roles button').forEach((x) => x.classList.toggle('on', x === b)); movePill();
  const cur = $('#curtain'); $('#curtainLbl').textContent = `پنل ${b.textContent}`;
  cur.classList.remove('go'); void cur.offsetWidth; cur.classList.add('go');
  sfx.whoosh(1.1, true); setTimeout(() => sfx.ting(1318, 0.08, 1.2), 500);
  setTimeout(() => { renderNav(); const allowed = NAV.filter((n) => n.roles.includes(role)); go(allowed.some((n) => n.id === current) ? current : allowed[0].id, true); }, 580);
});

function renderNav() {
  const items = NAV.filter((n) => n.roles.includes(role));
  const groups = [['اصلی', items.slice(0, 3)], ['مالی و عملیات', items.slice(3)]];
  $('#nav').innerHTML = groups.filter(([, a]) => a.length).map(([l, a]) => `<div class="nav-label">${l}</div>` + a.map((n) => `<a href="#${n.id}" data-id="${n.id}" class="${n.id === current ? 'active' : ''}">${I[n.icon]}<span>${n.label}</span>${n.badge ? `<span class="badge ${n.g ? 'g' : ''}">${n.badge}</span>` : ''}</a>`).join('')).join('');
  $('#mnav').innerHTML = items.map((n) => `<a href="#${n.id}" data-id="${n.id}" class="${n.id === current ? 'active' : ''}">${n.label}</a>`).join('');
}

function go(id, force) {
  if (!VIEWS[id]) id = 'overview';
  if (id === current && !force) return;
  if (cleanup) { try { cleanup(); } catch (e) { console.warn(e); } cleanup = null; }
  current = id;
  $$('#nav a, #mnav a').forEach((a) => a.classList.toggle('active', a.dataset.id === id));
  const v = VIEWS[id](role);
  const main = $('#main'); main.innerHTML = v.html; main.scrollTop = 0;
  cleanup = v.mount ? v.mount(main) : null;
  if (location.hash !== `#${id}`) history.replaceState(null, '', `#${id}`);
}
addEventListener('hashchange', () => { go(location.hash.slice(1)); sfx.whoosh(0.6, true); });

function ticker() {
  const items = [['طلای ۱۸ عیار', 'g18', 'تومان'], ['انس جهانی', 'ounce', '$'], ['مثقال', 'mesghal', 'تومان'], ['سکه امامی', 'coin', 'تومان'], ['نیم سکه', 'half', 'تومان'], ['ربع سکه', 'quarter', 'تومان'], ['دلار آزاد', 'usd', 'تومان']];
  const one = items.map(([k, key, u]) => { const up = live[key] >= live.prev[key]; const pct = ((live[key] - live.prev[key]) / live.prev[key]) * 100; return `<span class="tk"><span class="k">${k}</span><span class="v num">${fa(live[key], key === 'ounce' ? 1 : 0)}</span><span class="k">${u}</span><span class="num ${up ? 'up' : 'down'}">${up ? '▲' : '▼'}${fa(Math.abs(pct), 2)}٪</span></span>`; }).join('');
  $('#ticker').innerHTML = one + one;
}
onPrice(() => { ticker(); sfx.blip(live.g18 >= live.prev.g18); });

function clock() {
  const d = new Date();
  $('#clockT').textContent = d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  $('#clockD').textContent = d.toLocaleDateString('fa-IR-u-ca-persian', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  $('#load').textContent = `${fa(30 + Math.round(Math.random() * 20))}٪`;
}
setInterval(clock, 1000);

/* ------------------------------------------------ Interactions: foil, tilt, sounds, toasts */
let hoverCard = null;
addEventListener('pointermove', (e) => {
  const card = e.target.closest?.('.card');
  if (hoverCard && hoverCard !== card && hoverCard.hasAttribute('data-tilt')) hoverCard.style.transform = '';
  hoverCard = card;
  if (!card) return;
  const r = card.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  card.style.setProperty('--mx', `${x}px`); card.style.setProperty('--my', `${y}px`);
  if (card.dataset.tilt === '') {
    const rx = ((y / r.height) - 0.5) * -6, ry = ((x / r.width) - 0.5) * 6;
    card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
  }
});
document.addEventListener('pointerover', (e) => {
  const t = e.target.closest?.('a, button, .agent, label[data-sfx]');
  if (t && !t.contains(e.relatedTarget)) sfx.hover();
});
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-sfx], .nav a, .mobile-nav a, .tabs button');
  if (t) sfx.click();
  const tb = e.target.closest('.tabs button');
  if (tb) { tb.parentElement.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === tb)); }
  const ts = e.target.closest('[data-toast]');
  if (ts) toast('انجام شد', ts.dataset.toast, 'check');
  if (e.target.closest('[data-speak]')) speak();
  const ag = e.target.closest('.agent');
  if (ag) { bg.pulse(0.8); toast(ag.querySelector('h4').textContent, 'ایجنت گزارش لحظه‌ای را آماده کرد.', 'agents'); }
});

export function toast(title, body, icon = 'bell', kind = '') {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.innerHTML = `<div class="ti">${I[icon] || I.bell}</div><div><b>${title}</b>${body}</div>`;
  $('#toasts').prepend(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 500); }, 5200);
}

/* ------------------------------------------------ Mute & bell */
const setMuteIcon = () => { $('#muteBtn').innerHTML = sfx.isMuted() ? I.mute : I.sound; };
$('#muteBtn').addEventListener('click', () => { sfx.setMuted(!sfx.isMuted()); setMuteIcon(); });
$('#bellBtn').innerHTML = I.bell;
$('#bellBtn').addEventListener('click', () => { sfx.alarm(); toast('سررسید فردا', 'چک ۱٫۸۵ میلیارد تومانی گالری ارغوان — معادل حدود ' + fa(1_850_000_000 / live.g18) + ' گرم طلا', 'cal', 'crit'); });
setMuteIcon();

/* ------------------------------------------------ Talking assistant */
const orb = createOrb($('#orb'));
let talking = false, talkTimer = null;
function speak() {
  const dock = $('#dock'), say = $('#say');
  if (talking) { stopTalk(); return; }
  sfx.initAudio().resume();
  talking = true; dock.classList.add('talking');
  const text = reportText().replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  let usedTTS = false;
  if ('speechSynthesis' in window) {
    const v = speechSynthesis.getVoices().find((x) => x.lang?.startsWith('fa'));
    if (v) {
      usedTTS = true;
      const u = new SpeechSynthesisUtterance(text); u.voice = v; u.lang = 'fa-IR'; u.rate = 1;
      u.onboundary = () => orb.setEnergy(0.6 + Math.random() * 0.4);
      u.onend = stopTalk; speechSynthesis.speak(u);
    }
  }
  // typewriter + synthesized voice texture (also drives the orb)
  let i = 0;
  say.textContent = '';
  talkTimer = setInterval(() => {
    i += 2; say.textContent = text.slice(Math.max(0, i - 140), i);
    orb.setEnergy(0.3 + Math.random() * 0.7);
    if (!usedTTS && i % 6 === 0) sfx.voiceChirp();
    if (i >= text.length) { clearInterval(talkTimer); if (!usedTTS) setTimeout(stopTalk, 1500); }
  }, 45);
}
function stopTalk() {
  talking = false; clearInterval(talkTimer); orb.setEnergy(0);
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  $('#dock').classList.remove('talking');
  $('#say').innerHTML = '«عقیق» گوش می‌دهد — روی گوی طلایی بزنید یا <kbd>Space</kbd>';
}
$('#orbBtn').addEventListener('click', () => { sfx.click(); speak(); });
addEventListener('keydown', (e) => { if (unlocked && e.code === 'Space' && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); speak(); } });

/* ------------------------------------------------ Boot */
renderRoles(); renderNav(); ticker(); clock();
if (new URLSearchParams(location.search).has('open')) { // skip the vault (handy for presenting a specific page)
  unlocked = true; $('#boot').remove(); $('#iris').remove(); bg.setIntensity(0.9);
  $('#app').classList.add('in'); document.body.classList.add('unlocked');
}
go(location.hash.slice(1) || 'overview', true);
addEventListener('resize', movePill);
