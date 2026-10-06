import { I } from './icons.js';
import { fa, toman, sparkline, areaChart, donut, bars, countUp, rand } from './util.js';
import { OWNER, AGENTS, STATIONS, ADMIN_UNITS, STAFF, DUE, TODOS, NEWS, STOCK, MAKERS, RETURNS, DEFECTS, ORDERS_ANOMALY, CODES, ORDER_CHECK, FINDINGS, DEFECT_RATE, GOLD_INVOICES } from './data.js';
import { live, onPrice } from './price.js';
import { createIngotScene } from './gl/ingot.js';
import { createConstellation } from './gl/constellation.js';
import { mountLogo } from './gl/logo3d.js';
import * as sfx from './sfx.js';

const series = (n, base, vol, drift = 0) => { let v = base; return Array.from({ length: n }, () => (v += (Math.random() - 0.48 + drift) * vol)); };
const days = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
const hoursLbl = Array.from({ length: 48 }, (_, i) => `${fa(8 + Math.floor(i / 4))}:${fa((i % 4) * 15).padStart(2, '۰')}`);
const goldEq = (amount) => amount / live.g18; // grams of 18k

const head = (eye, title, sub, actions = '') => `<div class="head"><div><div class="eyebrow">${eye}</div><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div><div style="display:flex;gap:10px;flex-wrap:wrap">${actions}</div></div>`;
const chip = (st, txt) => `<span class="chip ${st}">${st === 'ok' || st === 'warn' || st === 'crit' ? `<span class="dot ${st === 'ok' ? '' : st}"></span>` : ''}${txt}</span>`;

function kpi(label, val, unit, delta, spark, up = true, dec = 0) {
  return `<div class="card kpi c3"><div class="label">${label}${spark ? '' : ''}</div>
    <div class="val num"><span data-count="${val}" data-dec="${dec}">۰</span><small>${unit}</small></div>
    <div class="delta"><span class="${up ? 'up' : 'down'}">${up ? '▲' : '▼'} ${delta}</span> نسبت به دیروز</div>${spark}</div>`;
}

// ---------------------------------------------------------------- overview
function overview(role) {
  const greet = (() => { const h = new Date().getHours(); return h < 12 ? 'صبح بخیر' : h < 17 ? 'روز بخیر' : 'عصر بخیر'; })();
  const due = DUE[0];
  return {
    html: `<section class="view">
      <div class="card hero gold" data-tilt="0">
        <canvas class="gl" id="ingot"></canvas>
        <div class="hero-copy">
          <div class="greet">${greet} ${OWNER.call} — امروز ${new Date().toLocaleDateString('fa-IR-u-ca-persian', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          <div class="caps muted" style="margin-top:6px">ارزش لحظه‌ای کل طلای در گردش</div>
          <div class="big num gold-text" id="heroVal">—</div>
          <div class="stats">
            <div><span>کل طلا (۱۸ عیار)</span><b class="num"><span data-count="186.42" data-dec="2">۰</span> کیلو</b></div>
            <div><span>فروش امروز</span><b class="num"><span data-count="7.84" data-dec="2">۰</span> کیلو</b></div>
            <div><span>افت کل خط</span><b class="num"><span data-count="0.66" data-dec="2">۰</span>٪</b></div>
            <div><span>پرسنل حاضر</span><b class="num"><span data-count="142">۰</span> / ۱۵۰</b></div>
          </div>
        </div>
        <div class="stamp">${chip('gold', '۱۳ ایجنت فعال')}${chip('ok', 'همگام با رایورز')}${chip('ok', 'خزانه تطبیق شد')}</div>
        <div class="hint3d">AGHIGH · ATELIER · 999.9 · YAZD</div>
      </div>

      <div class="alert mt" id="anomaly">
        <div class="ai">${I.alert}</div>
        <div class="x"><b>نگهبان سفارش:</b> سفارش امروز ${ORDERS_ANOMALY.who} <b class="num">${fa(ORDERS_ANOMALY.kg, 1)} کیلو</b> است — <b>${fa(ORDERS_ANOMALY.x)} برابر</b> میانگین ۳۰ روزه (${fa(ORDERS_ANOMALY.normal, 1)} کیلو). تا تأیید شما در صف نگه داشته شد.</div>
        <button class="btn ghost" data-sfx>بررسی</button><button class="btn" data-sfx data-toast="سفارش تأیید شد و به خط تولید رفت">تأیید</button>
      </div>

      <div class="grid mt">
        ${kpi('هر گرم طلای ۱۸ عیار', live.g18 / 1e6, 'میلیون تومان', '۱٫۲٪', sparkline(series(30, 50, 3, 0.05)), true, 2)}
        ${kpi('انس جهانی', live.ounce, 'دلار', '۰٫۸٪', sparkline(series(30, 50, 3, 0.04)), true, 1)}
        ${kpi('فروش امروز', 92.8, 'میلیارد تومان', '۹٪', sparkline(series(30, 50, 4, 0.06)), true, 1)}
        ${kpi('هزینه جاری ماه', 1.84, 'میلیارد تومان', '۳٪', sparkline(series(30, 50, 2, -0.03), { color: '#b42318' }), false, 2)}
      </div>

      <div class="grid mt">
        <div class="card c8">
          <div class="ch"><h3>قیمت لحظه‌ای هر گرم ۱۸ عیار <small>امروز · هر ۱۵ دقیقه</small></h3><div class="tabs"><button class="on">امروز</button><button>هفته</button><button>ماه</button></div></div>
          <div class="chart" id="priceChart"></div>
        </div>
        <div class="card c4">
          <div class="ch"><h3>سررسید امروز</h3>${chip('crit', 'فوری')}</div>
          <div style="display:grid;gap:14px">
            ${DUE.slice(0, 3).map((d) => `<div style="display:grid;gap:4px;padding-bottom:12px;border-bottom:1px dashed var(--line)">
              <div style="display:flex;justify-content:space-between;gap:8px;font-size:15px"><span>${d.t}</span><span class="muted" style="white-space:nowrap">${fa(d.d)} روز</span></div>
              ${d.a ? `<div style="display:flex;justify-content:space-between;font-size:14px"><span class="num">${fa(d.a / 1e6)} میلیون</span><span class="gold-text num" data-goldeq="${d.a}">≈ ${fa(goldEq(d.a), 0)} گرم طلا</span></div>` : '<div class="muted" style="font-size:14px">ارسال فیزیکی</div>'}
            </div>`).join('')}
            <div class="muted" style="font-size:13.5px;line-height:1.8">معادل طلایی هر پرداخت با قیمت لحظه‌ای به‌روز می‌شود.</div>
          </div>
        </div>
      </div>

      <div class="grid mt">
        <div class="card c5 inspector">
          <div class="ch"><h3>${I.lock.replace('<svg', '<svg width="15"')} بازرس ویژه <small>نسخه اختصاصی ${OWNER.call}</small></h3>${chip('warn', `${fa(FINDINGS.length)} یافته`)}</div>
          <div class="finds">${FINDINGS.map((f) => `<div class="fd ${f.lvl}"><b>${f.t}</b><span>${f.d}</span></div>`).join('')}</div>
          <button class="btn ghost" data-speak style="margin-top:14px;width:100%;justify-content:center">${I.sound} گزارش بازرس را بشنو</button>
        </div>
        <div class="card c7">
          <div class="ch"><h3>فروش هفته <small>کیلوگرم</small></h3></div>
          ${bars([6.2, 7.1, 5.4, 8.8, 7.9, 9.6, 7.84], days, { hi: 5, fmt: (v) => fa(v, 1), h: 210 })}
        </div>
      </div>
    </section>`,
    mount(root) {
      countUp(root);
      const gl = createIngotScene(root.querySelector('#ingot'));
      areaChart(root.querySelector('#priceChart'), series(48, live.g18 * 0.985, 22000, 0.08).map((v) => Math.round(v)), hoursLbl, { fmt: (v) => `${fa(v)} تومان` });
      const heroVal = root.querySelector('#heroVal');
      const setHero = () => { heroVal.innerHTML = `${fa((186420 * live.g18) / 1e12, 3)} <small>هزار میلیارد تومان</small>`; };
      setHero();
      const off = onPrice(() => {
        setHero();
        root.querySelectorAll('[data-goldeq]').forEach((el) => { el.textContent = `≈ ${fa(goldEq(+el.dataset.goldeq), 0)} گرم طلا`; });
      });
      return () => { gl.dispose(); off(); };
    },
  };
}

