// =====================================================================
// OPERACIÓN DESPACHO CRÍTICO 360° — Audio 100% sintetizado (Web Audio API)
// Sin archivos MP3/WAV: osciladores, ruido filtrado y envolventes.
// =====================================================================

const DTMF = {
  1: [697, 1209], 2: [697, 1336], 3: [697, 1477],
  4: [770, 1209], 5: [770, 1336], 6: [770, 1477],
  7: [852, 1209], 8: [852, 1336], 9: [852, 1477],
  0: [941, 1336], C: [941, 1209], OK: [941, 1477],
};

export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
    this.ambient = null;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.75;
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 5;
    this.master.connect(comp).connect(this.ctx.destination);
    this._startAmbient();
  }

  get t() { return this.ctx ? this.ctx.currentTime : 0; }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.75, this.t, 0.05);
    return this.muted;
  }

  // ---------- primitivas ----------
  _tone({ freq, type = 'sine', at = 0, dur = 0.2, gain = 0.2, freqEnd = null, attack = 0.006, dest = null }) {
    if (!this.ctx) return;
    const t0 = this.t + at;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(dest || this.master);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  _noiseBuffer() {
    if (this._nb) return this._nb;
    const len = this.ctx.sampleRate * 2;
    const b = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this._nb = b;
    return b;
  }

  _noise({ at = 0, dur = 0.3, gain = 0.2, freq = 1000, freqEnd = null, type = 'lowpass', q = 1, attack = 0.01 }) {
    if (!this.ctx) return;
    const t0 = this.t + at;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer();
    src.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(freq, t0);
    if (freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  // ---------- ambiente: zumbido de bodega 55 Hz + 110.5 Hz ----------
  _startAmbient() {
    const c = this.ctx;
    const out = c.createGain();
    out.gain.value = 0.0001;
    out.gain.exponentialRampToValueAtTime(0.11, c.currentTime + 3);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 320;
    const o1 = c.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 55;
    const o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = 110.5;
    const g1 = c.createGain(); g1.gain.value = 0.35;
    const g2 = c.createGain(); g2.gain.value = 0.5;
    o1.connect(g1).connect(lp);
    o2.connect(g2).connect(lp);
    // Ventilación (ruido filtrado con LFO)
    const air = c.createBufferSource();
    air.buffer = this._noiseBuffer();
    air.loop = true;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = 0.6;
    const ga = c.createGain(); ga.gain.value = 0.22;
    const lfo = c.createOscillator(); lfo.frequency.value = 0.13;
    const lg = c.createGain(); lg.gain.value = 160;
    lfo.connect(lg).connect(bp.frequency);
    air.connect(bp).connect(ga).connect(out);
    lp.connect(out).connect(this.master);
    o1.start(); o2.start(); air.start(); lfo.start();
    this.ambient = { out, lp, bp };
  }

  // Al salir al patio: menos zumbido, más viento abierto
  setStageAmbience(stage) {
    if (!this.ambient) return;
    const t = this.t;
    if (stage === 2) {
      this.ambient.lp.frequency.setTargetAtTime(180, t, 1.2);
      this.ambient.bp.frequency.setTargetAtTime(900, t, 1.2);
      this.ambient.out.gain.setTargetAtTime(0.085, t, 1.2);
    }
  }

  // ---------- efectos ----------
  click() {
    this._noise({ dur: 0.04, gain: 0.25, freq: 2600, type: 'bandpass', q: 2 });
    this._tone({ freq: 190, type: 'square', dur: 0.05, gain: 0.08 });
  }

  hover() { this._tone({ freq: 1400, dur: 0.04, gain: 0.03 }); }

  dtmf(key) {
    const f = DTMF[key];
    if (!f) return;
    this._tone({ freq: f[0], dur: 0.14, gain: 0.11 });
    this._tone({ freq: f[1], dur: 0.14, gain: 0.11 });
    this._noise({ dur: 0.03, gain: 0.12, freq: 2200, type: 'bandpass', q: 2 });
  }

  whoosh() {
    this._noise({ dur: 0.9, gain: 0.16, freq: 300, freqEnd: 2400, type: 'bandpass', q: 1.2, attack: 0.3 });
  }

  success() {
    // Acorde armónico mayor ascendente
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      this._tone({ freq: f, type: 'triangle', at: i * 0.09, dur: 0.75, gain: 0.16 });
      this._tone({ freq: f * 2, at: i * 0.09, dur: 0.5, gain: 0.04 });
    });
  }

  keyUnlock() {
    this._tone({ freq: 880, type: 'square', dur: 0.08, gain: 0.07 });
    this._tone({ freq: 1320, type: 'square', at: 0.09, dur: 0.14, gain: 0.07 });
    this._noise({ at: 0.02, dur: 0.12, gain: 0.14, freq: 3200, type: 'highpass' });
  }

  error() {
    // Buzzer industrial: -15 s
    this._tone({ freq: 148, type: 'sawtooth', dur: 0.5, gain: 0.26, freqEnd: 92 });
    this._tone({ freq: 157, type: 'square', dur: 0.5, gain: 0.14, freqEnd: 98 });
    this._noise({ dur: 0.22, gain: 0.12, freq: 700 });
  }

  alertPulse(urgent = false) {
    this._tone({ freq: urgent ? 1040 : 820, type: 'sine', dur: 0.12, gain: 0.07 });
    if (urgent) this._tone({ freq: 1040, type: 'sine', at: 0.16, dur: 0.1, gain: 0.06 });
  }

  // Sirena + motor hidráulico del portón
  gate() {
    if (!this.ctx) return;
    for (let i = 0; i < 4; i++) {
      this._tone({ freq: 620, freqEnd: 960, type: 'triangle', at: i * 0.62, dur: 0.3, gain: 0.1 });
      this._tone({ freq: 960, freqEnd: 620, type: 'triangle', at: i * 0.62 + 0.3, dur: 0.3, gain: 0.1 });
    }
    this._tone({ freq: 46, freqEnd: 74, type: 'sawtooth', at: 1.1, dur: 3.6, gain: 0.22, attack: 0.4 });
    this._tone({ freq: 92, freqEnd: 150, type: 'square', at: 1.1, dur: 3.6, gain: 0.05, attack: 0.4 });
    this._noise({ at: 1.1, dur: 3.6, gain: 0.16, freq: 500, freqEnd: 1500, type: 'bandpass', q: 0.8, attack: 0.5 });
    for (let i = 0; i < 16; i++) this._noise({ at: 1.3 + i * 0.21, dur: 0.05, gain: 0.1, freq: 1800, type: 'bandpass', q: 3 });
    this._noise({ at: 4.7, dur: 0.3, gain: 0.3, freq: 240 });
    this._tone({ freq: 70, freqEnd: 38, type: 'sine', at: 4.7, dur: 0.4, gain: 0.3 });
  }

  // Motor diésel del camión arrancando y alejándose
  truck() {
    if (!this.ctx) return;
    for (let i = 0; i < 5; i++) this._noise({ at: i * 0.13, dur: 0.09, gain: 0.2, freq: 320, type: 'bandpass', q: 2 });
    this._tone({ freq: 38, freqEnd: 118, type: 'sawtooth', at: 0.7, dur: 6, gain: 0.26, attack: 0.5 });
    this._tone({ freq: 76, freqEnd: 236, type: 'square', at: 0.7, dur: 6, gain: 0.05, attack: 0.5 });
    this._noise({ at: 0.7, dur: 6, gain: 0.14, freq: 220, freqEnd: 900, attack: 0.6 });
    // Bocina doble
    for (const at of [1.5, 2.0]) {
      this._tone({ freq: 311, type: 'sawtooth', at, dur: 0.32, gain: 0.11, attack: 0.03 });
      this._tone({ freq: 392, type: 'sawtooth', at, dur: 0.32, gain: 0.1, attack: 0.03 });
    }
    // Chicharra de la barrera
    for (let i = 0; i < 3; i++) this._tone({ freq: 1200, type: 'square', at: i * 0.22, dur: 0.1, gain: 0.05 });
  }

  victory() {
    const seq = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5];
    seq.forEach((f, i) => {
      this._tone({ freq: f, type: 'triangle', at: i * 0.14, dur: 0.5, gain: 0.16 });
      this._tone({ freq: f / 2, type: 'sine', at: i * 0.14, dur: 0.5, gain: 0.08 });
    });
    [261.63, 329.63, 392, 523.25].forEach((f) => this._tone({ freq: f, type: 'sawtooth', at: 1.05, dur: 1.8, gain: 0.06, attack: 0.05 }));
  }

  timeout() {
    this._tone({ freq: 440, freqEnd: 110, type: 'sawtooth', dur: 1.6, gain: 0.22 });
    this._tone({ freq: 220, freqEnd: 55, type: 'square', dur: 1.6, gain: 0.1 });
  }
}

export const audio = new AudioSystem();
