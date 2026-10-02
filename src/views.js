import { I } from './icons.js';
import { fa, toman, sparkline, areaChart, donut, bars, countUp, rand } from './util.js';
import { OWNER, AGENTS, STATIONS, ADMIN_UNITS, STAFF, DUE, TODOS, NEWS, STOCK, MAKERS, RETURNS, DEFECTS, ORDERS_ANOMALY, CODES } from './data.js';
import { live, onPrice } from './price.js';
import { createIngotScene } from './gl/ingot.js';
import { createStudio } from './gl/studio.js';
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
          <div class="greet">${greet}، آقای ${OWNER.short} — امروز ${new Date().toLocaleDateString('fa-IR-u-ca-persian', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          <div class="caps muted" style="margin-top:6px">ارزش لحظه‌ای کل طلای در گردش</div>
          <div class="big num gold-text" id="heroVal">—</div>
          <div class="stats">
            <div><span>کل طلا (۱۸ عیار)</span><b class="num"><span data-count="186.42" data-dec="2">۰</span> کیلو</b></div>
            <div><span>فروش امروز</span><b class="num"><span data-count="7.84" data-dec="2">۰</span> کیلو</b></div>
            <div><span>افت کل خط</span><b class="num"><span data-count="0.66" data-dec="2">۰</span>٪</b></div>
            <div><span>پرسنل حاضر</span><b class="num"><span data-count="142">۰</span> / ۱۵۰</b></div>
          </div>
        </div>
        <div class="stamp">${chip('gold', '۱۴ ایجنت فعال')}${chip('ok', 'همگام با رایورز')}${chip('ok', 'خزانه تطبیق شد')}</div>
        <div class="hint3d">MOVE · TO · LIGHT</div>
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
        ${kpi('هزینه جاری ماه', 1.84, 'میلیارد تومان', '۳٪', sparkline(series(30, 50, 2, -0.03), { color: '#b23a2e' }), false, 2)}
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
              <div style="display:flex;justify-content:space-between;gap:8px;font-size:13px"><span>${d.t}</span><span class="muted" style="white-space:nowrap">${fa(d.d)} روز</span></div>
              ${d.a ? `<div style="display:flex;justify-content:space-between;font-size:12px"><span class="num">${fa(d.a / 1e6)} میلیون</span><span class="gold-text num" data-goldeq="${d.a}">≈ ${fa(goldEq(d.a), 0)} گرم طلا</span></div>` : '<div class="muted" style="font-size:12px">ارسال فیزیکی</div>'}
            </div>`).join('')}
            <div class="muted" style="font-size:11.5px;line-height:1.8">معادل طلایی هر پرداخت با قیمت لحظه‌ای به‌روز می‌شود.</div>
          </div>
        </div>
      </div>

      <div class="grid mt">
        <div class="card c5">
          <div class="ch"><h3>جریان زنده ایجنت‌ها</h3>${chip('ok', 'زنده')}</div>
          <div class="feed" id="feed"></div>
        </div>
        <div class="card c4">
          <div class="ch"><h3>فروش هفته <small>کیلوگرم</small></h3></div>
          ${bars([6.2, 7.1, 5.4, 8.8, 7.9, 9.6, 7.84], days, { hi: 5, fmt: (v) => fa(v, 1) })}
        </div>
        <div class="card c3">
          <div class="ch"><h3>ترکیب خزانه</h3></div>
          <div id="vaultDonut"></div>
          <div class="kv" style="margin-top:14px">
            <div><i style="background:#f7e4b5"></i><span>محصول ساخته</span><b class="num">۸۲٫۱</b></div>
            <div><i style="background:#d4af6a"></i><span>آب‌شده</span><b class="num">۶۱٫۲</b></div>
            <div><i style="background:#8a6a2f"></i><span>در جریان تولید</span><b class="num">۳۲٫۷</b></div>
            <div><i style="background:#b23a2e"></i><span>سکه و شمش</span><b class="num">۱۰٫۴</b></div>
          </div>
        </div>
      </div>
    </section>`,
    mount(root) {
      countUp(root);
      const gl = createIngotScene(root.querySelector('#ingot'));
      areaChart(root.querySelector('#priceChart'), series(48, live.g18 * 0.985, 22000, 0.08).map((v) => Math.round(v)), hoursLbl, { fmt: (v) => `${fa(v)} تومان` });
      donut(root.querySelector('#vaultDonut'), [
        { l: 'محصول ساخته', v: 82.1, c: '#f7e4b5' }, { l: 'آب‌شده', v: 61.2, c: '#d4af6a' }, { l: 'در جریان تولید', v: 32.7, c: '#8a6a2f' }, { l: 'سکه و شمش', v: 10.4, c: '#b23a2e' },
      ], { size: 170, center: '۱۸۶٫۴' });
      const heroVal = root.querySelector('#heroVal');
      const setHero = () => { heroVal.innerHTML = `${fa((186420 * live.g18) / 1e12, 3)} <small>هزار میلیارد تومان</small>`; };
      setHero();
      const off = onPrice(() => {
        setHero();
        root.querySelectorAll('[data-goldeq]').forEach((el) => { el.textContent = `≈ ${fa(goldEq(+el.dataset.goldeq), 0)} گرم طلا`; });
      });
      const feed = root.querySelector('#feed');
      const evts = [
        ['vault', '', 'خزانه‌دار', 'ورود ۲٫۴ کیلو محصول از آبکاری ثبت و تطبیق شد'],
        ['calc', '', 'قیمت‌گذار', 'فاکتور ۲۱۸ — ۴۸۲ گرم — گالری ارغوان صادر شد'],
        ['face', 'ok', 'شناسایی', 'حسین موسوی وارد شد — ۰۷:۴۲ — واحد ساخت'],
        ['meal', '', 'غذای پرسنل', '۲۳ نفر با اضافه‌کاری بالای ۲ ساعت در لیست شام'],
        ['alert', 'crit', 'نگهبان سفارش', 'سفارش ۴ برابری نمایندگی کرمان متوقف شد'],
        ['sync', 'ok', 'پل رایورز', '۴۶ سند حسابداری همگام‌سازی شد'],
        ['news', '', 'رصد بازار', 'انس جهانی ۰٫۸٪ رشد کرد؛ اثر مثبت بر قیمت فردا'],
        ['box', '', 'موجودی', 'قفل و اتصالات زیر حد سفارش — پیشنهاد خرید ثبت شد'],
      ];
      let k = 0;
      const push = (animate) => {
        const [ic, cls, who, msg] = evts[k++ % evts.length];
        const d = new Date();
        const it = document.createElement('div');
        it.className = `it${animate ? ' new' : ''}`;
        it.innerHTML = `<div class="ico ${cls}">${I[ic]}</div><div><b>${who}</b> <span class="s">${msg}</span></div><time>${fa(d.getHours())}:${fa(d.getMinutes()).padStart(2, '۰')}</time>`;
        feed.prepend(it);
        if (feed.children.length > 6) feed.lastChild.remove();
        if (animate) sfx.blip(true);
      };
      for (let i = 0; i < 5; i++) push(false);
      const iv = setInterval(() => push(true), 5200);
      return () => { gl.dispose(); off(); clearInterval(iv); };
    },
  };
}

