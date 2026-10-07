// Demo data — numbers are illustrative, prices are simulated live.
export const OWNER = { name: 'محمدرضا قدیرزاده', short: 'قدیرزاده', call: 'آقا رضا', initials: 'م‌ق' };

export const PRICE = {
  g18: 11_840_000, // per gram 18k, toman
  ounce: 4_182.6, // USD
  usd: 108_400, // toman
  mesghal: 0, // derived
  coin: 112_600_000, // Emami
  half: 61_900_000,
  quarter: 35_400_000,
};

export const ROLES = [
  { id: 'owner', label: 'مدیر کل' },
  { id: 'acc', label: 'حسابداری' },
  { id: 'wh', label: 'انبار' },
  { id: 'hr', label: 'منابع انسانی' },
];

export const NAV = [
  { id: 'overview', label: 'اتاق فرمان', icon: 'home', roles: ['owner', 'acc', 'wh', 'hr'] },
  { id: 'agents', label: 'ایجنت‌های هوشمند', icon: 'agents', roles: ['owner'], badge: '۱۳', g: true },
  { id: 'line', label: 'خط تولید و مراکز هزینه', icon: 'line', roles: ['owner', 'acc', 'wh'] },
  { id: 'invoice', label: 'فاکتور طلایی', icon: 'invoice', roles: ['owner', 'acc'] },
  { id: 'treasury', label: 'خزانه و انبار', icon: 'vault', roles: ['owner', 'acc', 'wh'], badge: '۳' },
  { id: 'accounting', label: 'حسابداری و هزینه‌ها', icon: 'ledger', roles: ['owner', 'acc'] },
  { id: 'people', label: 'پرسنل و شیفت', icon: 'people', roles: ['owner', 'hr'] },
  { id: 'calendar', label: 'سررسیدها و کارها', icon: 'cal', roles: ['owner', 'acc', 'wh', 'hr'], badge: '۵' },
  { id: 'report', label: 'گزارش روزانه مدیریتی', icon: 'report', roles: ['owner', 'acc'], badge: 'نو', g: true },
  { id: 'market', label: 'بازار و اخبار', icon: 'globe', roles: ['owner', 'acc'] },
];

export const AGENTS = [
  { id: 'treasury', name: 'خزانه‌دار', icon: 'vault', desc: 'موجودی طلای آب‌شده، ساخته، سکه و نقد را لحظه‌به‌لحظه با ورود و خروج تطبیق می‌دهد.', metric: 'تطبیق امروز', val: '۱۰۰٪', st: 'ok' },
  { id: 'pricing', name: 'قیمت‌گذار آنلاین', icon: 'calc', desc: 'قیمت هر گرم، اجرت، سود و مالیات را هنگام فروش در فاکتور محاسبه و در داشبورد شخصی ثبت می‌کند.', metric: 'فاکتور امروز', val: '۲۱۸', st: 'ok' },
  { id: 'face', name: 'شناسایی کارکنان', icon: 'face', desc: 'ورود و خروج ۱۵۰ نفر پرسنل را با تشخیص چهره ثبت و با شیفت تطبیق می‌دهد.', metric: 'حاضر', val: '۱۴۲ / ۱۵۰', st: 'ok' },
  { id: 'due', name: 'سررسید', icon: 'cal', desc: 'چک‌ها، پرداخت‌ها و تحویل بار را دنبال می‌کند و پیش از موعد هشدار می‌دهد.', metric: 'این هفته', val: '۹ مورد', st: 'warn' },
  { id: 'stock', name: 'موجودی انبار', icon: 'box', desc: 'موجودی مواد، قطعات و محصول نهایی را پایش و کمبود را پیش‌بینی می‌کند.', metric: 'کمبود', val: '۳ قلم', st: 'warn' },
  { id: 'anomaly', name: 'نگهبان سفارش', icon: 'alert', desc: 'سفارش‌های بیش از حد نرمال یک مشتری یا نماینده را فوراً به مدیر اطلاع می‌دهد.', metric: 'هشدار فعال', val: '۱', st: 'crit' },
  { id: 'report', name: 'گزارش‌نویس', icon: 'report', desc: 'هر شب گزارش کامل روز را همراه با قیمت‌ها، فروش، افت و هزینه‌ها می‌نویسد.', metric: 'گزارش بعدی', val: '۲۱:۰۰', st: 'ok' },
  { id: 'news', name: 'رصد بازار', icon: 'news', desc: 'اخبار داخلی و جهانی طلا و انس جهانی را خلاصه و اثرش را تحلیل می‌کند.', metric: 'خبر امروز', val: '۳۴', st: 'ok' },
  { id: 'meal', name: 'غذای پرسنل', icon: 'meal', desc: 'هرکس بیش از ۲ ساعت اضافه‌کاری بماند، خودکار در لیست غذا ثبت می‌شود.', metric: 'لیست امشب', val: '۲۳ پرس', st: 'ok' },
  { id: 'proc', name: 'خرید و تأمین', icon: 'cart', desc: 'نیاز خرید را از موجودی و برنامه تولید استخراج و پیشنهاد سفارش می‌دهد.', metric: 'پیشنهاد باز', val: '۶', st: 'ok' },
  { id: 'cost', name: 'هزینه و نگهداری', icon: 'wrench', desc: 'هزینه‌های نگهداری، مصرفی و سربار را به مراکز هزینه تسهیم می‌کند.', metric: 'این ماه', val: '۱٫۸ میلیارد', st: 'ok' },
  { id: 'rayvarz', name: 'پل رایورز', icon: 'sync', desc: 'اسناد را با نرم‌افزار حسابداری رایورز همگام می‌کند؛ بدون ورود دستی.', metric: 'آخرین همگام‌سازی', val: '۲ دقیقه پیش', st: 'ok' },
  { id: 'voice', name: 'بازرس ویژه', icon: 'mic', desc: 'دست راست آقا رضا؛ کل سازمان را نظارت می‌کند و هر روز گزارش خلاصه را با صدا می‌دهد. نسخه اختصاصی مدیر کل.', metric: 'یافته‌های امروز', val: '۳ مورد', st: 'warn' },
];