// ---------------------------------------------------------------- agents
function agents() {
  return {
    html: `<section class="view">
      ${head('AGENT CONSTELLATION', '<b>۱۳</b> ایجنت، یک ذهن طلایی', 'هر ایجنت یک بخش از کار را شبانه‌روز زیر نظر دارد.', `<button class="btn ghost" data-sfx>${I.sync} آموزش مجدد</button><button class="btn" data-sfx data-toast="ایجنت جدید در حال ساخت است">${I.spark} ایجنت جدید</button>`)}
      <div class="grid">
        <div class="card c8 cst-card" style="padding:0">
          <div class="cst-wrap"><canvas class="cst"></canvas><canvas class="core"></canvas><div class="cst-tip"></div>
            <div class="cst-label"><span class="eyebrow" style="margin:0">ATELIER MIND</span><b class="metal">هسته عقیق</b><span class="muted">روی هر ایجنت بزنید</span></div></div>
        </div>
        <div class="card c4"><div class="ch"><h3>تپش‌های زنده</h3>${chip('ok', 'جریان داده')}</div><div class="feed" id="pulseLog"></div></div>
      </div>
      <div class="grid mt">
        ${AGENTS.map((a, i) => `<div class="card agent ${a.id === 'voice' ? 'c12 agent-feature' : 'c3'}" title="${a.desc}">
          <div class="top-row"><div class="ic">${I[a.icon]}</div>${chip(a.st, a.st === 'ok' ? 'فعال' : a.st === 'warn' ? 'نیاز به توجه' : 'هشدار')}</div>
          <h4>${a.name}</h4>
          <div class="metric"><span>${a.metric}</span><b class="num">${a.val}</b></div>
        </div>`).join('')}
      </div>
    </section>`,
    mount(root) {
      const log = root.querySelector('#pulseLog');
      const msgs = { treasury: 'تطبیق موجودی خزانه', pricing: 'قیمت جدید به فاکتورها رفت', face: 'ورود پرسنل ثبت شد', due: 'سررسید بررسی شد', stock: 'موجودی انبار به‌روز شد', anomaly: 'سفارش‌ها پایش شد', report: 'بخشی به گزارش امشب اضافه شد', news: 'خبر جدید تحلیل شد', meal: 'لیست غذا به‌روز شد', proc: 'پیشنهاد خرید بازبینی شد', cost: 'هزینه به مرکز هزینه تسهیم شد', rayvarz: 'سند به رایورز رفت', voice: 'دستیار آماده پاسخ است' };
      const c = createConstellation(root.querySelector('.cst-wrap'), AGENTS, {
        onPulse(a, clicked) {
          const d = new Date(), it = document.createElement('div');
          it.className = 'it new';
          it.innerHTML = `<div class="ico ${a.st === 'crit' ? 'crit' : ''}">${I[a.icon]}</div><div><b>${a.name}</b> <span class="s">${msgs[a.id]}</span></div><time>${d.toLocaleTimeString('fa-IR')}</time>`;
          log.prepend(it); if (log.children.length > 7) log.lastChild.remove();
          if (clicked) sfx.ting(1568, 0.08, 1.4);
        },
      });
      return () => c.dispose();
    },
  };
}