// ---------------------------------------------------------------- agents
function agents() {
  return {
    html: `<section class="view">
      ${head('AGENT CONSTELLATION', '<b>۱۴</b> ایجنت، یک ذهن طلایی', 'هر ایجنت یک بخش از کسب‌وکار را شبانه‌روز پایش می‌کند و فقط وقتی لازم است شما را خبر می‌کند.', `<button class="btn ghost" data-sfx>${I.sync} آموزش مجدد</button><button class="btn" data-sfx data-toast="ایجنت جدید در حال ساخت است">${I.spark} ایجنت جدید</button>`)}
      <div class="grid">
        ${AGENTS.map((a, i) => `<div class="card agent c3" data-tilt style="animation-delay:${i * 0.04}s">
          <div class="top-row"><div class="ic">${I[a.icon]}</div>${chip(a.st, a.st === 'ok' ? 'فعال' : a.st === 'warn' ? 'نیاز به توجه' : 'هشدار')}</div>
          <h4>${a.name}</h4><p>${a.desc}</p>
          <div class="wave">${Array.from({ length: 22 }, (_, j) => `<i style="animation-delay:${(j * 0.07 + i * 0.13) % 1.2}s;animation-duration:${0.8 + ((j * 13 + i * 7) % 10) / 10}s"></i>`).join('')}</div>
          <div class="metric"><span>${a.metric}</span><b class="num">${a.val}</b></div>
        </div>`).join('')}
      </div>
    </section>`,
  };
}