// production line = cost centers, in flow order (from the owner's voice notes)
export const STATIONS = [
  { id: 'cast', name: 'ریخته‌گری', icon: 'fire', staff: 14, wip: 18.4, loss: 0.08, cost: 312, util: 92 },
  { id: 'make', name: 'ساخت', icon: 'hammer', staff: 38, wip: 26.1, loss: 0.21, cost: 486, util: 88 },
  { id: 'polish', name: 'پرداخت', icon: 'spark', staff: 22, wip: 14.7, loss: 0.17, cost: 241, util: 81 },
  { id: 'hand', name: 'تراش دستی', icon: 'gem', staff: 19, wip: 9.8, loss: 0.12, cost: 198, util: 76 },
  { id: 'cnc', name: 'تراش CNC', icon: 'drill', staff: 8, wip: 7.2, loss: 0.06, cost: 264, util: 95 },
  { id: 'plate', name: 'آبکاری', icon: 'drop', staff: 7, wip: 5.3, loss: 0.02, cost: 133, util: 69 },
  { id: 'vault', name: 'خزانه', icon: 'vault', staff: 4, wip: 61.2, loss: 0, cost: 58, util: 100 },
  { id: 'sale', name: 'فروش', icon: 'shop', staff: 9, wip: 3.6, loss: 0, cost: 117, util: 84 },
];
export const ADMIN_UNITS = [
  { name: 'حسابداری', staff: 9, icon: 'ledger' },
  { name: 'منابع انسانی', staff: 5, icon: 'people' },
  { name: 'بازرگانی', staff: 6, icon: 'brief' },
  { name: 'مدیریت', staff: 4, icon: 'lock' },
];

const names = ['علی رضایی', 'مهدی کریمی', 'حسین موسوی', 'زهرا احمدی', 'رضا حسینی', 'مریم صادقی', 'امیر جعفری', 'فاطمه نوری', 'سعید یزدانی', 'محسن دهقان', 'نرگس فلاحی', 'جواد میرجلیلی', 'حمید زارعی', 'سارا شریفی', 'یاسر طاهری', 'الهام کاظمی'];
export const STAFF = names.map((n, i) => ({
  name: n, ini: n.split(' ').map((p) => p[0]).join('‌'),
  unit: STATIONS[i % 6].name,
  in: `0${7 + (i % 2)}:${10 + ((i * 7) % 50)}`.replace(/\d/g, (c) => '۰۱۲۳۴۵۶۷۸۹'[c]),
  ot: [0, 2.5, 0, 3, 1, 0, 2, 4, 0, 0.5, 2.5, 0, 3.5, 0, 1.5, 2][i],
  st: i === 5 ? 'مرخصی' : i === 9 ? 'تأخیر' : 'حاضر',
}));

export const ORDERS_ANOMALY = { who: 'نمایندگی کرمان (گالری ماهان)', kg: 4.8, normal: 1.2, x: 4 };