// ---------------------------------------------------------------- production line
function line() {
  const totalStaff = STATIONS.reduce((a, s) => a + s.staff, 0) + ADMIN_UNITS.reduce((a, s) => a + s.staff, 0);
  return {
    html: `<section class="view">
      ${head('COST CENTERS', 'مسیر طلا، از <b>کوره تا ویترین</b>', 'هر واحد یک مرکز هزینه است؛ وزن، افت و هزینه زنده.', chip('gold', `${fa(totalStaff)} نفر در ${fa(STATIONS.length + ADMIN_UNITS.length)} واحد`))}
      <div class="card" style="padding:26px 22px 18px;overflow:hidden">
        <svg id="flow" viewBox="0 0 1200 120" style="width:100%;height:120px;display:block;overflow:visible"></svg>
        <div id="stations" style="display:grid;grid-template-columns:repeat(${STATIONS.length},minmax(0,1fr));gap:10px;margin-top:-8px"></div>
      </div>
      <div class="grid mt">
        <div class="card c7">
          <div class="ch"><h3>افت طلا به تفکیک ایستگاه <small>درصد · این ماه</small></h3>${chip('warn', 'ساخت بالاتر از استاندارد')}</div>
          <div id="lossBars"></div>
        </div>
        <div class="card c5">
          <div class="ch"><h3>واحدهای اداری <small>جدا از تولید</small></h3></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            ${ADMIN_UNITS.map((u) => `<div class="card" style="padding:16px;display:grid;gap:10px"><div class="ic" style="color:var(--gold)">${I[u.icon].replace('<svg', '<svg width="22" height="22"')}</div><b style="font-size:14px">${u.name}</b><span class="muted" style="font-size:12px">${fa(u.staff)} نفر</span></div>`).join('')}
          </div>
        </div>
      </div>
      <div class="card mt"><div class="ch"><h3>آمار خرابی هر واحد <small>در هر ۱۰۰ قطعه — امروز در برابر دیروز و میانگین ماه قبل</small></h3><div class="legend"><span><i style="background:#0e5a44"></i>امروز</span><span><i style="background:#3c5a80"></i>دیروز</span><span><i style="background:#d5dfda"></i>ماه قبل</span></div></div>
        <div class="dfx">${DEFECT_RATE.map((r) => { const better = r.d <= r.y; const vsM = ((r.d - r.m) / r.m) * 100; const mx = 4; return `<div class="dfx-r">
          <b>${r.u}</b>
          <div class="dfx-bars"><i style="width:${(r.d / mx) * 100}%;background:#0e5a44"></i><i style="width:${(r.y / mx) * 100}%;background:#3c5a80;opacity:.75"></i><i style="width:${(r.m / mx) * 100}%;background:#d5dfda"></i></div>
          <span class="num">${fa(r.d, 1)}</span>
          ${chip(better ? 'ok' : 'crit', `${better ? '▼ بهبود' : '▲ بدتر'} ${fa(Math.abs(vsM), 0)}٪ نسبت به ماه قبل`)}
        </div>`; }).join('')}</div></div>
      <div class="card mt"><div class="ch"><h3>جدول مراکز هزینه</h3><small class="muted">مبالغ به میلیون تومان · ماه جاری</small></div>
        <div class="scroll-x"><table class="tbl"><thead><tr><th>ایستگاه</th><th>پرسنل</th><th>طلای در جریان</th><th>افت</th><th>هزینه ماه</th><th>بهره‌وری</th><th style="width:22%"></th></tr></thead><tbody>
        ${STATIONS.map((s) => `<tr><td><div class="who"><div class="av">${I[s.icon].replace('<svg', '<svg width="14" height="14"')}</div>${s.name}</div></td><td class="num">${fa(s.staff)}</td><td class="num">${fa(s.wip, 1)} کیلو</td><td class="num ${s.loss > 0.15 ? 'down' : ''}">${fa(s.loss, 2)}٪</td><td class="num">${fa(s.cost)}</td><td class="num">${fa(s.util)}٪</td><td><div class="meter"><i style="width:${s.util}%"></i></div></td></tr>`).join('')}
        </tbody></table></div></div>
    </section>`,
    mount(root) {
      const svg = root.querySelector('#flow'), n = STATIONS.length, W = 1200, step = W / n;
      const xs = STATIONS.map((_, i) => W - (i + 0.5) * step); // RTL flow: right → left
      const path = `M${xs[0]},60 ` + xs.slice(1).map((x, i) => `C${xs[i] - step / 2},${i % 2 ? 20 : 100} ${x + step / 2},${i % 2 ? 100 : 20} ${x},60`).join(' ');
      svg.innerHTML = `<defs><linearGradient id="fl" x1="1" x2="0"><stop offset="0" stop-color="#1f7a5e"/><stop offset="1" stop-color="#0e5a44"/></linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
        <path id="fp" d="${path}" fill="none" stroke="rgba(14,90,68,.08)" stroke-width="14" stroke-linecap="round"/>
        <path d="${path}" fill="none" stroke="url(#fl)" stroke-width="2" stroke-dasharray="2 10" stroke-linecap="round"><animate attributeName="stroke-dashoffset" from="0" to="-120" dur="2s" repeatCount="indefinite"/></path>
        ${Array.from({ length: 16 }, (_, i) => `<circle r="${2 + (i % 3)}" fill="#b59457"><animateMotion dur="${9 + (i % 4)}s" begin="${-i * 0.7}s" repeatCount="indefinite"><mpath href="#fp"/></animateMotion></circle>`).join('')}
        ${xs.map((x, i) => `<g transform="translate(${x},60)"><circle r="21" fill="#fff" stroke="${i === 1 ? '#b7791f' : '#0e5a44'}" stroke-width="1.5"/><circle r="26" fill="none" stroke="rgba(14,90,68,.2)"><animate attributeName="r" values="22;32;22" dur="${2.4 + i * 0.2}s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0;1" dur="${2.4 + i * 0.2}s" repeatCount="indefinite"/></circle><g transform="translate(-9,-9) scale(.75)" color="#0e5a44">${I[STATIONS[i].icon]}</g></g>`).join('')}`;
      svg.querySelectorAll('g > g > svg').forEach((s) => { s.setAttribute('width', 24); s.setAttribute('height', 24); });
      root.querySelector('#stations').innerHTML = STATIONS.map((s) => `<div style="text-align:center;display:grid;gap:4px">
        <b style="font-size:13px">${s.name}</b><span class="num" style="font-size:13px;color:var(--emerald)" data-wip="${s.wip}">${fa(s.wip, 1)} کیلو</span>
        <span class="muted" style="font-size:11px">افت ${fa(s.loss, 2)}٪ · ${fa(s.staff)} نفر</span></div>`).join('');
      const prod = STATIONS.filter((s) => s.loss > 0);
      root.querySelector('#lossBars').innerHTML = bars(prod.map((s) => s.loss), prod.map((s) => s.name), { hi: 1, fmt: (v) => `${fa(v, 2)}٪`, h: 190 });
      const iv = setInterval(() => {
        root.querySelectorAll('[data-wip]').forEach((el) => { const v = +el.dataset.wip + rand(-0.05, 0.05); el.dataset.wip = v; el.textContent = `${fa(v, 1)} کیلو`; });
      }, 2500);
      return () => clearInterval(iv);
    },
  };
}

