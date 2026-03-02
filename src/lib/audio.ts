// ─── Shared AudioContext (single global instance) ────────────────────────────

let _audioCtx: AudioContext | null = null;
let _warmedUp = false;
let _firstSound = true;

export function getAudioCtx(): AudioContext | null {
  try {
    if (!_audioCtx || _audioCtx.state === "closed")
      _audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    return _audioCtx;
  } catch { return null; }
}

// ─── Warm up: call once on first user gesture ────────────────────────────────
// Plays a short silent tone (not just 1 sample) to fully prime the audio graph.

export function warmUpAudio() {
  if (_warmedUp) return;
  _warmedUp = true;
  const ctx = getAudioCtx();
  if (!ctx) return;
  const doWarmup = () => {
    // Play a short silent oscillator — primes the graph better than a 1-sample buffer
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime); // silent
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
    // After warmup is done, mark first sound as ready
    osc.onended = () => { _firstSound = false; };
  };
  if (ctx.state === "suspended") {
    ctx.resume().then(doWarmup);
  } else {
    doWarmup();
  }
}

// ─── Internal: sync-safe context getter ──────────────────────────────────────

function getCtx(): AudioContext | null {
  const ctx = getAudioCtx();
  if (!ctx) return null;
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// Offset: larger for the very first sound in case warmup isn't fully done yet
function t0(ctx: AudioContext): number {
  if (_firstSound) { _firstSound = false; return ctx.currentTime + 0.18; }
  return ctx.currentTime + 0.05;
}

// ─── Balloon pop sound (Celebration) ─────────────────────────────────────────

export function playPopSound() {
  const ctx = getCtx(); if (!ctx) return;
  const t = t0(ctx);
  const sz = Math.floor(ctx.sampleRate * 0.1);
  const buf = ctx.createBuffer(1, sz, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < sz; i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/sz, 5);
  const noise = ctx.createBufferSource(); noise.buffer = buf;
  const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 200; bp.Q.value = 0.7;
  const g = ctx.createGain(); g.gain.setValueAtTime(1.4, t); g.gain.exponentialRampToValueAtTime(0.001, t+0.12);
  noise.connect(bp); bp.connect(g); g.connect(ctx.destination); noise.start(t); noise.stop(t+0.12);
  const osc = ctx.createOscillator(), og = ctx.createGain();
  osc.frequency.setValueAtTime(90, t); osc.frequency.exponentialRampToValueAtTime(40, t+0.05);
  og.gain.setValueAtTime(0.7, t); og.gain.exponentialRampToValueAtTime(0.001, t+0.06);
  osc.connect(og); og.connect(ctx.destination); osc.start(t); osc.stop(t+0.06);
}

// ─── Envelope open sound (Celebration) ───────────────────────────────────────

export function playEnvelopeSound() {
  const ctx = getCtx(); if (!ctx) return;
  const t = t0(ctx);
  const sz = Math.floor(ctx.sampleRate * 0.15);
  const buf = ctx.createBuffer(1, sz, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < sz; i++) d[i] = (Math.random()*2-1) * Math.sin((i/sz)*Math.PI) * 0.4;
  const rustle = ctx.createBufferSource(); rustle.buffer = buf;
  const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1800;
  const rg = ctx.createGain(); rg.gain.setValueAtTime(0.6, t); rg.gain.exponentialRampToValueAtTime(0.001, t+0.15);
  rustle.connect(hp); hp.connect(rg); rg.connect(ctx.destination); rustle.start(t); rustle.stop(t+0.15);
  [523, 659, 784].forEach((freq, i) => {
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = "sine"; osc.frequency.value = freq;
    const ts = t + i * 0.07;
    g.gain.setValueAtTime(0, ts); g.gain.linearRampToValueAtTime(0.18, ts+0.02); g.gain.exponentialRampToValueAtTime(0.001, ts+0.5);
    osc.connect(g); g.connect(ctx.destination); osc.start(ts); osc.stop(ts+0.5);
  });
}

// ─── Smash sound (Countdown) ──────────────────────────────────────────────────

export function playSmashSound() {
  const ctx = getCtx(); if (!ctx) return;
  const t = t0(ctx);
  const pop = ctx.createOscillator(), popG = ctx.createGain();
  pop.type = "sine";
  pop.frequency.setValueAtTime(400, t);
  pop.frequency.exponentialRampToValueAtTime(80, t+0.12);
  popG.gain.setValueAtTime(0.35, t); popG.gain.exponentialRampToValueAtTime(0.001, t+0.14);
  pop.connect(popG); popG.connect(ctx.destination); pop.start(t); pop.stop(t+0.15);
  [1047, 1319, 1568].forEach((freq, i) => {
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = "triangle"; osc.frequency.value = freq;
    const ts = t + i * 0.05;
    g.gain.setValueAtTime(0, ts); g.gain.linearRampToValueAtTime(0.07, ts+0.01); g.gain.exponentialRampToValueAtTime(0.001, ts+0.25);
    osc.connect(g); g.connect(ctx.destination); osc.start(ts); osc.stop(ts+0.26);
  });
}