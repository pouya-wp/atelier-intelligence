import { I } from './icons.js';
import { OWNER, ORDERS_ANOMALY } from './data.js';
import { live } from './price.js';
import { fa } from './util.js';
import * as sfx from './sfx.js';

// «بازرس ویژه» — a calm conversation for آقا رضا. Short, plain sentences shown one at a time at
// reading pace (and read aloud slowly when a Persian voice exists), big type, and big buttons
// instead of typing. Nothing scrolls past faster than it can be read.

const toman = (n) => {
  if (n >= 1e9) return `${fa(n / 1e9, 2).replace(/٫?۰+$/, '')} میلیارد تومان`;
  if (n >= 1e6) return `${fa(Math.round(n / 1e6))} میلیون تومان`;
  return `${fa(n)} تومان`;
};
const grams = (amount) => fa(Math.round(amount / live.g18));

// each answer: a list of short sentences; an optional action row at the end
const TOPICS = {
  today: { q: 'امروز چه خبر؟', icon: 'report', a: () => [
    `سلام ${OWNER.call}، روزتان بخیر.`,
    'امروز روز خوبی بود.',
    'فروش امروز نزدیک ۸ کیلو بود؛ کمی بیشتر از دیروز.',
    '۱۴۲ نفر از ۱۵۰ نفر سر کار هستند.',
    'یک موضوع مهم هست که باید ببینید: در تحویل طلا به دستگاه تراش، ۱۲ گرم اختلاف دیده شده.',
    'اگر بخواهید، توضیح بیشتر می‌دهم.',
  ] },
  price: { q: 'قیمت طلا چند است؟', icon: 'coin', a: () => {
    const up = live.g18 >= live.prev.g18;
    return [
      `هر گرم طلای ۱۸ عیار، الان ${toman(live.g18)} است.`,
      up ? 'از صبح تا الان، قیمت کمی بالا رفته.' : 'از صبح تا الان، قیمت کمی پایین آمده.',
      `انس جهانی هم ${fa(Math.round(live.ounce))} دلار است.`,
    ];
  } },
  checks: { q: 'چک‌ها و پرداخت‌ها', icon: 'cal', a: () => [
    `فردا یک چک ${toman(4_100_000_000)} از گالری ارغوان می‌گیرید.`,
    `این مبلغ، با قیمت امروز، حدود ${grams(4_100_000_000)} گرم طلاست.`,
    `سه روز دیگر هم یک چک ${toman(1_420_000_000)} به تأمین آلیاژ نوین می‌دهید.`,
    'حساب برای هر دو کافی است.',
  ] },
  problems: { q: 'مشکلی هست؟', icon: 'alert', a: () => [
    'یک مورد مهم هست.',
    'امروز ساعت یک و نیم، از خزانه طلا به دستگاه تراش رفت؛ ۱۲ گرم کمتر رسید.',
    'به نظرم ترازوی ایستگاه ۴ باید امروز بررسی شود.',
    'دو مورد کوچک‌تر هم هست: افت واحد ساخت کمی بالاست، و سه نفر چند بار دیر آمده‌اند.',
  ] },
  staff: { q: 'کارکنان', icon: 'people', a: () => [
    '۱۴۲ نفر از ۱۵۰ نفر امروز آمده‌اند.',
    '۲۳ نفر تا شب اضافه‌کاری دارند.',
    'برای همین ۲۳ نفر، شام سفارش داده شد.',
  ] },
  order: { q: 'سفارش منتظر تأیید', icon: 'cart', a: () => [
    `${ORDERS_ANOMALY.who} سفارش ${fa(ORDERS_ANOMALY.kg, 1)} کیلو داده.`,
    `این ${fa(ORDERS_ANOMALY.x)} برابر سفارش همیشگی آن‌هاست.`,
    'موجودی انبار برای این سفارش کافی نیست.',
    'تأیید می‌کنید؟',
  ], actions: [['تأیید کن', 'سفارش تأیید شد. به انبار خبر دادم.'], ['فعلاً نه', 'باشد، سفارش نگه داشته شد.']] },
};