// ---------------------------------------------------------------- invoice
function invoice() {
  const wageOf = (g, pct) => (g * pct) / 100;
  const fmtG = (g) => `${fa(g, g % 1 ? 1 : 0)} گرم`;
  const todayWage = GOLD_INVOICES.reduce((t, x) => t + wageOf(x.g, x.pct), 0);
  const todaySold = GOLD_INVOICES.reduce((t, x) => t + x.g, 0);
  return {
    html: `<section class="view">
      ${head('GOLD INVOICE', 'فاکتور <b>طلایی</b>', 'اجرت هر فاکتور به گرم طلا نوشته می‌شود.')}
      <div class="grid">
        <div class="card c7">
          <div class="ch"><h3>اقلام فاکتور</h3>${chip('ok', 'قیمت زنده')}</div>
          <div class="form">
            <div class="field"><label for="buyer">خریدار</label><select id="buyer"><option>گالری ارغوان — تهران</option><option>نمایندگی شیراز</option><option>طلای پارسیان — مشهد</option><option>گالری ماهان — کرمان</option><option>نمایندگی اصفهان</option></select></div>
            <div class="field"><label for="prod">محصول</label><select id="prod"><option>النگو ماشینی</option><option>زنجیر کارتیه</option><option>سرویس عقیق دست‌ساز</option><option>انگشتر CNC</option></select></div>
            <div class="field"><label for="w">وزن (گرم)</label><input id="w" type="number" value="1000" step="0.01" min="0"></div>
            <div class="field"><label for="wp">اجرت (٪)</label><input id="wp" type="number" value="10" step="0.5" min="0"></div>
            <div class="field"><label for="k">عیار</label><select id="k"><option value="750">۱۸ عیار (۷۵۰)</option><option value="705">۱۷ عیار (۷۰۵)</option><option value="875">۲۱ عیار (۸۷۵)</option></select></div>
            <div class="field"><label for="p">سود فروشنده (٪)</label><input id="p" type="number" value="7" step="0.5" min="0"></div>
          </div>
          <div class="mt" style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" id="issue" data-sfx>${I.invoice} صدور و ثبت در رایورز</button><button class="btn ghost" data-sfx data-toast="قیمت برای ۱۰ دقیقه قفل شد">${I.lock} قفل قیمت</button></div>
        </div>
        <div class="c5"><div class="receipt gold-receipt" id="rcpt">
          <div class="live"><span class="dot"></span>رسید</div>
          <div class="gr-head"><div class="rlogo"></div><div><b>طلای عقیق</b><span>کارخانه طلای عقیق · یزد</span></div></div>
          <div id="rl"></div>
          <div class="gr-wage"><span id="wageLbl">اجرت</span><b id="wageG">—</b><small id="wageT"></small></div>
          <div class="tot"><span>مبلغ قابل پرداخت</span><b class="num" id="tot"></b></div>
          <div class="gr-note" id="totw"></div>
        </div></div>
      </div>
      <div class="card mt" >
        <div class="ch"><h3>فاکتورهای امروز</h3><span id="giChip">${chip('gold', `اجرت امروز: ${fmtG(todayWage)} طلا`)}</span></div>
        <div class="scroll-x"><table class="tbl gi-tbl"><thead><tr><th>شماره</th><th>خریدار</th><th>کالا</th><th>وزن</th><th>اجرت</th><th class="end">اجرت به طلا</th></tr></thead>
        <tbody id="giRows">${GOLD_INVOICES.map((x) => `<tr><td class="num muted">${fa(x.no)}</td><td>${x.who}</td><td class="muted">${x.item}</td><td class="num">${fa(x.g)} گرم</td><td class="num">${fa(x.pct)}٪</td><td class="end num gi-gold">${fmtG(wageOf(x.g, x.pct))}</td></tr>`).join('')}</tbody>
        <tfoot><tr><td colspan="3">جمع امروز</td><td class="num">${fa(todaySold)} گرم</td><td></td><td class="end num gi-gold" id="giTotal">${fmtG(todayWage)}</td></tr></tfoot></table></div>
      </div>
    </section>`,
    mount(root) {
      mountLogo(root.querySelector('.rlogo'));
      const $ = (id) => root.querySelector(id);
      let last = 0, saved = 0;
      const flash = (el) => { el.classList.remove('flashnum'); void el.offsetWidth; el.classList.add('flashnum'); };
      const calc = () => {
        const w = +$('#w').value || 0, wp = +$('#wp').value || 0, k = +$('#k').value, p = +$('#p').value || 0;
        const gram = (live.g18 / 750) * k;
        const base = w * gram, wageG = wageOf(w, wp), wageA = wageG * gram;
        const profit = (base + wageA) * (p / 100), vat = (wageA + profit) * 0.1;
        const tot = base + wageA + profit + vat;
        const rows = [['وزن طلا', fmtG(w)], ['قیمت هر گرم', `${fa(gram)} تومان`], ['ارزش طلا', `${fa(base)} تومان`], [`سود (${fa(p)}٪)`, `${fa(profit)} تومان`], ['مالیات اجرت و سود', `${fa(vat)} تومان`]];
        $('#rl').innerHTML = rows.map(([a, b]) => `<div class="rl"><span>${a}</span><span class="num">${b}</span></div>`).join('');
        $('#wageLbl').textContent = `اجرت ساخت (${fa(wp)}٪)`;
        const wg = $('#wageG'), nv = `${fmtG(wageG)} طلا`;
        if (wg.textContent !== nv) { wg.textContent = nv; flash(wg); }
        $('#wageT').textContent = `معادل ${fa(Math.round(wageA / 1e6))} میلیون تومان`;
        const t = $('#tot'); t.textContent = `${fa(tot)} تومان`;
        if (last && Math.round(last) !== Math.round(tot)) flash(t);
        last = tot;
        $('#totw').textContent = `قیمت پایه از قیمت‌گذار آنلاین — ${new Date().toLocaleTimeString('fa-IR')}`;
      };
      root.querySelectorAll('.form input, .form select').forEach((el) => el.addEventListener('input', calc));
      $('#issue').addEventListener('click', () => {
        const w = +$('#w').value || 0, wp = +$('#wp').value || 0; if (!w) return;
        const no = 4822 + saved++, wageG = wageOf(w, wp);
        const tr = document.createElement('tr'); tr.className = 'new';
        tr.innerHTML = `<td class="num muted">${fa(no)}</td><td>${$('#buyer').value}</td><td class="muted">${$('#prod').value}</td><td class="num">${fmtG(w)}</td><td class="num">${fa(wp)}٪</td><td class="end num gi-gold">${fmtG(wageG)}</td>`;
        $('#giRows').prepend(tr);
        const total = [...root.querySelectorAll('#giRows tr')].reduce((t, r) => t + +r.lastElementChild.textContent.replace(/[۰-۹]/g, (c) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(c)).replace('٫', '.').replace(/[^0-9.]/g, ''), 0);
        $('#giTotal').textContent = fmtG(total);
        $('#giChip').innerHTML = chip('gold', `اجرت امروز: ${fmtG(total)} طلا`);
        $('#issue').dataset.toast = `فاکتور ${fa(no)} ثبت شد — ${$('#buyer').value}، اجرت ${fmtG(wageG)} طلا`;
      });
      calc();
      return onPrice(calc);
    },
  };
}