export const DUE = [
  { d: 2, t: 'چک دریافتی — گالری ارغوان', a: 1_850_000_000, k: 'in' },
  { d: 3, t: 'تحویل بار — نمایندگی شیراز (۲٫۴ کیلو)', a: 0, k: 'ship' },
  { d: 5, t: 'چک پرداختی — تأمین آلیاژ نوین', a: 640_000_000, k: 'out' },
  { d: 9, t: 'تسویه طلای امانی — بانک', a: 0, k: 'gold' },
  { d: 12, t: 'چک دریافتی — نمایندگی مشهد', a: 2_300_000_000, k: 'in' },
  { d: 15, t: 'سرویس دوره‌ای کوره ریخته‌گری', a: 85_000_000, k: 'out' },
  { d: 18, t: 'تحویل بار — گالری ماهان', a: 0, k: 'ship' },
  { d: 22, t: 'حقوق و دستمزد ۱۵۰ نفر', a: 3_900_000_000, k: 'out' },
  { d: 26, t: 'چک دریافتی — طلای پارسیان', a: 980_000_000, k: 'in' },
];

export const TODOS = [
  { t: 'تأیید سفارش غیرعادی نمایندگی کرمان', o: 'مدیر کل', d: false },
  { t: 'جلسه با تأمین‌کننده آلیاژ — قیمت جدید', o: 'بازرگانی', d: false },
  { t: 'بازبینی افت واحد ساخت (بالاتر از استاندارد)', o: 'تولید', d: false },
  { t: 'ارسال کاتالوگ سه‌بعدی کلکسیون پاییز', o: 'طراحی', d: true },
  { t: 'تمدید بیمه خزانه', o: 'حسابداری', d: true },
  { t: 'کالیبراسیون ترازوهای واحد فروش', o: 'خزانه', d: false },
];

export const NEWS = [
  { h: 'انس جهانی پس از داده‌های اشتغال آمریکا به بالای ۴۱۸۰ دلار رسید', s: 'Reuters · ۲۵ دقیقه پیش', imp: 'up' },
  { h: 'افزایش تقاضای بانک‌های مرکزی برای ذخیره طلا در فصل سوم', s: 'World Gold Council · ۲ ساعت پیش', imp: 'up' },
  { h: 'نوسان دلار بازار آزاد؛ قیمت هر گرم طلای ۱۸ عیار در کانال جدید', s: 'اتحادیه طلا و جواهر · ۳ ساعت پیش', imp: 'up' },
  { h: 'فدرال رزرو نشانه‌ای از توقف کاهش نرخ بهره نداد', s: 'Bloomberg · ۵ ساعت پیش', imp: 'flat' },
  { h: 'رکود نسبی بازار خرده‌فروشی طلا در شهرهای کوچک', s: 'دنیای اقتصاد · ۷ ساعت پیش', imp: 'down' },
  { h: 'سقف جدید حراج سکه در مرکز مبادله', s: 'ایرنا · دیروز', imp: 'up' },
];

export const STOCK = [
  { n: 'طلای آب‌شده ۷۵۰', q: '۴۲٫۶ کیلو', lvl: 78, st: 'ok' },
  { n: 'آلیاژ مس/نقره', q: '۸٫۲ کیلو', lvl: 22, st: 'warn' },
  { n: 'زنجیر ماشینی (کارتیه)', q: '۱۸٫۴ کیلو', lvl: 64, st: 'ok' },
  { n: 'قفل و اتصالات', q: '۳٬۲۰۰ عدد', lvl: 14, st: 'crit' },
  { n: 'نگین عقیق یمنی', q: '۸۴۰ عدد', lvl: 55, st: 'ok' },
  { n: 'محلول آبکاری رودیوم', q: '۱٫۱ لیتر', lvl: 18, st: 'warn' },
];
export const MAKERS = [
  { n: 'کارگاه زرین‌دست', k: 'زنجیر دست‌ساز', kg: 6.4, on: 96 },
  { n: 'تولیدی پارس‌گلد', k: 'النگو ماشینی', kg: 11.2, on: 91 },
  { n: 'گروه هنری سپهر', k: 'سرویس عروس', kg: 3.1, on: 88 },
  { n: 'طراحان کویر', k: 'انگشتر و پلاک', kg: 2.7, on: 99 },
];
export const RETURNS = [
  { n: 'دستبند کارتیه ۱۸ گرمی', from: 'نمایندگی شیراز', why: 'قفل معیوب', g: 18.2 },
  { n: 'سرویس عقیق ۴۲ گرمی', from: 'گالری ارغوان', why: 'تغییر سفارش', g: 42.0 },
  { n: 'النگو ۱۲ گرمی ×۴', from: 'نمایندگی مشهد', why: 'سایز', g: 48.6 },
];
export const DEFECTS = [
  { n: 'ترک در ریخته‌گری انگشتر', st: 'ریخته‌گری', g: 6.4, a: 'ذوب مجدد' },
  { n: 'خط‌افتادگی پس از پرداخت', st: 'پرداخت', g: 22.8, a: 'پرداخت مجدد' },
  { n: 'لایه آبکاری ناهمگن', st: 'آبکاری', g: 14.1, a: 'آبکاری مجدد' },
];