export function createInspector({ orb }) {
  const el = document.createElement('section');
  el.className = 'insp'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'بازرس ویژه');
  el.innerHTML = `
    <header class="insp-h">
      <div class="insp-av">${I.mic}</div>
      <div class="insp-ttl"><b>بازرس ویژه</b><span>در خدمت شما، ${OWNER.call}</span></div>
      <button class="insp-x" data-x aria-label="بستن">✕</button>
    </header>
    <div class="insp-log" aria-live="polite"></div>
    <footer class="insp-f">
      <div class="insp-ask">${Object.entries(TOPICS).map(([k, t]) => `<button data-q="${k}">${I[t.icon]}<span>${t.q}</span></button>`).join('')}</div>
      <div class="insp-ctl">
        <button class="insp-mic" data-mic>${I.mic}<span>بپرسید</span></button>
        <button class="insp-stop" data-stop>${I.mute}<span>ساکت</span></button>
        <button class="insp-big" data-big aria-label="درشت‌تر">الف+</button>
      </div>
    </footer>`;
  document.body.appendChild(el);
  const log = el.querySelector('.insp-log');

  let open = false, run = 0, busy = false;
  const voice = () => ('speechSynthesis' in window ? speechSynthesis.getVoices().find((v) => v.lang?.startsWith('fa')) : null);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  const bubble = (cls, html) => {
    const b = document.createElement('div'); b.className = `insp-b ${cls}`; b.innerHTML = html;
    log.appendChild(b); requestAnimationFrame(() => b.classList.add('in'));
    log.scrollTo({ top: log.scrollHeight, behavior: 'smooth' });
    return b;
  };

  // say one sentence: show it, read it slowly, then pause long enough to read it twice
  async function say(text, id) {
    const dots = bubble('me typing', '<i></i><i></i><i></i>');
    await wait(650); dots.remove();
    if (id !== run) return;
    log.querySelectorAll('.insp-b.me.now').forEach((b) => b.classList.remove('now'));
    bubble('me now', text);
    const v = voice();
    const readMs = Math.max(2400, text.length * 85);
    if (v) {
      await new Promise((res) => {
        const u = new SpeechSynthesisUtterance(text); u.voice = v; u.lang = 'fa-IR'; u.rate = 0.82; u.pitch = 0.95;
        u.onboundary = () => orb.setEnergy(0.35 + Math.random() * 0.3);
        u.onend = u.onerror = res; speechSynthesis.speak(u);
        setTimeout(res, readMs * 2.5); // never hang on a silent voice
      });
      orb.setEnergy(0.1); await wait(700);
    } else {
      const iv = setInterval(() => orb.setEnergy(0.2 + Math.random() * 0.25), 160);
      await wait(readMs); clearInterval(iv); orb.setEnergy(0.1);
    }
  }

  async function ask(key) {
    const t = TOPICS[key]; if (!t) return;
    stop(); const id = ++run; busy = true; el.classList.add('busy');
    bubble('you', t.q);
    for (const s of t.a()) { if (id !== run) return; await say(s, id); }
    if (id !== run) return;
    if (t.actions) {
      const row = bubble('acts', t.actions.map(([l], i) => `<button data-act="${i}">${l}</button>`).join(''));
      row.addEventListener('click', async (e) => {
        const b = e.target.closest('[data-act]'); if (!b) return;
        const [l, reply] = t.actions[+b.dataset.act]; row.remove(); sfx.click();
        const id2 = ++run; bubble('you', l); await say(reply, id2);
      });
    }
    const again = bubble('again', `<button>${I.sync}<span>دوباره بگو</span></button>`);
    again.querySelector('button').addEventListener('click', () => { again.remove(); ask(key); });
    busy = false; el.classList.remove('busy'); orb.setEnergy(0);
  }

  function stop() {
    run++; busy = false; el.classList.remove('busy', 'listening');
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    log.querySelectorAll('.typing').forEach((b) => b.remove());
    orb.setEnergy(0);
  }

  // demo microphone: listens for a moment, then "hears" the most common question
  async function listen() {
    stop(); const id = run; el.classList.add('listening');
    await wait(2200);
    if (id !== run) return;
    el.classList.remove('listening'); ask('today');
  }

  el.addEventListener('click', (e) => {
    const q = e.target.closest('[data-q]');
    if (q) { sfx.click(); ask(q.dataset.q); }
    if (e.target.closest('[data-x]')) toggle(false);
    if (e.target.closest('[data-stop]')) stop();
    if (e.target.closest('[data-mic]')) { sfx.click(); listen(); }
    if (e.target.closest('[data-big]')) el.classList.toggle('big');
  });

  function toggle(force, greet = true) {
    open = force ?? !open;
    el.classList.toggle('open', open);
    document.body.classList.toggle('insp-open', open);
    if (!open) stop();
    else if (greet && !log.children.length) ask('today');
    return open;
  }

  return { toggle, ask: (k) => { toggle(true, false); ask(k); }, isOpen: () => open, isBusy: () => busy };
}