// ---------------------------------------------------------------- treasury
function treasury() {
  return {
    html: `<section class="view">
      ${head('THE VAULT', 'خزانه — <b>هر گرم، حسابرسی‌شده</b>', 'موجودی طلا، نقدینگی و چک‌ها با ارزش لحظه‌ای.')}
      <div class="grid">
        <div class="card gold c4 kpi"><div class="label">کل طلای خزانه</div><div class="val num gold-text"><span data-count="186.42" data-dec="2">۰</span><small>کیلوگرم</small></div><div class="delta">معادل <span class="num" id="tv"></span></div></div>
        <div class="card c4 kpi"><div class="label">نقدینگی حساب‌ها</div><div class="val num"><span data-count="48.6" data-dec="1">۰</span><small>میلیارد تومان</small></div><div class="delta"><span class="up">▲ ۴٫۲ میلیارد</span> واریز امروز</div></div>
        <div class="card c4 kpi"><div class="label">چک‌های در جریان</div><div class="val num"><span data-count="23">۰</span><small>فقره</small></div><div class="delta">مجموع <span class="num">۱۸٫۴ میلیارد</span> · سه فقره این هفته</div></div>
      </div>
      <div class="grid mt">
        <div class="card c5"><div class="ch"><h3>ترکیب خزانه</h3></div><div id="d2"></div>
          <div class="kv" style="margin-top:16px">
            <div><i style="background:#0a3f30"></i><span>محصول ساخته</span><b class="num">۸۲٫۱ کیلو</b></div>
            <div><i style="background:#1f7a5e"></i><span>آب‌شده ۷۵۰</span><b class="num">۶۱٫۲ کیلو</b></div>
            <div><i style="background:#b59457"></i><span>در جریان تولید</span><b class="num">۳۲٫۷ کیلو</b></div>
            <div><i style="background:#0a1e35"></i><span>سکه و شمش</span><b class="num">۱۰٫۴ کیلو</b></div>
          </div></div>
        <div class="card c7"><div class="ch"><h3>ورود و خروج امروز</h3>${chip('ok', 'تراز')}</div>
          <div class="scroll-x"><table class="tbl"><thead><tr><th>ساعت</th><th>شرح</th><th>نوع</th><th class="end">وزن</th></tr></thead><tbody>
            ${[['۰۸:۱۲', 'تحویل آب‌شده به ریخته‌گری', 'خروج', -4.2], ['۰۹:۴۰', 'ورود محصول از آبکاری', 'ورود', 2.41], ['۱۰:۵۵', 'فروش — گالری ارغوان', 'خروج', -0.482], ['۱۱:۲۰', 'خرید طلای آب‌شده — بانک', 'ورود', 5], ['۱۲:۰۵', 'برگشت از نمایندگی مشهد', 'ورود', 0.049], ['۱۳:۳۰', 'تحویل به تراش CNC', 'خروج', -1.8]].map(([h, t, k, w]) => `<tr><td class="num muted">${h}</td><td>${t}</td><td>${chip(w > 0 ? 'ok' : 'gold', k)}</td><td class="end num ${w > 0 ? 'up' : ''}"><span dir="ltr">${w > 0 ? '+' : '−'}${fa(Math.abs(w), 3)}</span> کیلو</td></tr>`).join('')}
          </tbody></table></div></div>
      </div>
      <div class="card mt"><div class="ch"><h3>گردش خزانه بر اساس کد کالا <small>ورود، خروج و مرجوعی هر کد — امروز</small></h3><div class="tabs"><button class="on">همه مراحل</button><button>ریخته‌گری</button><button>ساخت</button><button>آماده فروش</button></div></div>
        <div class="scroll-x"><table class="tbl"><thead><tr><th>کد کالا</th><th>شرح</th><th>مرحله</th><th>ورود</th><th>خروج</th><th>مرجوعی</th><th>مانده</th><th>وزن</th><th class="end">ارزش لحظه‌ای</th></tr></thead><tbody>
        ${CODES.map((c) => `<tr><td><span class="chip gold en" style="font-family:ui-monospace,monospace;letter-spacing:.04em">${c.c}</span></td><td>${c.n}</td><td class="muted">${c.st}</td><td class="num up">+${fa(c.in)}</td><td class="num">−${fa(c.out)}</td><td class="num" style="color:var(--warn)">${c.ret ? fa(c.ret) : '—'}</td><td class="num"><b>${fa(c.q)}</b></td><td class="num">${fa(c.kg, 2)} کیلو</td><td class="end num" data-kg="${c.kg}">${fa((c.kg * 1000 * live.g18) / 1e9, 2)} میلیارد</td></tr>`).join('')}
        </tbody></table></div></div>
    </section>`,
    mount(root) {
      countUp(root);
      donut(root.querySelector('#d2'), [{ l: 'محصول ساخته', v: 82.1, c: '#0a3f30' }, { l: 'آب‌شده', v: 61.2, c: '#1f7a5e' }, { l: 'در جریان تولید', v: 32.7, c: '#b59457' }, { l: 'سکه و شمش', v: 10.4, c: '#0a1e35' }], { size: 200, center: '۱۸۶٫۴' });
      const set = () => {
        root.querySelector('#tv').textContent = `${fa((186420 * live.g18) / 1e9, 1)} میلیارد تومان`;
        root.querySelectorAll('[data-kg]').forEach((el) => { el.textContent = `${fa((+el.dataset.kg * 1000 * live.g18) / 1e9, 2)} میلیارد`; });
      };
      set(); return onPrice(set);
    },
  };
}

// ---------------------------------------------------------------- accounting
function accounting() {
  const cost = [['حقوق و دستمزد', 3900], ['انرژی کوره و برق', 420], ['مواد مصرفی (اسید، بوراکس، محلول)', 310], ['نگهداری و تعمیر ماشین‌آلات', 260], ['غذای پرسنل و اضافه‌کاری', 185], ['بیمه خزانه و امنیت', 140], ['حمل و ارسال', 96]];
  const max = Math.max(...cost.map((c) => c[1]));
  return {
    html: `<section class="view">
      ${head('LEDGER · RAYVARZ', 'حسابداری <b>بدون ورود دستی</b>', 'اسناد خودکار به رایورز می‌رود.', chip('ok', 'آخرین همگام‌سازی: ۲ دقیقه پیش'))}
      <div class="grid">
        ${kpi('درآمد ماه', 1.92, 'هزار میلیارد', '۱۱٪', sparkline(series(30, 50, 3, 0.06)), true, 2)}
        ${kpi('حاشیه سود ناخالص', 14.6, 'درصد', '۰٫۴٪', sparkline(series(30, 50, 2, 0.02)), true, 1)}
        ${kpi('هزینه‌های جاری', 5.31, 'میلیارد', '۳٪', sparkline(series(30, 50, 2, 0.02), { color: '#b42318' }), false, 2)}
        ${kpi('اسناد ثبت‌شده امروز', 412, 'سند', '۶۲', sparkline(series(30, 50, 4, 0.03)), true)}
      </div>
      <div class="grid mt">
        <div class="card c7"><div class="ch"><h3>هزینه‌های نگهداری و مصرفی <small>میلیون تومان · ماه جاری</small></h3></div>
          <div style="display:grid;gap:14px">${cost.map(([n, v]) => `<div style="display:grid;gap:6px"><div style="display:flex;justify-content:space-between;font-size:12.5px"><span>${n}</span><span class="num">${fa(v)}</span></div><div class="meter"><i style="width:${(v / max) * 100}%"></i></div></div>`).join('')}</div></div>
        <div class="card c5"><div class="ch"><h3>اسناد اخیر رایورز</h3></div>
          <div class="feed">${[['invoice', 'سند فروش ۴۸۲۱', 'گالری ارغوان · ۷٫۴ میلیارد'], ['cart', 'سند خرید ۲۲۰۴', 'آلیاژ نوین · ۶۴۰ میلیون'], ['meal', 'سند هزینه ۹۱۱', 'غذای پرسنل · ۱۲ میلیون'], ['people', 'سند دستمزد', 'اضافه‌کاری مهر · ۴۸۰ میلیون'], ['wrench', 'سند هزینه ۹۱۰', 'سرویس کوره · ۸۵ میلیون']].map(([i, a, b]) => `<div class="it"><div class="ico ok">${I[i]}</div><div><b>${a}</b><div class="s">${b}</div></div><time>${I.check.replace('<svg', '<svg width="14" style="color:var(--ok)"')}</time></div>`).join('')}</div></div>
      </div>
    </section>`,
    mount(root) { countUp(root); },
  };
}

