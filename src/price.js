import { PRICE } from './data.js';

// Simulated live feed (swap tick() for a real price API in production).
export const live = { ...PRICE, prev: { ...PRICE } };
const deriveMesghal = () => { live.mesghal = Math.round((live.g18 / 750) * 705 * 4.6083); };
deriveMesghal();

const subs = new Set();
export function onPrice(fn) { subs.add(fn); return () => subs.delete(fn); }

function tick() {
  live.prev = { ...live, prev: undefined };
  const d = (Math.random() - 0.47) * 0.0016;
  live.ounce = +(live.ounce * (1 + d * 0.6 + (Math.random() - 0.5) * 0.0004)).toFixed(1);
  live.g18 = Math.round((live.g18 * (1 + d)) / 100) * 100;
  live.usd = Math.round(live.usd * (1 + (Math.random() - 0.5) * 0.0006) / 10) * 10;
  live.coin = Math.round((live.coin * (1 + d * 0.8)) / 1000) * 1000;
  live.half = Math.round((live.half * (1 + d * 0.8)) / 1000) * 1000;
  live.quarter = Math.round((live.quarter * (1 + d * 0.8)) / 1000) * 1000;
  deriveMesghal();
  subs.forEach((f) => f(live));
}
setInterval(tick, 3500);
