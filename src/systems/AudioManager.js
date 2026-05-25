// AudioManager.js -- All audio synthesized via Web Audio API. No audio files needed.
//
// Usage:
//   AudioManager.init()        -- call once after a user gesture to create the context
//   AudioManager.playSfx(name) -- plays a one-shot effect
//   AudioManager.startMusic()  -- begins the looping background track
//   AudioManager.stopMusic()   -- fades out and stops
//   AudioManager.pauseMusic()  -- suspends the audio context (scene pause)
//   AudioManager.resumeMusic() -- resumes the audio context (scene resume)
//   AudioManager.toggleMute()  -- toggles mute; returns new muted state
//
// SFX names: 'jump' | 'land' | 'stomp' | 'coin' | 'damage' | 'death' |
//            'level_clear' | 'dash' | 'pause' | 'checkpoint'

let _ctx    = null;   // Web AudioContext (lazy)
let _master = null;   // master GainNode
let _muted  = localStorage.getItem('scramble_muted') === '1';  // restore on load
const _VOL  = 0.60;   // master volume (0‒1)

// ── Music scheduler state ─────────────────────────────────────────────────────
let _music_running  = false;
let _scheduler_id   = null;
let _next_step      = 0;
let _next_step_time = 0;
let _pad_nodes      = [];

const BPM      = 96;
const BEAT_S   = 60 / BPM;             // seconds per beat  (~0.625 s)
const LOOK_S   = 0.25;                  // schedule this far ahead
const SCHED_MS = 100;                   // scheduler interval (ms)
const STEPS    = 16;                    // steps per loop (4 bars of 4/4 at 1 step = 1 beat)

// Bass (triangle, low register). Hz or null.
const BASS_SEQ = [110, null, null, 110,   82.4, null, null, 82.4,
                  110, null, null, 110,    98,  null, null, 98   ];

// Melody (sine, high register). Hz or null.
const MEL_SEQ  = [null, 440, null, null,  null, 330, null, null,
                  null, 392, null, null,  null, 440, null, 523   ];

// ── Internal helpers ──────────────────────────────────────────────────────────

function _ensure() {
  if (!_ctx) return false;
  if (_ctx.state === 'suspended') _ctx.resume();
  return true;
}

// Short tone: oscillator with linear frequency glide and exponential gain decay.
function _tone(type, freq0, freq1, ms, peakGain) {
  if (!_ensure()) return;
  const osc = _ctx.createOscillator();
  const g   = _ctx.createGain();
  const now = _ctx.currentTime;
  const dur = ms / 1000;
  osc.type = type;
  osc.frequency.setValueAtTime(freq0, now);
  if (freq1 !== freq0) osc.frequency.linearRampToValueAtTime(freq1, now + dur);
  g.gain.setValueAtTime(peakGain, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(g);
  g.connect(_master);
  osc.start(now);
  osc.stop(now + dur + 0.05);
}

// Burst of filtered noise for textural hits.
function _noise(ms, peakGain, hpHz, lpHz) {
  if (!_ensure()) return;
  const len  = Math.ceil(_ctx.sampleRate * ms / 1000);
  const buf  = _ctx.createBuffer(1, len, _ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src  = _ctx.createBufferSource();
  src.buffer = buf;
  const hp   = _ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = hpHz;
  const lp   = _ctx.createBiquadFilter(); lp.type = 'lowpass';  lp.frequency.value = lpHz;
  const g    = _ctx.createGain();
  const now  = _ctx.currentTime;
  g.gain.setValueAtTime(peakGain, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + ms / 1000);
  src.connect(hp); hp.connect(lp); lp.connect(g); g.connect(_master);
  src.start(now);
}

// Schedule a single music note at a precise audio-clock time.
function _noteOn(type, freq, peakGain, startTime, durS) {
  const osc = _ctx.createOscillator();
  const g   = _ctx.createGain();
  osc.type  = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0,         startTime);
  g.gain.linearRampToValueAtTime(peakGain,  startTime + 0.015);
  g.gain.setValueAtTime(peakGain,            startTime + durS * 0.65);
  g.gain.exponentialRampToValueAtTime(0.0001, startTime + durS);
  osc.connect(g);
  g.connect(_master);
  osc.start(startTime);
  osc.stop(startTime + durS + 0.05);
}

// Run the scheduler: queue beats until we're LOOK_S ahead of now.
function _runScheduler() {
  if (!_music_running) return;
  while (_next_step_time < _ctx.currentTime + LOOK_S) {
    const step = _next_step % STEPS;
    const t    = _next_step_time;
    const dur  = BEAT_S * 0.75;

    if (BASS_SEQ[step] !== null) _noteOn('triangle', BASS_SEQ[step] * 0.5, 0.13, t, dur);
    if (MEL_SEQ[step]  !== null) _noteOn('sine',     MEL_SEQ[step],         0.07, t, dur);

    _next_step++;
    _next_step_time += BEAT_S;
  }
  _scheduler_id = setTimeout(_runScheduler, SCHED_MS);
}

// Create three detuned sine oscillators for the ambient pad.
function _startPad() {
  const bases = [55, 82.4, 110];   // A1, E2, A2 — low ambient drone
  bases.forEach((f, i) => {
    const osc  = _ctx.createOscillator();
    const gain = _ctx.createGain();
    osc.type   = 'sine';
    osc.frequency.value = f * (1 + i * 0.003);   // subtle detune per layer
    gain.gain.value = 0.025;
    osc.connect(gain);
    gain.connect(_master);
    osc.start();
    _pad_nodes.push({ osc, gain });
  });
}

function _stopPad(fadeS = 1.0) {
  const now = _ctx.currentTime;
  _pad_nodes.forEach(({ osc, gain }) => {
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + fadeS);
    osc.stop(now + fadeS + 0.05);
  });
  _pad_nodes = [];
}