// ---------------------------------------------------------------- warehouse
function warehouse() {
  return {
    html: `<section class="view">
      ${head('INVENTORY', 'انبار، تولیدی‌ها، <b>مرجوعی و خرابی</b>', 'کمبود را قبل از توقف کار خبر می‌دهد.', `<button class="btn" data-sfx data-toast="درخواست خرید برای ۳ قلم ارسال شد">${I.cart} سفارش خودکار کمبودها</button>`)}
      <div class="card" style="margin-bottom:18px"><div class="ch"><h3>${I.alert.replace('<svg', '<svg width="16"')} تطبیق سفارش با موجودی <small>سفارش بیشتر از موجودی انبار = اطلاع فوری به مدیر</small></h3>${chip('crit', `${fa(ORDER_CHECK.filter((x) => x.o > x.st).length)} سفارش بیش از موجودی`)}</div>
        <div>${ORDER_CHECK.map((x) => `<div class="ovs ${x.o > x.st ? 'over' : ''}">
          <div class="ovs-t"><b>${x.who}</b><span class="muted">${x.n} · <span style="font-family:ui-monospace,monospace;font-size:11px" dir="ltr">${x.code}</span></span></div>
          <div class="ovs-m"><div class="meter"><i style="width:${Math.min(100, (x.o / x.st) * 100)}%"></i></div><span class="num">${fa(x.o)} سفارش از ${fa(x.st)} موجود</span></div>
          ${x.o > x.st ? chip('crit', `کسری ${fa(x.o - x.st)} عدد`) : chip('ok', 'پوشش کامل')}</div>`).join('')}</div></div>
      <div class="grid">
        <div class="card c7"><div class="ch"><h3>موجودی انبار</h3>${chip('warn', '۳ قلم زیر حد')}</div>
          <div style="display:grid;gap:16px">${STOCK.map((s) => `<div style="display:grid;grid-template-columns:1fr auto;gap:8px 14px;align-items:center"><span style="font-size:13px">${s.n}</span><span class="num" style="font-size:12.5px">${s.q} ${chip(s.st, s.st === 'ok' ? 'کافی' : s.st === 'warn' ? 'رو به اتمام' : 'بحرانی')}</span><div class="meter" style="grid-column:span 2"><i style="width:${s.lvl}%;${s.st === 'crit' ? 'background:#b42318' : ''}"></i></div></div>`).join('')}</div></div>
        <div class="card c5"><div class="ch"><h3>تولیدی‌های طرف قرارداد</h3></div>
          <table class="tbl"><thead><tr><th>تولیدی</th><th>محصول</th><th class="end">تحویل به‌موقع</th></tr></thead><tbody>
          ${MAKERS.map((m) => `<tr><td>${m.n}</td><td class="muted">${m.k}</td><td class="end num">${fa(m.on)}٪</td></tr>`).join('')}</tbody></table></div>
      </div>
      <div class="grid mt">
        <div class="card c6"><div class="ch"><h3>${I.ret.replace('<svg', '<svg width="16"')} لیست مرجوعی‌ها</h3></div>
          <table class="tbl"><thead><tr><th>کالا</th><th>از</th><th>علت</th><th class="end">وزن</th></tr></thead><tbody>${RETURNS.map((r) => `<tr><td>${r.n}</td><td class="muted">${r.from}</td><td>${chip('gold', r.why)}</td><td class="end num">${fa(r.g, 1)} گرم</td></tr>`).join('')}</tbody></table></div>
        <div class="card c6"><div class="ch"><h3>${I.broken.replace('<svg', '<svg width="16"')} لیست خرابی‌ها</h3></div>
          <table class="tbl"><thead><tr><th>مورد</th><th>ایستگاه</th><th>اقدام</th><th class="end">وزن</th></tr></thead><tbody>${DEFECTS.map((r) => `<tr><td>${r.n}</td><td class="muted">${r.st}</td><td>${chip('warn', r.a)}</td><td class="end num">${fa(r.g, 1)} گرم</td></tr>`).join('')}</tbody></table></div>
      </div>
    </section>`,
  };
}

// ---------------------------------------------------------------- people
function people() {
  const meal = STAFF.filter((s) => s.ot >= 2);
  return {
    html: `<section class="view">
      ${head('PEOPLE · FACE ID', '<b>۱۵۰</b> نفر، یک نگاه', 'ساعت کاری ۸ تا ۱۶ · دو ساعت اضافه‌کاری = غذای پرسنلی')}
      <div class="grid">
        ${kpi('حاضر', 142, 'نفر', '۲ نفر', '', true)}
        ${kpi('تأخیر', 3, 'نفر', '۱ نفر', '', false)}
        ${kpi('مرخصی', 5, 'نفر', '—', '', true)}
        ${kpi('غذای امشب', 23, 'پرس', '۴ پرس', '', true)}
      </div>
      <div class="card mt shift">
        <div class="ch"><h3>${I.clock.replace('<svg', '<svg width="16"')} شیفت امروز <small>ساعت کاری ۸ تا ۱۶ · دو ساعت اضافه‌کاری (تا ۱۸) = غذای پرسنلی</small></h3><div class="legend"><span><i style="background:#e6efeb;border:1px solid #1f7a5e"></i>ساعت کاری</span><span><i class="stripe"></i>اضافه‌کاری</span><span><i style="background:#b42318"></i>مشمول غذا</span></div></div>
        <div class="tl">
          <div class="tl-axis">${Array.from({ length: 9 }, (_, i) => `<span style="inset-inline-start:${(i * 2 / 16) * 100}%">${fa(6 + i * 2)}:۰۰</span>`).join('')}</div>
          <div class="tl-zone reg" style="inset-inline-start:${(2 / 16) * 100}%;width:${(8 / 16) * 100}%"><em>ساعت کاری</em></div>
          <div class="tl-zone ot" style="inset-inline-start:${(10 / 16) * 100}%;width:${(2 / 16) * 100}%"><em>اضافه‌کاری</em></div>
          <div class="tl-mark" style="inset-inline-start:${(12 / 16) * 100}%"><span>${I.meal.replace('<svg', '<svg width="12"')} ۱۸:۰۰ · آستانه غذا</span></div>
          <div class="tl-now" id="tlNow"><span></span></div>
          ${STAFF.slice(0, 8).map((p, i) => { const st = 8 + ((i * 7) % 5) / 10 - 0.2, en = 16 + p.ot; const meal = p.ot >= 2; return `<div class="tl-row">
            <span class="tl-name">${p.name}</span>
            <div class="tl-bar ${meal ? 'meal' : ''}" style="inset-inline-start:${((st - 6) / 16) * 100}%;width:${((en - st) / 16) * 100}%"><i></i></div>
            ${meal ? `<span class="tl-meal" style="inset-inline-start:calc(${((en - 6) / 16) * 100}% + 8px)">${I.meal.replace('<svg', '<svg width="12"')}</span>` : ''}
          </div>`; }).join('')}
        </div>
      </div>
      <div class="grid mt">
        <div class="card c7"><div class="ch"><h3>${I.face.replace('<svg', '<svg width="16"')} دوربین ورودی — زنده</h3>${chip('ok', 'تشخیص فعال')}</div>
          <div class="faces" id="faces">${STAFF.slice(0, 12).map((s) => `<div class="face"><svg class="sil" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="5"/><path d="M2 24a10 10 0 0 1 20 0z"/></svg><div class="bracket"></div><span class="conf">۹۹٫۲٪</span><span style="position:relative">${s.name.split(' ')[1]}</span></div>`).join('')}</div></div>
        <div class="card c5"><div class="ch"><h3>${I.meal.replace('<svg', '<svg width="16"')} لیست غذای اضافه‌کاری</h3>${chip('gold', `${fa(meal.length)} نفر · امشب`)}</div>
          <div class="feed">${meal.map((s) => `<div class="it"><div class="who"><div class="av">${s.ini}</div></div><div><b>${s.name}</b><div class="s">${s.unit}</div></div><span class="chip gold num">${fa(s.ot, 1)} ساعت</span></div>`).join('')}</div></div>
      </div>
      <div class="card mt"><div class="ch"><h3>ورود و خروج امروز</h3></div><div class="scroll-x"><table class="tbl"><thead><tr><th>نام</th><th>واحد</th><th>ورود</th><th>اضافه‌کاری</th><th>وضعیت</th></tr></thead><tbody>
        ${STAFF.map((s) => `<tr><td><div class="who"><div class="av">${s.ini}</div>${s.name}</div></td><td class="muted">${s.unit}</td><td class="num">${s.st === 'مرخصی' ? '—' : s.in}</td><td class="num">${s.ot ? `${fa(s.ot, 1)} ساعت` : '—'}</td><td>${chip(s.st === 'حاضر' ? 'ok' : s.st === 'تأخیر' ? 'warn' : 'gold', s.st)}</td></tr>`).join('')}
      </tbody></table></div></div>
    </section>`,
    mount(root) {
      countUp(root);
      const now = root.querySelector('#tlNow');
      const setNow = () => { const d = new Date(); const h = Math.min(22, Math.max(6, d.getHours() + d.getMinutes() / 60)); now.style.insetInlineStart = `${((h - 6) / 16) * 100}%`; now.querySelector('span').textContent = `اکنون ${d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`; };
      setNow(); const nowIv = setInterval(setNow, 30000);
      const faces = [...root.querySelectorAll('.face')];
      let i = 0;
      const iv = setInterval(() => { faces.forEach((f) => f.classList.remove('match')); faces[i++ % faces.length].classList.add('match'); }, 1400);
      return () => { clearInterval(iv); clearInterval(nowIv); };
    },
  };
}

