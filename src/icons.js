const s = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

export const I = {
  home: s('<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
  agents: s('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>'),
  line: s('<path d="M3 17h4l3-10 4 14 3-8h4"/>'),
  invoice: s('<path d="M6 2h12v20l-3-2-3 2-3-2-3 2z"/><path d="M9 7h6M9 11h6M9 15h4"/>'),
  vault: s('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="12" cy="12" r="4"/><path d="M12 8v1M12 15v1M8 12h1M15 12h1M6 20v2M18 20v2"/>'),
  ledger: s('<path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z"/><path d="M8 9h8M8 13h8M8 17h5"/>'),
  box: s('<path d="m3 7 9-4 9 4-9 4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/>'),
  people: s('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17.5" cy="9" r="2.5"/><path d="M16 14.2A5 5 0 0 1 21.5 19"/>'),
  cal: s('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  cube: s('<path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="m3 7 9 5 9-5M12 12v10"/>'),
  globe: s('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>'),
  bell: s('<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>'),
  sound: s('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>'),
  mute: s('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="m17 9 5 6M22 9l-5 6"/>'),
  coin: s('<ellipse cx="12" cy="7" rx="8" ry="3"/><path d="M4 7v5c0 1.7 3.6 3 8 3s8-1.3 8-3V7M4 12v5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5"/>'),
  calc: s('<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h4"/>'),
  face: s('<path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3"/><circle cx="9" cy="10" r=".5"/><circle cx="15" cy="10" r=".5"/><path d="M9 15c1.7 1.3 4.3 1.3 6 0"/>'),
  clock: s('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  alert: s('<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>'),
  report: s('<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4M9 13h6M9 17h6M9 9h2"/>'),
  news: s('<path d="M4 5h13v14a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2z"/><path d="M17 9h3v10a2 2 0 0 1-4 0M8 9h5M8 13h5M8 17h3"/>'),
  meal: s('<path d="M7 2v8a2 2 0 0 0 2 2v10M11 2v8a2 2 0 0 1-2 2M7 2v5M11 2v5"/><path d="M17 22V2c-2 1.5-3 4-3 7v4h3"/>'),
  cart: s('<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.5 12h12l2-8H6"/>'),
  wrench: s('<path d="M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8-3-3 8-8-1.3-1.3a4 4 0 0 1-5-5L13 2z"/><path d="m3 21 5-5"/>'),
  sync: s('<path d="M20 11a8 8 0 0 0-14.9-3M4 13a8 8 0 0 0 14.9 3"/><path d="M4 4v4h4M20 20v-4h-4"/>'),
  mic: s('<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/>'),
  check: s('<path d="m5 12 5 5L20 7"/>'),
  ret: s('<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>'),
  broken: s('<path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="m10 8 3 4-2 3 2 3"/>'),
  factory: s('<path d="M2 21V10l6 4V10l6 4V6l8-3v18z"/><path d="M6 17h2M11 17h2M16 17h2"/>'),
  fire: s('<path d="M12 22c4 0 7-3 7-7 0-5-5-7-5-12-3 2-4 5-4 7-1-1-2-2-2-4-2 2-3 5-3 9 0 4 3 7 7 7z"/>'),
  hammer: s('<path d="m14 7 5 5M3 21l9-9M12 4l5-2 5 5-2 5-5-5"/>'),
  gem: s('<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M10 3 8 9l4 12 4-12-2-6"/>'),
  drill: s('<rect x="3" y="4" width="12" height="9" rx="2"/><path d="M15 7h4l2 2-2 2h-4M7 13v4M11 13v4M5 21h8"/>'),
  drop: s('<path d="M12 2s7 7.5 7 13a7 7 0 0 1-14 0c0-5.5 7-13 7-13z"/><path d="M9 15a3 3 0 0 0 3 3"/>'),
  shop: s('<path d="M3 9 5 3h14l2 6"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 12v9h14v-9"/>'),
  brief: s('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4h6v3M3 13h18"/>'),
  upload: s('<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/>'),
  spark: s('<path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l3 3M16 16l3 3M5 19l3-3M16 8l3-3"/>'),
  lock: s('<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'),
  menu: s('<path d="M4 7h16M4 12h16M4 17h16"/>'),
};

// Official Aghigh Gold mark (brand gold #CB9B2D) — circle rendered as polished metal, glyph in ivory.
export const LOGO_GLYPH = 'M49.2,33.9c4.2-0.9,7,0.2,8.2,6.3c1.7,8.6,10.5,14.1,19.6,13.9c9.1-0.1,16.9-5.9,18.9-14.8 c1-4.5,2.7-5.6,7.2-5.5c11.3,0.4,11.5,0.4,7.9,11.4C105.8,60.6,92.1,70.1,75,70c-13-0.1-22.1,8.5-22,20.6 c0.1,10.2,7.8,18.5,18.7,20c8.9,1.2,19.2-5.4,21-14.7c1-5.2,3.3-6,7.9-5.8c10.3,0.4,10.3,0.1,7.4,10.2 c-4.1,14.4-16.7,24.8-31.4,25.9c-16.2,1.2-30-6.9-36.6-21.5c-6.1-13.6-3-30,8.2-40.3c3.2-2.9,3.4-4.3,0.4-7.5 c-4.6-4.9-6.9-11.1-8-17.9c-0.7-4,0-5.6,4.2-5.1C46,34.1,47.2,33.9,49.2,33.9z';
export const LOGO_CIRCLE = 'M75.1,3c39.8,0,71.9,32.3,71.8,72.2c-0.1,39.8-32.4,71.8-72.4,71.7C34.8,146.9,2.8,114.5,3,74.5C3.1,35,35.4,3,75.1,3z';
// official mark rendered as struck gold: soft metal gradient, raised rim, embossed glyph,
// and a specular highlight that follows the cursor (moved by --lx/--ly from main.js)
let lid = 0;
export const logo = () => {
  const id = `lg${lid++}`;
  return `<svg class="logo" viewBox="1 1 148 148" aria-label="طلای عقیق">
  <defs>
    <linearGradient id="${id}g" x1=".15" y1="0" x2=".85" y2="1"><stop offset="0" stop-color="#ecd08a"/><stop offset=".45" stop-color="#CB9B2D"/><stop offset=".82" stop-color="#a47a1c"/><stop offset="1" stop-color="#d2a945"/></linearGradient>
    <radialGradient id="${id}s"><stop offset="0" stop-color="#fff8e2" stop-opacity=".75"/><stop offset="1" stop-color="#fff8e2" stop-opacity="0"/></radialGradient>
    <clipPath id="${id}c"><path d="${LOGO_CIRCLE}"/></clipPath>
    <filter id="${id}e" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="1.6" stdDeviation=".8" flood-color="#5c400e" flood-opacity=".5"/></filter>
  </defs>
  <path d="${LOGO_CIRCLE}" fill="url(#${id}g)"/>
  <g clip-path="url(#${id}c)"><circle class="logo-spec" cx="52" cy="40" r="46" fill="url(#${id}s)"/></g>
  <circle cx="75" cy="75" r="66.5" fill="none" stroke="#f7e6b4" stroke-opacity=".55" stroke-width="1.1"/>
  <circle cx="75" cy="75" r="71" fill="none" stroke="#7a5713" stroke-opacity=".35" stroke-width="1"/>
  <path d="${LOGO_GLYPH}" fill="#fffdf6" filter="url(#${id}e)"/>
</svg>`;
};