// ── Public API ────────────────────────────────────────────────────────────────

export const AudioManager = {
  /** Call once, from a user-gesture callback (tap / keydown). */
  init() {
    if (_ctx) return;
    _ctx    = new (window.AudioContext || window.webkitAudioContext)();
    _master = _ctx.createGain();
    _master.gain.value = _muted ? 0 : _VOL;
    _master.connect(_ctx.destination);

    // Restore saved mute state.
    if (localStorage.getItem('scramble_muted') === '1') {
      _muted = true;
      _master.gain.value = 0;
    }
  },

  playSfx(name) {
    if (!_ctx) return;
    if (_ctx.state === 'suspended') _ctx.resume();
    switch (name) {
      case 'jump':
        _tone('sine',     200, 420,  75, 0.22); break;
      case 'land':
        _tone('sine',     85,  40,   70, 0.18);
        _noise(55, 0.15, 60, 500); break;
      case 'stomp':
        _tone('sine',     80,  40,   60, 0.25);
        _tone('sine',     900, 600,  40, 0.12); break;
      case 'coin':
        _tone('sine',     660, 990,  85, 0.25); break;
      case 'damage':
        _tone('sawtooth', 360, 140, 130, 0.20); break;
      case 'death':
        _tone('sine', 220, 190, 160, 0.18);
        setTimeout(() => _tone('sine', 165, 140, 160, 0.15), 170);
        setTimeout(() => _tone('sine', 110, 80,  200, 0.20), 340); break;
      case 'level_clear':
        [0, 1, 2, 3].forEach((i) => {
          setTimeout(() => _tone('sine', [261.6, 329.6, 392, 523.3][i], [261.6, 329.6, 392, 523.3][i], 180, 0.18), i * 130);
        }); break;
      case 'dash':
        _noise(70, 0.14, 600, 4000);
        _tone('sawtooth', 280, 100, 70, 0.10); break;
      case 'pause':
        _tone('sine',     260, 260,  50, 0.10); break;
      case 'checkpoint':
        _tone('triangle', 440, 440, 90, 0.16);
        setTimeout(() => _tone('triangle', 660, 660, 100, 0.14), 100); break;
    }
  },

  startMusic() {
    if (!_ctx || _music_running) return;
    if (_ctx.state === 'suspended') _ctx.resume();
    _music_running  = true;
    _next_step      = 0;
    _next_step_time = _ctx.currentTime + 0.1;
    _startPad();
    _runScheduler();
  },

  stopMusic() {
    _music_running = false;
    if (_scheduler_id) { clearTimeout(_scheduler_id); _scheduler_id = null; }
    if (_pad_nodes.length) _stopPad(0.8);
  },

  /** Suspend the AudioContext when the game is paused (zero CPU). */
  pauseMusic() {
    if (_ctx && _ctx.state === 'running') _ctx.suspend();
  },

  /** Resume the AudioContext when gameplay resumes. */
  resumeMusic() {
    if (_ctx && _ctx.state === 'suspended') _ctx.resume();
  },

  get muted() { return _muted; },

  /** Toggle mute; persists to localStorage. Returns new muted state. */
  toggleMute() {
    _muted = !_muted;
    if (_master) _master.gain.setValueAtTime(_muted ? 0 : _VOL, _ctx.currentTime);
    localStorage.setItem('scramble_muted', _muted ? '1' : '0');
    return _muted;
  },
};
