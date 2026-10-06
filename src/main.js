import './styles.css';
import { createOrb } from './gl/orb.js';
import * as sfx from './sfx.js';
import { I, logo } from './icons.js';
import { NAV, ROLES, OWNER, ORDERS_ANOMALY } from './data.js';
import { VIEWS, reportText } from './views.js';
import { live, onPrice } from './price.js';
import { fa, $, $$ } from './util.js';

$$('.brand .mark, .mbrand .mark').forEach((m) => (m.innerHTML = logo()));
$('#seal').innerHTML = logo();

/* ------------------------------------------------ Vault intro */
const vaultSvg = $('#vaultSvg');
(function buildVault() {
  // one hairline dial: 60 ticks, every fifth longer, and a thin progress arc
  const C = 200; let t = '';
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2, r0 = i % 5 ? 172 : 164;
    t += `<line x1="${C + Math.cos(a) * r0}" y1="${C + Math.sin(a) * r0}" x2="${C + Math.cos(a) * 178}" y2="${C + Math.sin(a) * 178}" stroke="currentColor" stroke-width="${i % 5 ? 0.6 : 1.1}" opacity="${i % 5 ? 0.35 : 0.8}"/>`;
  }
  vaultSvg.innerHTML = `<g class="ring r1">${t}</g>
    <circle cx="${C}" cy="${C}" r="150" fill="none" stroke="currentColor" stroke-opacity=".18"/>
    <circle id="prog" cx="${C}" cy="${C}" r="150" fill="none" stroke="#CB9B2D" stroke-width="1.5" transform="rotate(-90 ${C} ${C})" stroke-dasharray="942.5" stroke-dashoffset="942.5"/>`;
})();

let holding = false, prog = 0, unlocked = false;
const HOLD = 1.6;
const seal = $('#seal'), vault = $('#vault'), progEl = $('#prog');
function holdStart(e) {
  e.preventDefault();
  if (unlocked) return;
  sfx.initAudio().resume();
  holding = true; vault.classList.add('charging');
  sfx.chargeStart(HOLD * (1 - prog));
  $('#bootHint').innerHTML = 'در حال باز کردن <b class="gold-text">خزانه</b>…';
}
function holdEnd() {
  // a quick tap still opens the vault: once pressed, the charge completes on its own
  if (holding && !unlocked) return;
  if (!holding || unlocked) return;
  holding = false; vault.classList.remove('charging'); sfx.chargeStop();
  $('#bootHint').innerHTML = 'برای ورود روی <b class="gold-text">مهر طلایی</b> بزنید';
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
    progEl.setAttribute('stroke-dashoffset', 942.5 * (1 - prog));
    if (prog >= 1) openVault();
    requestAnimationFrame(vaultLoop);
  }
})(lastT);

function openVault() {
  unlocked = true; holding = false;
  sfx.unlock(); sfx.startMusic();
  $('#boot').classList.add('gone');
  setTimeout(() => $('#boot').remove(), 1200);
  setTimeout(() => { $('#app').classList.add('in'); document.body.classList.add('unlocked'); }, 350);
  setTimeout(() => toast(`خوش آمدید ${OWNER.call}`, 'بازرس ویژه گزارش امروز را آماده کرده است.', 'vault'), 1400);
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
  main.querySelector('.view')?.insertAdjacentHTML('beforeend', `<footer class="colophon"><span><b>AGHIGH GOLD</b> · YAZD 31.89°N 54.36°E</span><span>${NAV.findIndex((n) => n.id === id) + 1 < 10 ? '0' : ''}${NAV.findIndex((n) => n.id === id) + 1} / ${NAV.length} · ${id.toUpperCase()}</span><span>ATELIER AI · DEMO 1.0 · 1405</span></footer>`);
  // editorial heading reveal: split words into masked spans
  main.querySelectorAll('.head h2').forEach((h) => {
    let k = 0;
    const wrap = (node) => {
      [...node.childNodes].forEach((c) => {
        if (c.nodeType === 3) {
          const frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach((t) => {
            if (!t.trim()) { frag.append(t); return; }
            const w = document.createElement('span'); w.className = 'w';
            w.innerHTML = `<span style="animation-delay:${0.08 + k++ * 0.07}s">${t}</span>`; frag.append(w);
          });
          c.replaceWith(frag);
        } else wrap(c);
      });
    };
    wrap(h);
  });
  cleanup = v.mount ? v.mount(main) : null;
  if (location.hash !== `#${id}`) { try { history.replaceState(null, '', `#${id}`); } catch { /* sandboxed frame */ } }
}
addEventListener('hashchange', () => { go(location.hash.slice(1)); sfx.whoosh(0.6, true); });

function ticker() {
  const items = [['طلای ۱۸ عیار', 'g18', 'تومان'], ['انس جهانی', 'ounce', '$'], ['مثقال', 'mesghal', 'تومان'], ['سکه امامی', 'coin', 'تومان'], ['نیم سکه', 'half', 'تومان'], ['ربع سکه', 'quarter', 'تومان'], ['دلار آزاد', 'usd', 'تومان']];
  const one = items.map(([k, key, u]) => { const up = live[key] >= live.prev[key]; const pct = ((live[key] - live.prev[key]) / live.prev[key]) * 100; return `<span class="tk"><span class="k">${k}</span><span class="v num">${fa(live[key], key === 'ounce' ? 1 : 0)}</span><span class="k">${u}</span><span class="num ${up ? 'up' : 'down'}">${up ? '▲' : '▼'}${fa(Math.abs(pct), 2)}٪</span></span>`; }).join('');
  $('#ticker').innerHTML = one + one;
}
onPrice(ticker);

function clock() {
  const d = new Date();
  $('#clockT').textContent = d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  $('#clockD').textContent = d.toLocaleDateString('fa-IR-u-ca-persian', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  $('#load').textContent = `${fa(30 + Math.round(Math.random() * 20))}٪`;
}
setInterval(clock, 1000);

/* ------------------------------------------------ Interactions: sounds, toasts */
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-sfx], .nav a, .mobile-nav a, .tabs button');
  if (t) sfx.click();
  const tb = e.target.closest('.tabs button');
  if (tb) { tb.parentElement.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === tb)); }
  const ts = e.target.closest('[data-toast]');
  if (ts) toast('انجام شد', ts.dataset.toast, 'check');
  if (e.target.closest('[data-speak]')) speak();
  const ag = e.target.closest('.agent');
  if (ag) { toast(ag.querySelector('h4').textContent, 'ایجنت گزارش لحظه‌ای را آماده کرد.', 'agents'); }
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
  $('#say').innerHTML = 'بازرس ویژه <kbd>Space</kbd>';
}
$('#orbBtn').addEventListener('click', () => { sfx.click(); speak(); });
addEventListener('keydown', (e) => { if (unlocked && e.code === 'Space' && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); speak(); } });

/* ------------------------------------------------ Boot */
renderRoles(); renderNav(); ticker(); clock();
if (new URLSearchParams(location.search).has('open')) { // skip the vault (handy for presenting a specific page)
  unlocked = true; $('#boot').remove();
  $('#app').classList.add('in'); document.body.classList.add('unlocked');
}
go(location.hash.slice(1) || 'overview', true);
addEventListener('resize', movePill);