// inventory is tracked by product code — each model has a code per production stage
export const CODES = [
  { c: 'AG-BN-118-C', n: 'النگو ماشینی ۱۸ گرمی', st: 'ریخته‌گری', q: 240, kg: 4.32, in: 60, out: 48, ret: 0 },
  { c: 'AG-BN-118-M', n: 'النگو ماشینی ۱۸ گرمی', st: 'ساخت', q: 186, kg: 3.35, in: 48, out: 52, ret: 2 },
  { c: 'AG-BN-118-F', n: 'النگو ماشینی ۱۸ گرمی', st: 'آماده فروش', q: 312, kg: 5.61, in: 52, out: 40, ret: 4 },
  { c: 'AG-CH-042-M', n: 'زنجیر کارتیه ۴۲ سانت', st: 'ساخت', q: 520, kg: 4.68, in: 120, out: 96, ret: 0 },
  { c: 'AG-RG-207-H', n: 'انگشتر عقیق یمنی', st: 'تراش دستی', q: 96, kg: 0.81, in: 18, out: 12, ret: 1 },
  { c: 'AG-ST-310-P', n: 'سرویس عروس «کویر»', st: 'آبکاری', q: 14, kg: 1.12, in: 4, out: 2, ret: 0 },
  { c: 'AG-PD-055-F', n: 'پلاک CNC «نقش جهان»', st: 'آماده فروش', q: 430, kg: 1.94, in: 80, out: 64, ret: 3 },
];

// orders checked against warehouse stock — anything above stock alerts the owner
export const ORDER_CHECK = [
  { who: 'گالری ماهان — کرمان', code: 'AG-BN-118-F', n: 'النگو ماشینی ۱۸ گرمی', o: 480, st: 312 },
  { who: 'نمایندگی شیراز', code: 'AG-CH-042-M', n: 'زنجیر کارتیه ۴۲', o: 220, st: 520 },
  { who: 'طلای پارسیان — مشهد', code: 'AG-PD-055-F', n: 'پلاک «نقش جهان»', o: 150, st: 430 },
  { who: 'گالری ارغوان', code: 'AG-ST-310-P', n: 'سرویس عروس «کویر»', o: 20, st: 14 },
];

// the owner-only inspector agent — oversight findings across the organization
export const FINDINGS = [
  { lvl: 'crit', t: 'اختلاف ۱۲ گرمی در تحویل خزانه به تراش CNC', d: 'ساعت ۱۳:۳۰ — وزن تحویلی و دریافتی هم‌خوان نیست؛ ترازوی ایستگاه ۴ بررسی شود.' },
  { lvl: 'warn', t: 'افت واحد ساخت، سومین روز پیاپی بالاتر از استاندارد', d: '۰٫۲۱٪ در برابر حد ۰٫۱۵٪ — بیشترین افت در شیفت عصر.' },
  { lvl: 'warn', t: '۳ ورود دیرهنگام تکراری در واحد پرداخت', d: 'الگوی هفتگی؛ پیشنهاد گفت‌وگو با سرپرست واحد.' },
];

// defects per unit: today vs yesterday vs last-month average (per 100 pieces)
export const DEFECT_RATE = [
  { u: 'ریخته‌گری', d: 1.8, y: 2.1, m: 2.6 },
  { u: 'ساخت', d: 3.4, y: 3.1, m: 2.9 },
  { u: 'پرداخت', d: 2.2, y: 2.5, m: 2.8 },
  { u: 'تراش دستی', d: 1.1, y: 1.4, m: 1.6 },
  { u: 'تراش CNC', d: 0.4, y: 0.6, m: 0.7 },
  { u: 'آبکاری', d: 1.6, y: 1.3, m: 1.5 },
];

// today's gold invoices — sales are settled in grams; the wage (اجرت) is collected as gold
export const GOLD_INVOICES = [
  { no: 4821, who: 'گالری ارغوان — تهران', item: 'النگو ماشینی', g: 1000, pct: 10 },
  { no: 4820, who: 'نمایندگی شیراز', item: 'زنجیر کارتیه', g: 2400, pct: 9 },
  { no: 4819, who: 'طلای پارسیان — مشهد', item: 'سرویس عقیق دست‌ساز', g: 650, pct: 12 },
  { no: 4818, who: 'گالری ماهان — کرمان', item: 'پلاک CNC', g: 820, pct: 10 },
  { no: 4817, who: 'نمایندگی اصفهان', item: 'انگشتر عقیق یمنی', g: 310, pct: 14 },
];