// ---------------------------------------------------------------- production line
function line() {
  const totalStaff = STATIONS.reduce((a, s) => a + s.staff, 0) + ADMIN_UNITS.reduce((a, s) => a + s.staff, 0);
  return {
    html: `<section class="view">
      ${head('COST CENTERS', 'مسیر طلا، از <b>کوره تا ویترین</b>', 'هر واحد یک مرکز هزینه است. وزن در جریان، افت، هزینه و بهره‌وری هر ایستگاه به‌صورت زنده محاسبه می‌شود.', chip('gold', `${fa(totalStaff)} نفر در ${fa(STATIONS.length + ADMIN_UNITS.length)} واحد`))}
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
      <div class="card mt"><div class="ch"><h3>جدول مراکز هزینه</h3><small class="muted">مبالغ به میلیون تومان · ماه جاری</small></div>
        <div class="scroll-x"><table class="tbl"><thead><tr><th>ایستگاه</th><th>پرسنل</th><th>طلای در جریان</th><th>افت</th><th>هزینه ماه</th><th>بهره‌وری</th><th style="width:22%"></th></tr></thead><tbody>
        ${STATIONS.map((s) => `<tr><td><div class="who"><div class="av">${I[s.icon].replace('<svg', '<svg width="14" height="14"')}</div>${s.name}</div></td><td class="num">${fa(s.staff)}</td><td class="num">${fa(s.wip, 1)} کیلو</td><td class="num ${s.loss > 0.15 ? 'down' : ''}">${fa(s.loss, 2)}٪</td><td class="num">${fa(s.cost)}</td><td class="num">${fa(s.util)}٪</td><td><div class="meter"><i style="width:${s.util}%"></i></div></td></tr>`).join('')}
        </tbody></table></div></div>
    </section>`,
    mount(root) {
      const svg = root.querySelector('#flow'), n = STATIONS.length, W = 1200, step = W / n;
      const xs = STATIONS.map((_, i) => W - (i + 0.5) * step); // RTL flow: right → left
      const path = `M${xs[0]},60 ` + xs.slice(1).map((x, i) => `C${xs[i] - step / 2},${i % 2 ? 20 : 100} ${x + step / 2},${i % 2 ? 100 : 20} ${x},60`).join(' ');
      svg.innerHTML = `<defs><linearGradient id="fl" x1="1" x2="0"><stop offset="0" stop-color="#e2664f"/><stop offset=".2" stop-color="#f7e4b5"/><stop offset="1" stop-color="#d4af6a"/></linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
        <path id="fp" d="${path}" fill="none" stroke="rgba(212,175,106,.12)" stroke-width="14" stroke-linecap="round"/>
        <path d="${path}" fill="none" stroke="url(#fl)" stroke-width="2" stroke-dasharray="2 10" stroke-linecap="round"><animate attributeName="stroke-dashoffset" from="0" to="-120" dur="2s" repeatCount="indefinite"/></path>
        ${Array.from({ length: 16 }, (_, i) => `<circle r="${2 + (i % 3)}" fill="#f7e4b5" filter="url(#glow)"><animateMotion dur="${9 + (i % 4)}s" begin="${-i * 0.7}s" repeatCount="indefinite"><mpath href="#fp"/></animateMotion></circle>`).join('')}
        ${xs.map((x, i) => `<g transform="translate(${x},60)"><circle r="20" fill="#0c0a0c" stroke="${i === 1 ? '#e8b04f' : '#d4af6a'}" stroke-width="1.5"/><circle r="26" fill="none" stroke="rgba(212,175,106,.25)"><animate attributeName="r" values="22;32;22" dur="${2.4 + i * 0.2}s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0;1" dur="${2.4 + i * 0.2}s" repeatCount="indefinite"/></circle><g transform="translate(-9,-9) scale(.75)" color="#f7e4b5">${I[STATIONS[i].icon]}</g></g>`).join('')}`;
      svg.querySelectorAll('g > g > svg').forEach((s) => { s.setAttribute('width', 24); s.setAttribute('height', 24); });
      root.querySelector('#stations').innerHTML = STATIONS.map((s) => `<div style="text-align:center;display:grid;gap:4px">
        <b style="font-size:13px">${s.name}</b><span class="num" style="font-size:12px;color:var(--gold-hi)" data-wip="${s.wip}">${fa(s.wip, 1)} کیلو</span>
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
  return {
    html: `<section class="view">
      ${head('LIVE INVOICE', 'فاکتور <b>زنده</b> با قیمت لحظه‌ای', 'قیمت طلا، اجرت، سود و مالیات در لحظه فروش محاسبه و مستقیم در داشبورد شخصی و حسابداری رایورز ثبت می‌شود.')}
      <div class="grid">
        <div class="card c7">
          <div class="ch"><h3>اقلام فاکتور</h3>${chip('ok', 'قیمت قفل‌نشده — زنده')}</div>
          <div class="form">
            <div class="field"><label>خریدار</label><select id="buyer"><option>گالری ارغوان — تهران</option><option>نمایندگی شیراز</option><option>طلای پارسیان — مشهد</option><option>گالری ماهان — کرمان</option></select></div>
            <div class="field"><label>محصول</label><select id="prod"><option data-w="18">اجرت ۱۸٪ — النگو ماشینی</option><option data-w="9">اجرت ۹٪ — زنجیر کارتیه</option><option data-w="24">اجرت ۲۴٪ — سرویس عقیق دست‌ساز</option><option data-w="14">اجرت ۱۴٪ — انگشتر CNC</option></select></div>
            <div class="field"><label>وزن (گرم)</label><input id="w" type="number" value="482" step="0.01"></div>
            <div class="field"><label>عیار</label><select id="k"><option value="750">۱۸ عیار (۷۵۰)</option><option value="705">۱۷ عیار (۷۰۵)</option><option value="875">۲۱ عیار (۸۷۵)</option></select></div>
            <div class="field"><label>سود فروشنده (٪)</label><input id="p" type="number" value="7" step="0.5"></div>
            <div class="field"><label>هزینه‌های روز (بسته‌بندی، بیمه، حمل)</label><input id="x" type="number" value="4200000"></div>
          </div>
          <div class="mt" style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" data-sfx data-toast="فاکتور صادر شد و در رایورز ثبت گردید">${I.invoice} صدور و ثبت در رایورز</button><button class="btn ghost" data-sfx data-toast="قیمت برای ۱۰ دقیقه قفل شد">${I.lock} قفل قیمت</button></div>
        </div>
        <div class="c5"><div class="receipt" id="rcpt">
          <div class="live"><span class="dot"></span>LIVE</div>
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px"><div style="width:40px;height:40px;color:#6e5022" class="rlogo"></div><div><b style="font-size:16px">طلای عقیق</b><div style="font-size:11px;color:#6a5530;letter-spacing:.2em">AGHIGH GOLD · YAZD</div></div></div>
          <div id="rl"></div>
          <div class="tot"><span>مبلغ قابل پرداخت</span><b class="num" id="tot"></b></div>
          <div style="font-size:11px;color:#6a5530;margin-top:8px" id="totw"></div>
        </div></div>
      </div>
    </section>`,
    mount(root) {
      root.querySelector('.rlogo').innerHTML = document.querySelector('.brand .mark').innerHTML;
      const rc = root.querySelector('#rcpt');
      rc.addEventListener('pointermove', (e) => { const r = rc.getBoundingClientRect(); rc.style.setProperty('--mx', `${e.clientX - r.left}px`); rc.style.setProperty('--my', `${e.clientY - r.top}px`); });
      const $ = (id) => root.querySelector(id);
      let last = 0;
      const calc = () => {
        const w = +$('#w').value || 0, k = +$('#k').value, p = +$('#p').value || 0, x = +$('#x').value || 0;
        const wage = +$('#prod').selectedOptions[0].dataset.w;
        const gram = (live.g18 / 750) * k;
        const base = w * gram, wageA = base * (wage / 100), profit = (base + wageA) * (p / 100), vat = (wageA + profit) * 0.1;
        const tot = base + wageA + profit + vat + x;
        const rows = [['قیمت هر گرم', `${fa(gram)} تومان`], ['ارزش طلا', `${fa(base)}`], [`اجرت ساخت (${fa(wage)}٪)`, fa(wageA)], [`سود (${fa(p)}٪)`, fa(profit)], ['مالیات بر ارزش افزوده اجرت و سود', fa(vat)], ['هزینه‌های روز', fa(x)]];
        $('#rl').innerHTML = rows.map(([a, b]) => `<div class="rl"><span>${a}</span><span class="num">${b}</span></div>`).join('');
        const t = $('#tot'); t.textContent = `${fa(tot)} تومان`;
        if (last && Math.round(last) !== Math.round(tot)) { t.classList.remove('flashnum'); void t.offsetWidth; t.classList.add('flashnum'); }
        last = tot;
        $('#totw').textContent = `قیمت پایه از قیمت‌گذار آنلاین — ${new Date().toLocaleTimeString('fa-IR')}`;
      };
      root.querySelectorAll('input,select').forEach((el) => el.addEventListener('input', () => { calc(); sfx.blip(true); }));
      calc();
      return onPrice(calc);
    },
  };
}

// ---------------------------------------------------------------- treasury
function treasury() {
  return {
    html: `<section class="view">
      ${head('THE VAULT', 'خزانه — <b>هر گرم، حسابرسی‌شده</b>', 'موجودی طلا به تفکیک نوع و عیار، نقدینگی و چک‌ها؛ همه با ارزش لحظه‌ای.')}
      <div class="grid">
        <div class="card gold c4 kpi"><div class="label">کل طلای خزانه</div><div class="val num gold-text"><span data-count="186.42" data-dec="2">۰</span><small>کیلوگرم</small></div><div class="delta">معادل <span class="num" id="tv"></span></div></div>
        <div class="card c4 kpi"><div class="label">نقدینگی حساب‌ها</div><div class="val num"><span data-count="48.6" data-dec="1">۰</span><small>میلیارد تومان</small></div><div class="delta"><span class="up">▲ ۴٫۲ میلیارد</span> واریز امروز</div></div>
        <div class="card c4 kpi"><div class="label">چک‌های در جریان</div><div class="val num"><span data-count="23">۰</span><small>فقره</small></div><div class="delta">مجموع <span class="num">۱۸٫۴ میلیارد</span> · سه فقره این هفته</div></div>
      </div>
      <div class="grid mt">
        <div class="card c5"><div class="ch"><h3>ترکیب خزانه</h3></div><div id="d2"></div>
          <div class="kv" style="margin-top:16px">
            <div><i style="background:#f7e4b5"></i><span>محصول ساخته</span><b class="num">۸۲٫۱ کیلو</b></div>
            <div><i style="background:#d4af6a"></i><span>آب‌شده ۷۵۰</span><b class="num">۶۱٫۲ کیلو</b></div>
            <div><i style="background:#8a6a2f"></i><span>در جریان تولید</span><b class="num">۳۲٫۷ کیلو</b></div>
            <div><i style="background:#b23a2e"></i><span>سکه و شمش</span><b class="num">۱۰٫۴ کیلو</b></div>
          </div></div>
        <div class="card c7"><div class="ch"><h3>ورود و خروج امروز</h3>${chip('ok', 'تراز')}</div>
          <div class="scroll-x"><table class="tbl"><thead><tr><th>ساعت</th><th>شرح</th><th>نوع</th><th class="end">وزن</th></tr></thead><tbody>
            ${[['۰۸:۱۲', 'تحویل آب‌شده به ریخته‌گری', 'خروج', -4.2], ['۰۹:۴۰', 'ورود محصول از آبکاری', 'ورود', 2.41], ['۱۰:۵۵', 'فروش — گالری ارغوان', 'خروج', -0.482], ['۱۱:۲۰', 'خرید طلای آب‌شده — بانک', 'ورود', 5], ['۱۲:۰۵', 'برگشت از نمایندگی مشهد', 'ورود', 0.049], ['۱۳:۳۰', 'تحویل به تراش CNC', 'خروج', -1.8]].map(([h, t, k, w]) => `<tr><td class="num muted">${h}</td><td>${t}</td><td>${chip(w > 0 ? 'ok' : 'gold', k)}</td><td class="end num ${w > 0 ? 'up' : ''}"><span dir="ltr">${w > 0 ? '+' : '−'}${fa(Math.abs(w), 3)}</span> کیلو</td></tr>`).join('')}
          </tbody></table></div></div>
      </div>
      <div class="card mt"><div class="ch"><h3>موجودی بر اساس کد کالا <small>هر مدل در هر مرحله یک کد دارد</small></h3><div class="tabs"><button class="on">همه مراحل</button><button>ریخته‌گری</button><button>ساخت</button><button>آماده فروش</button></div></div>
        <div class="scroll-x"><table class="tbl"><thead><tr><th>کد کالا</th><th>شرح</th><th>مرحله</th><th>تعداد</th><th>وزن</th><th class="end">ارزش لحظه‌ای</th></tr></thead><tbody>
        ${CODES.map((c) => `<tr><td><span class="chip gold en" style="font-family:ui-monospace,monospace;letter-spacing:.04em">${c.c}</span></td><td>${c.n}</td><td class="muted">${c.st}</td><td class="num">${fa(c.q)}</td><td class="num">${fa(c.kg, 2)} کیلو</td><td class="end num" data-kg="${c.kg}">${fa((c.kg * 1000 * live.g18) / 1e9, 2)} میلیارد</td></tr>`).join('')}
        </tbody></table></div></div>
    </section>`,
    mount(root) {
      countUp(root);
      donut(root.querySelector('#d2'), [{ l: 'محصول ساخته', v: 82.1, c: '#f7e4b5' }, { l: 'آب‌شده', v: 61.2, c: '#d4af6a' }, { l: 'در جریان تولید', v: 32.7, c: '#8a6a2f' }, { l: 'سکه و شمش', v: 10.4, c: '#b23a2e' }], { size: 200, center: '۱۸۶٫۴' });
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
      ${head('LEDGER · RAYVARZ', 'حسابداری <b>بدون ورود دستی</b>', 'اسناد فروش، خرید، هزینه و دستمزد از ایجنت‌ها مستقیم به نرم‌افزار حسابداری رایورز می‌رود.', chip('ok', 'آخرین همگام‌سازی: ۲ دقیقه پیش'))}
      <div class="grid">
        ${kpi('درآمد ماه', 1.92, 'هزار میلیارد', '۱۱٪', sparkline(series(30, 50, 3, 0.06)), true, 2)}
        ${kpi('حاشیه سود ناخالص', 14.6, 'درصد', '۰٫۴٪', sparkline(series(30, 50, 2, 0.02)), true, 1)}
        ${kpi('هزینه‌های جاری', 5.31, 'میلیارد', '۳٪', sparkline(series(30, 50, 2, 0.02), { color: '#b23a2e' }), false, 2)}
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
      ${head('INVENTORY', 'انبار، تولیدی‌ها، <b>مرجوعی و خرابی</b>', 'ایجنت موجودی، کمبود را قبل از توقف خط پیش‌بینی می‌کند.', `<button class="btn" data-sfx data-toast="درخواست خرید برای ۳ قلم ارسال شد">${I.cart} سفارش خودکار کمبودها</button>`)}
      <div class="grid">
        <div class="card c7"><div class="ch"><h3>موجودی انبار</h3>${chip('warn', '۳ قلم زیر حد')}</div>
          <div style="display:grid;gap:16px">${STOCK.map((s) => `<div style="display:grid;grid-template-columns:1fr auto;gap:8px 14px;align-items:center"><span style="font-size:13px">${s.n}</span><span class="num" style="font-size:12.5px">${s.q} ${chip(s.st, s.st === 'ok' ? 'کافی' : s.st === 'warn' ? 'رو به اتمام' : 'بحرانی')}</span><div class="meter" style="grid-column:span 2"><i style="width:${s.lvl}%;${s.st === 'crit' ? 'background:linear-gradient(90deg,#7a1f16,#e2664f)' : ''}"></i></div></div>`).join('')}</div></div>
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
      ${head('PEOPLE · FACE ID', '<b>۱۵۰</b> نفر، یک نگاه', 'ورود و خروج با تشخیص چهره، شیفت‌ها و اضافه‌کاری. بیش از ۲ ساعت اضافه‌کاری = غذای پرسنلی، خودکار.')}
      <div class="grid">
        ${kpi('حاضر', 142, 'نفر', '۲ نفر', '', true)}
        ${kpi('تأخیر', 3, 'نفر', '۱ نفر', '', false)}
        ${kpi('مرخصی', 5, 'نفر', '—', '', true)}
        ${kpi('غذای امشب', 23, 'پرس', '۴ پرس', '', true)}
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
      const faces = [...root.querySelectorAll('.face')];
      let i = 0;
      const iv = setInterval(() => { faces.forEach((f) => f.classList.remove('match')); faces[i++ % faces.length].classList.add('match'); sfx.blip(true); }, 1400);
      return () => clearInterval(iv);
    },
  };
}

// ---------------------------------------------------------------- calendar
function calendar() {
  const kc = { in: '#8cc29a', out: '#e2664f', ship: '#d4af6a', gold: '#f7e4b5' };
  const today = 10;
  return {
    html: `<section class="view">
      ${head('DUE DATES', 'سررسیدها، چک‌ها و <b>تحویل بار</b>', 'هر پرداخت با معادل طلایی لحظه‌ای نمایش داده می‌شود تا بدانید امروز چند گرم طلا باید آزاد شود.')}
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

// ---------------------------------------------------------------- studio
function studio() {
  return {
    html: `<section class="view">
      ${head('PHOTO → 3D', 'از یک عکس، تا <b>رندر کاتالوگ</b>', 'عکس یا اسکچ طرح را بدهید؛ ایجنت رندر، مدل سه‌بعدی، متریال و نورپردازی استودیویی را می‌سازد.')}
      <div class="grid">
        <div class="card studio c8" id="studioCard">
          <canvas class="gl" id="studio"></canvas><div class="scan"></div>
          <div class="overlay"><span class="caps gold-text">AGHIGH · AGATE SIGNET</span><b style="font-size:20px;font-weight:300">انگشتر عقیق یمنی — طلای ۱۸</b><span class="muted" style="font-size:12px">۸٫۴ گرم · نگین کابوشن · ۸ برلیان</span></div>
          <div class="bottom"><div class="swatches"><button class="on" data-c="#f2c063" data-r=".14" style="background:linear-gradient(135deg,#ffe7a8,#c9953d)" title="زرد"></button><button data-c="#f0b49a" data-r=".16" style="background:linear-gradient(135deg,#ffd6c4,#c27a5c)" title="رزگلد"></button><button data-c="#e6e6e6" data-r=".1" style="background:linear-gradient(135deg,#fff,#9a9a9a)" title="سفید"></button></div>
          <span class="caps muted">DRAG · TO · ROTATE</span></div>
        </div>
        <div class="card c4" style="display:grid;gap:18px;align-content:start">
          <div class="drop" id="drop">${I.upload.replace('<svg', '<svg width="30" style="color:var(--gold)"')}<b style="font-size:14px">عکس یا اسکچ را اینجا رها کنید</b><span class="muted" style="font-size:12px">JPG · PNG · HEIC — حداکثر ۲۰ مگابایت</span><button class="btn" id="gen">${I.spark} ساخت مدل سه‌بعدی</button></div>
          <div class="steps" id="steps">${['تحلیل تصویر و تشخیص فرم', 'بازسازی هندسه سه‌بعدی', 'اعمال متریال طلا و نگین', 'نورپردازی و رندر استودیویی'].map((s, i) => `<div class="on"><i>${fa(i + 1)}</i>${s}</div>`).join('')}</div>
          <div><div class="muted" style="font-size:12px;margin-bottom:10px">صف رندر</div><div class="thumbs"><div>النگو</div><div>گردنبند</div><div>گوشواره</div></div></div>
        </div>
      </div>
    </section>`,
    mount(root) {
      const st = createStudio(root.querySelector('#studio'));
      root.querySelectorAll('.swatches button').forEach((b) => b.addEventListener('click', () => { root.querySelectorAll('.swatches button').forEach((x) => x.classList.remove('on')); b.classList.add('on'); st.setMetal(b.dataset.c, +b.dataset.r); sfx.ting(1760, 0.08, 1.2); }));
      const card = root.querySelector('#studioCard'), steps = [...root.querySelectorAll('#steps div')];
      root.querySelector('#gen').addEventListener('click', () => {
        card.classList.remove('scanning'); void card.offsetWidth; card.classList.add('scanning');
        steps.forEach((s) => s.classList.remove('on')); st.rebuild(); sfx.whoosh(2.2, true);
        steps.forEach((s, i) => setTimeout(() => { s.classList.add('on'); sfx.ting(1046 * (1 + i * 0.25), 0.07, 0.8); }, 500 + i * 550));
      });
      return () => st.dispose();
    },
  };
}

// ---------------------------------------------------------------- market
function market() {
  return {
    html: `<section class="view">
      ${head('MARKET INTELLIGENCE', 'بازار طلا و <b>گزارش روزانه</b>', 'اخبار داخلی و جهانی، انس جهانی و گزارش کامل روز با قیمت‌ها — هر شب ساعت ۲۱ به شما ارسال می‌شود.', `<button class="btn" data-speak>${I.sound} گزارش را بخوان</button>`)}
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
  return `<b>جمع‌بندی امروز، آقای ${OWNER.short}:</b> قیمت هر گرم طلای ۱۸ عیار به <span class="hl num">${fa(live.g18)} تومان</span> رسید و انس جهانی روی <span class="hl num">${fa(live.ounce, 1)} دلار</span> است.
  فروش امروز <b>۷٫۸۴ کیلوگرم</b> بود؛ <span class="hl">۹٪ بیشتر</span> از دیروز. ارزش کل طلای در گردش <span class="hl num">${fa((186420 * live.g18) / 1e12, 3)} هزار میلیارد تومان</span> است.
  افت کل خط <b>۰٫۶۶٪</b> بود و واحد <b>ساخت</b> با ۰٫۲۱٪ بالاتر از استاندارد است. ۱۴۲ نفر از ۱۵۰ نفر حاضر بودند و ۲۳ نفر غذای اضافه‌کاری دریافت می‌کنند.
  فردا یک چک دریافتی <b>۱٫۸۵ میلیارد تومانی</b> از گالری ارغوان دارید؛ معادل حدود <span class="hl num">${fa(goldEq(1_850_000_000))} گرم طلا</span>. سفارش چهار برابری نمایندگی کرمان منتظر تأیید شماست.`;
}

export const VIEWS = { overview, agents, line, invoice, treasury, accounting, warehouse, people, calendar, studio, market };
