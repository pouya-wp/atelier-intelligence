// Synthesized sound design — no audio files, everything is generated with WebAudio.
let ctx, master, muted = false;

export function initAudio() {
  if (ctx) return ctx;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain();
  master.gain.value = 0.32;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18; comp.ratio.value = 4;
  master.connect(comp).connect(ctx.destination);
  return ctx;
}

const ok = () => ctx && !muted && ctx.state === 'running';
const now = () => ctx.currentTime;

function env(g, t, a, d, peak) {
  g.gain.cancelScheduledValues(t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}

function noiseBuffer(sec = 1) {
  const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

// metallic bell: inharmonic partials like struck gold
export function ting(base = 1760, vol = 0.12, decay = 1.4) {
  if (!ok()) return;
  const t = now();
  [1, 2.76, 5.4, 8.93].forEach((r, i) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = base * r;
    env(g, t, 0.002, decay / (i + 1), vol / (i + 1.2));
    o.connect(g).connect(master); o.start(t); o.stop(t + decay + 0.1);
  });
}

export function hover() {
  if (!ok()) return;
  const t = now(), o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(3200, t); o.frequency.exponentialRampToValueAtTime(2400, t + 0.05);
  env(g, t, 0.002, 0.06, 0.018);
  o.connect(g).connect(master); o.start(t); o.stop(t + 0.1);
}

export function click() { ting(1318, 0.09, 0.7); }

export function whoosh(dur = 0.7, up = true) {
  if (!ok()) return;
  const t = now(), s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuffer(dur + 0.1);
  f.type = 'bandpass'; f.Q.value = 1.4;
  f.frequency.setValueAtTime(up ? 300 : 3000, t);
  f.frequency.exponentialRampToValueAtTime(up ? 3200 : 260, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.16, t + dur * 0.45);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(master); s.start(t); s.stop(t + dur + 0.1);
}

export function blip(upward = true) {
  if (!ok()) return;
  const t = now(), o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(upward ? 880 : 660, t);
  o.frequency.exponentialRampToValueAtTime(upward ? 1320 : 440, t + 0.08);
  env(g, t, 0.003, 0.12, 0.03);
  o.connect(g).connect(master); o.start(t); o.stop(t + 0.2);
}

export function alarm() {
  if (!ok()) return;
  const t = now();
  [0, 0.18].forEach((d) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = 740;
    env(g, t + d, 0.01, 0.25, 0.08);
    o.connect(g).connect(master); o.start(t + d); o.stop(t + d + 0.4);
  });
  ting(2093, 0.05, 0.9);
}

// press-and-hold charge for the vault seal
let charge = null;
export function chargeStart(seconds) {
  if (!ok()) return;
  const t = now();
  const o = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  o.type = 'sawtooth'; o2.type = 'sawtooth';
  o.frequency.setValueAtTime(55, t); o.frequency.exponentialRampToValueAtTime(220, t + seconds);
  o2.frequency.setValueAtTime(55.6, t); o2.frequency.exponentialRampToValueAtTime(221.5, t + seconds);
  f.type = 'lowpass'; f.Q.value = 8;
  f.frequency.setValueAtTime(120, t); f.frequency.exponentialRampToValueAtTime(4200, t + seconds);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + seconds);
  o.connect(f); o2.connect(f); f.connect(g).connect(master);
  o.start(t); o2.start(t);
  const s = ctx.createBufferSource(), nf = ctx.createBiquadFilter(), ng = ctx.createGain();
  s.buffer = noiseBuffer(seconds + 0.5); nf.type = 'highpass'; nf.frequency.value = 5000;
  ng.gain.setValueAtTime(0.0001, t); ng.gain.exponentialRampToValueAtTime(0.05, t + seconds);
  s.connect(nf).connect(ng).connect(master); s.start(t);
  charge = { o, o2, g, s, ng };
}
export function chargeStop() {
  if (!charge || !ctx) return;
  const t = now();
  [charge.g, charge.ng].forEach((g) => { g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0.0001, t, 0.05); });
  [charge.o, charge.o2, charge.s].forEach((n) => n.stop(t + 0.3));
  charge = null;
}

export function unlock() {
  if (!ok()) return;
  chargeStop();
  const t = now();
  // sub boom
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(32, t + 1.2);
  env(g, t, 0.005, 1.6, 0.6);
  o.connect(g).connect(master); o.start(t); o.stop(t + 1.8);
  // shimmer chord (D major add9, bell-like)
  [587.33, 739.99, 880, 1318.5, 1760].forEach((f, i) => setTimeout(() => ting(f, 0.07, 2.6), i * 70));
  whoosh(1.4, true);
}

export function setMuted(m) {
  muted = m;
  music.muted = m;
  if (master) master.gain.setTargetAtTime(m ? 0 : 0.32, ctx.currentTime, 0.1);
}
export const isMuted = () => muted;

// talking-voice texture for the assistant (formant-ish chirps)
export function voiceChirp() {
  if (!ok()) return;
  const t = now(), o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  o.type = 'sawtooth'; o.frequency.value = 120 + Math.random() * 60;
  f.type = 'bandpass'; f.Q.value = 6; f.frequency.value = 600 + Math.random() * 1600;
  env(g, t, 0.01, 0.09, 0.025);
  o.connect(f).connect(g).connect(master); o.start(t); o.stop(t + 0.15);
}

// Background music: drop an instrumental track at public/music/background.mp3.
// Plays quietly, fades in, loops; silently does nothing if the file is missing.
const music = new Audio();
music.loop = true; music.preload = 'none'; music.volume = 0;
export function startMusic(src = 'music/background.mp3', target = 0.28) {
  if (!music.src) music.src = src;
  music.muted = muted;
  music.play().then(() => {
    const t0 = performance.now();
    const fade = () => { const k = Math.min(1, (performance.now() - t0) / 4000); music.volume = target * k; if (k < 1) requestAnimationFrame(fade); };
    fade();
  }).catch(() => { /* no file or autoplay refused — stay silent */ });
}
