// audio.js — every sound in Ember Kitchen is synthesized with WebAudio:
// no audio files, no network, just a few oscillators and noise bursts.

let ctx = null;
let muted = false;

export function ensureAudio() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function tone(freq, dur, type, vol, when = 0) {
  if (!ctx || muted) return;
  const t = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise(dur, vol, filterFreq) {
  if (!ctx || muted) return;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  const gain = ctx.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start();
}

// Named sound effects used by the kitchen and the order board.
export function playSfx(name) {
  ensureAudio();
  if (name === 'pickup') tone(520, 0.08, 'sine', 0.12);
  if (name === 'chop') { noise(0.09, 0.25, 1800); tone(220, 0.06, 'square', 0.08); }
  if (name === 'sizzle') noise(0.5, 0.18, 4200);
  if (name === 'plate') { tone(660, 0.09, 'sine', 0.14); tone(880, 0.12, 'sine', 0.12, 0.07); }
  if (name === 'done') { tone(784, 0.12, 'sine', 0.14); tone(1046, 0.18, 'sine', 0.14, 0.1); }
  if (name === 'serve') { tone(523, 0.1, 'sine', 0.16); tone(659, 0.1, 'sine', 0.16, 0.09); tone(784, 0.2, 'sine', 0.16, 0.18); }
  if (name === 'burn') { tone(160, 0.3, 'sawtooth', 0.12); noise(0.25, 0.2, 900); }
  if (name === 'click') tone(440, 0.05, 'sine', 0.1);
  if (name === 'dayEnd') { tone(392, 0.15, 'sine', 0.15); tone(523, 0.15, 'sine', 0.15, 0.14); tone(659, 0.3, 'sine', 0.15, 0.28); }
}