// ---------------------------------------------------------------- calendar
function calendar() {
  const kc = { in: '#2f8f62', out: '#b42318', ship: '#b59457', gold: '#0a1e35' };
  const today = 10;
  return {
    html: `<section class="view">
      ${head('DUE DATES', 'سررسیدها، چک‌ها و <b>تحویل بار</b>', 'هر پرداخت با معادل طلایی آن.')}
      <div class="grid">
        <div class="card c7"><div class="ch"><h3>مهر ۱۴۰۵</h3><div class="legend"><span><i style="background:${kc.in}"></i>دریافتی</span><span><i style="background:${kc.out}"></i>پرداختی</span><span><i style="background:${kc.ship}"></i>تحویل بار</span><span><i style="background:${kc.gold}"></i>طلای امانی</span></div></div>
          <div class="cal">${days.map((d) => `<div class="dh">${d}</div>`).join('')}
          ${Array.from({ length: 35 }, (_, i) => { const d = i - 1; const ev = DUE.filter((e) => e.d + today === d); return `<div class="d ${d < 1 || d > 30 ? 'off' : ''} ${d === today ? 'today' : ''}"><span class="num">${d >= 1 && d <= 30 ? fa(d) : ''}</span><div class="ev">${ev.map((e) => `<i style="background:${kc[e.k]}" title="${e.t}"></i>`).join('')}</div></div>`; }).join('')}</div></div>
        <div class="card c5"><div class="ch"><h3>پیش رو</h3></div>
          <div class="feed">${DUE.map((d) => `<div class="it"><div class="ico ${d.k === 'out' ? 'crit' : d.k === 'in' ? 'ok' : ''}">${I[d.k === 'ship' ? 'box' : d.k === 'gold' ? 'coin' : 'invoice']}</div><div><b>${d.t}</b>${d.a ? `<div class="s num">${fa(d.a / 1e6)} میلیون تومان · <span class="gold-text" data-goldeq="${d.a}">≈ ${fa(goldEq(d.a))} گرم طلا</span></div>` : ''}</div><time>${fa(d.d)} روز</time></div>`).join('')}</div></div>
      </div>
      <div class="card mt"><div class="ch"><h3>کارهای داخلی</h3><button class="btn ghost" data-sfx>+ کار جدید</button></div>
        <div class="todo">${TODOS.map((t) => `<label data-sfx><input type="checkbox" ${t.d ? 'checked' : ''}><span class="bx">${I.check}</span><span class="tx">${t.t}</span><span class="own">${t.o}</span></label>`).join('')}</div></div>
    </section>`,
    mount(root) {
      root.querySelectorAll('.todo input').forEach((c) => c.addEventListener('change', () => c.checked && sfx.ting(1568, 0.08, 1)));
      return onPrice(() => root.querySelectorAll('[data-goldeq]').forEach((el) => { el.textContent = `≈ ${fa(goldEq(+el.dataset.goldeq))} گرم طلا`; }));
    },
  };
}

// ---------------------------------------------------------------- market
function market() {
  return {
    html: `<section class="view">
      ${head('MARKET INTELLIGENCE', 'بازار طلا و <b>گزارش روزانه</b>', 'اخبار داخلی و جهانی و انس طلا.', `<button class="btn" data-speak>${I.sound} گزارش را بخوان</button>`)}
      <div class="grid">
        <div class="card c8"><div class="ch"><h3>انس جهانی طلا <small>دلار · ۳۰ روز</small></h3>${chip('ok', '▲ ۲٫۱٪ ماهانه')}</div><div class="chart" id="oz"></div></div>
        <div class="card c4"><div class="ch"><h3>نرخ‌های لحظه‌ای</h3></div>
          <div class="kv" id="rates"></div></div>
      </div>
      <div class="grid mt">
        <div class="card c6"><div class="ch"><h3>اخبار بازار</h3>${chip('gold', 'تحلیل ایجنت')}</div>
          <div class="news">${NEWS.map((n) => `<a href="#market" data-sfx><h5>${n.h}</h5><span class="imp">${chip(n.imp === 'up' ? 'ok' : n.imp === 'down' ? 'crit' : 'gold', n.imp === 'up' ? 'اثر مثبت' : n.imp === 'down' ? 'اثر منفی' : 'خنثی')}</span><span class="src">${n.s}</span></a>`).join('')}</div></div>
        <div class="card gold c6"><div class="ch"><h3>${I.report.replace('<svg', '<svg width="16"')} گزارش روزانه — پیش‌نویس ایجنت</h3><span class="muted" style="font-size:11px">ساعت ۲۱:۰۰ ارسال می‌شود</span></div>
          <div class="report" id="report"></div></div>
      </div>
    </section>`,
    mount(root) {
      const days30 = Array.from({ length: 30 }, (_, i) => `${fa(i + 1)} مهر`);
      areaChart(root.querySelector('#oz'), series(30, live.ounce * 0.98, 14, 0.07).map((v) => +v.toFixed(1)), days30, { fmt: (v) => `${fa(v, 1)} دلار`, h: 240 });
      const render = () => {
        root.querySelector('#rates').innerHTML = [['هر گرم ۱۸ عیار', live.g18, 'تومان'], ['مثقال ۱۷ عیار', live.mesghal, 'تومان'], ['سکه امامی', live.coin, 'تومان'], ['نیم سکه', live.half, 'تومان'], ['ربع سکه', live.quarter, 'تومان'], ['انس جهانی', live.ounce, 'دلار'], ['دلار آزاد', live.usd, 'تومان']]
          .map(([n, v, u]) => `<div><i style="background:var(--gold)"></i><span>${n}</span><b class="num">${fa(v, u === 'دلار' ? 1 : 0)} <small class="muted">${u}</small></b></div>`).join('');
        root.querySelector('#report').innerHTML = reportText();
      };
      render(); return onPrice(render);
    },
  };
}

export function reportText() {
  return `<b>${OWNER.call}، گزارش بازرس امروز:</b> قیمت هر گرم طلای ۱۸ عیار به <span class="hl num">${fa(live.g18)} تومان</span> رسید و انس جهانی روی <span class="hl num">${fa(live.ounce, 1)} دلار</span> است.
  فروش امروز <b>۷٫۸۴ کیلوگرم</b> بود؛ <span class="hl">۹٪ بیشتر</span> از دیروز. ارزش کل طلای در گردش <span class="hl num">${fa((186420 * live.g18) / 1e12, 3)} هزار میلیارد تومان</span> است.
  افت کل خط <b>۰٫۶۶٪</b> بود و واحد <b>ساخت</b> با ۰٫۲۱٪ بالاتر از استاندارد است. ۱۴۲ نفر از ۱۵۰ نفر حاضر بودند و ۲۳ نفر غذای اضافه‌کاری دریافت می‌کنند.
  فردا یک چک دریافتی <b>۱٫۸۵ میلیارد تومانی</b> از گالری ارغوان دارید؛ معادل حدود <span class="hl num">${fa(goldEq(1_850_000_000))} گرم طلا</span>. سفارش چهار برابری نمایندگی کرمان منتظر تأیید شماست. از نظر نظارتی: در تحویل خزانه به تراش CNC اختلاف ۱۲ گرمی دیدم که باید بررسی شود.`;
}

// ---------------------------------------------------------------- daily report (editorial)
function report() {
  const d = new Date();
  const date = d.toLocaleDateString('fa-IR-u-ca-persian', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return {
    html: `<section class="view">
      ${head('THE DAILY LEDGER', 'گزارش روزانه <b>مدیریتی</b>', `هر شب ساعت ۲۱، بازرس ویژه برای ${OWNER.call} می‌خواند.`, `<button class="btn ghost" data-sfx data-toast="نسخه PDF آماده دانلود است">${I.report} دریافت PDF</button><button class="btn" data-speak>${I.sound} بخوان برایم</button>`)}
      <article class="ledger card">
        <header class="lg-mast">
          <span class="en">VOL. XXXI · AGHIGH GOLD · YAZD</span>
          <h1 class="metal">برگ روزانه عقیق</h1>
          <span>${date} · نسخه اختصاصی ${OWNER.call} — محرمانه</span>
        </header>
        <div class="lg-strip">
          <div><span>هر گرم ۱۸ عیار</span><b class="num" data-live="g18">${fa(live.g18)}</b><small>تومان</small></div>
          <div><span>انس جهانی</span><b class="num" data-live="ounce">${fa(live.ounce, 1)}</b><small>دلار</small></div>
          <div><span>سکه امامی</span><b class="num" data-live="coin">${fa(live.coin / 1e6, 1)}</b><small>میلیون</small></div>
          <div><span>دلار آزاد</span><b class="num" data-live="usd">${fa(live.usd)}</b><small>تومان</small></div>
        </div>
        <div class="lg-body">
          <div class="lg-lead">
            <span class="lg-kicker">سرمقاله بازرس ویژه</span>
            <h2>فروش ۹٪ بالاتر از دیروز؛ واحد ساخت زیر ذره‌بین</h2>
            <p class="lg-drop">امروز ۷٫۸۴ کیلوگرم طلا فروخته شد که بیشترین رقم این هفته است. ارزش کل طلای در گردش به ${fa((186420 * live.g18) / 1e12, 3)} هزار میلیارد تومان رسید. افت کل خط ۰٫۶۶٪ بود، اما واحد ساخت با ۰٫۲۱٪ برای سومین روز پیاپی بالاتر از استاندارد است و پیشنهاد می‌شود فرایند لحیم‌کاری بازبینی شود.</p>
            <p>سفارش ۴٫۸ کیلویی نمایندگی کرمان چهار برابر میانگین ۳۰ روزه آن است و تا تأیید شما در صف نگه داشته شده. موجودی کد AG-BN-118-F برای پوشش این سفارش ۱۶۸ عدد کسری دارد.</p>
          </div>
          <div class="lg-col">
            <span class="lg-kicker">اعداد روز</span>
            <dl>
              <div><dt>فروش</dt><dd class="num">۷٫۸۴ کیلو · ۹۲٫۸ میلیارد</dd></div>
              <div><dt>تولید وارد خزانه</dt><dd class="num">۶٫۱ کیلو</dd></div>
              <div><dt>افت کل خط</dt><dd class="num">۰٫۶۶٪</dd></div>
              <div><dt>هزینه امروز</dt><dd class="num">۱۴۲ میلیون</dd></div>
              <div><dt>حاضر / کل پرسنل</dt><dd class="num">۱۴۲ / ۱۵۰</dd></div>
              <div><dt>غذای اضافه‌کاری</dt><dd class="num">۲۳ پرس</dd></div>
              <div><dt>اسناد رایورز</dt><dd class="num">۴۱۲ سند</dd></div>
            </dl>
          </div>
          <div class="lg-col">
            <span class="lg-kicker">فردا روی میز شما</span>
            <ol class="lg-list">
              <li><b>چک دریافتی ۱٫۸۵ میلیارد</b> — گالری ارغوان<br><small class="metal" data-goldeq="1850000000">≈ ${fa(1_850_000_000 / live.g18)} گرم طلا</small></li>
              <li><b>تحویل ۲٫۴ کیلو</b> — نمایندگی شیراز</li>
              <li><b>تأیید سفارش غیرعادی</b> — نمایندگی کرمان</li>
              <li><b>کمبود قفل و اتصالات</b> — پیشنهاد خرید آماده است</li>
            </ol>
            <span class="lg-kicker" style="margin-top:22px">بازار</span>
            <p class="lg-small">انس جهانی پس از داده‌های اشتغال آمریکا رشد کرد؛ ایجنت رصد بازار برای فردا روند ملایم صعودی پیش‌بینی می‌کند.</p>
          </div>
        </div>
        <footer class="lg-foot"><span>نوشته و خوانده‌شده توسط بازرس ویژه · ارسال خودکار ۲۱:۰۰</span><span class="en">— Aghigh Atelier Intelligence —</span></footer>
      </article>
    </section>`,
    mount(root) {
      return onPrice(() => {
        root.querySelectorAll('[data-live]').forEach((el) => { const k = el.dataset.live; el.textContent = k === 'coin' ? fa(live.coin / 1e6, 1) : fa(live[k], k === 'ounce' ? 1 : 0); });
        root.querySelectorAll('[data-goldeq]').forEach((el) => { el.textContent = `≈ ${fa(goldEq(+el.dataset.goldeq))} گرم طلا`; });
      });
    },
  };
}

export const VIEWS = { report, overview, agents, line, invoice, treasury, accounting, warehouse, people, calendar, market };
