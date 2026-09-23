/* Project Mayhem: sound. Everything is synthesised with the Web Audio API, so there are no audio files to download or license.
 * The style is industrial, not chiptune: impacts, metal rings, servo whirs, steam, electrical crackle, a little room reverb, dark ambient music.
 *
 * Most actions play a short recorded-style sample (dist/sfx/*.mp3, one per action, generated once and kept in the repo). A name with no
 * loaded sample falls back to the synthesised version below, so the game is never silent while files load or if one is missing.
 *
 * Loaded by the level pages before the game script. The games call it through a guarded helper, so a page without this file (or a browser
 * without Web Audio) simply plays silently.
 *
 *   MayhemAudio.play(name, {d})   one sound effect; d = distance in px from the player (quieter, and skipped when far)
 *   MayhemAudio.scene(name)       start the ambient bed and music for a level ('facility' | 'furnace'); scene(null) stops them
 *   MayhemAudio.toggleMute()      also bound to the M key
 *   MayhemAudio.setVolume(kind, v) kind 'sfx' | 'music', v 0..1 (the settings panel behind the speaker button in the top-right corner;
 *                                 the [ and ] keys nudge the effects volume). Volumes and mute are remembered on the device.
 *
 * Browsers only allow sound after a click or key press, so the audio context is created and resumed on the first one. The mute choice is
 * remembered on the device. Sound pauses while the tab is hidden.
 */
(function () {
  'use strict';
  const KEY = 'mayhem.muted', AC = window.AudioContext || window.webkitAudioContext;
  let ctx = null, master = null, sfxBus = null, musBus = null, reverbIn = null, noiseBuf = null, muted = true, sceneName = null, timer = null, nextAt = 0, beat = 0, btn = null;
  const lastPlayed = {};
  const BASE = (document.currentScript && document.currentScript.src || '').replace(/[?#].*$/, '').replace(/[^/]*$/, '');
  // action name -> the takes to choose from (files in dist/sfx/), a longest playing time in seconds, and a volume trim
  const SAMPLES = {
    jump: { f: ['jump'], max: 0.9 }, land: { f: ['land'], max: 0.9 }, step: { f: ['step1'], max: 0.35, g: 0.9, v: 0.16 },
    grab: { f: ['grab'], max: 0.6 }, climb: { f: ['climb'], max: 1.1 }, cog: { f: ['cog'], max: 1.0 }, hurt: { f: ['hurt'], max: 1.2 },
    checkpoint: { f: ['checkpoint'], max: 1.4 }, 'switch': { f: ['switch'], max: 1.2 }, clunk: { f: ['clunk'], max: 1.0 },
    // still synthesised until their recordings are added to dist/sfx/: catch ui power valve shutter blast zap spit dissolve win pack bix vela sys
  };
  const bank = {};      // name -> loaded takes: { buf, start, dur, norm }
  const VKEY = 'mayhem.volume', vol = { sfx: 1, music: 0.7 };
  const clamp01 = v => Math.max(0, Math.min(1, Number.isFinite(+v) ? +v : 0));
  try { const saved = localStorage.getItem(KEY); if (saved !== null) muted = saved === '1' } catch (e) { /* private mode: not remembered */ }
  try { const v = JSON.parse(localStorage.getItem(VKEY) || 'null'); if (v && typeof v === 'object') { if ('sfx' in v) vol.sfx = clamp01(v.sfx); if ('music' in v) vol.music = clamp01(v.music) } } catch (e) { /* not remembered */ }

  function init() {
    if (ctx || !AC) return ctx;
    try {
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = muted ? 0 : 0.8;
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 5;
      master.connect(comp); comp.connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9 * vol.sfx; sfxBus.connect(master);
      musBus = ctx.createGain(); musBus.gain.value = 0.55 * vol.music; musBus.connect(master);
      const len = ctx.sampleRate * 2; noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      // a small metal room: a decaying-noise impulse response, mixed in quietly under everything
      const irLen = Math.floor(ctx.sampleRate * 1.8), ir = ctx.createBuffer(2, irLen, ctx.sampleRate);
      for (let c = 0; c < 2; c++) { const dd = ir.getChannelData(c); for (let i = 0; i < irLen; i++) dd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 2.6) }
      reverbIn = ctx.createGain(); const conv = ctx.createConvolver(), rvOut = ctx.createGain(); conv.buffer = ir; rvOut.gain.value = 0.55;
      reverbIn.connect(conv); conv.connect(rvOut); rvOut.connect(master);
    } catch (e) { ctx = null }
    return ctx;
  }
  // Trim the silence off the front and the tail off the end, and level every take so their loudness is comparable.
  function prep(buf, max) {
    const d = buf.getChannelData(0), sr = buf.sampleRate; let peak = 0;
    for (let i = 0; i < d.length; i++) { const v = Math.abs(d[i]); if (v > peak) peak = v }
    if (peak < 0.0005) return null;
    let a = 0; while (a < d.length && Math.abs(d[a]) < peak * 0.05) a++;
    a = Math.max(0, a - Math.floor(sr * 0.008));
    const lim = Math.min(d.length, a + Math.floor(sr * max));
    let b = lim - 1; while (b > a && Math.abs(d[b]) < peak * 0.03) b--;
    b = Math.min(lim, b + Math.floor(sr * 0.04));
    return { buf, start: a / sr, dur: Math.max(0.03, (b - a) / sr), norm: Math.min(12, 0.8 / peak) };
  }
  let loading = false;
  function loadSamples() {
    if (loading || !ctx || typeof fetch !== 'function') return; loading = true;
    for (const [name, e] of Object.entries(SAMPLES)) for (const file of e.f) {
      try {
        fetch(BASE + 'sfx/' + file + '.mp3').then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer() })
          .then(ab => new Promise((res, rej) => ctx.decodeAudioData(ab, res, rej)))
          .then(buf => { const t = prep(buf, e.max); if (t) (bank[name] = bank[name] || []).push(t) })
          .catch(() => { /* a missing take just means the synthesised sound is used */ });
      } catch (err) { /* fetch unavailable */ }
    }
  }
  function playSample(name, k) {
    const takes = bank[name], e = SAMPLES[name], take = takes[Math.floor(rnd() * takes.length)];
    const t = ctx.currentTime, src = ctx.createBufferSource(), g = ctx.createGain(), v = (e.g || 1) * take.norm * k * (e.v || 0.5);
    src.buffer = take.buf; src.playbackRate.value = 1 + (rnd() - 0.5) * 0.12;
    const dur = take.dur / src.playbackRate.value;
    g.gain.setValueAtTime(v, t); g.gain.setValueAtTime(v, t + Math.max(0, dur - 0.06)); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    src.connect(g); out(g, null, e.w === undefined ? 0.06 : e.w); src.start(t, take.start, take.dur); src.stop(t + dur + 0.05);
  }
  function unlock() { if (init()) { if (ctx.state === 'suspended') ctx.resume().catch(() => {}); loadSamples() } }

  // ---- building blocks -------------------------------------------------------------------------------------------------------
  const rnd = () => Math.random();
  function out(g, bus, wet) {
    g.connect(bus || sfxBus);
    if (wet > 0 && reverbIn) { const w = ctx.createGain(); w.gain.value = wet; g.connect(w); w.connect(reverbIn) }
  }
  function tone(o) {
    const t = ctx.currentTime + (o.at || 0), g = ctx.createGain(), os = ctx.createOscillator();
    os.type = o.type || 'sine'; os.frequency.setValueAtTime(o.f, t);
    if (o.f2) os.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t + o.dur);
    const v = Math.max(0.0002, (o.vol || 0.2) * (o.k || 1));
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + (o.a || 0.006)); g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    let node = os;
    if (o.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; os.connect(f); node = f }
    node.connect(g); out(g, o.bus, o.w === undefined ? 0.12 : o.w); os.start(t); os.stop(t + o.dur + 0.05);
  }
  function noise(o) {
    const t = ctx.currentTime + (o.at || 0), src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noiseBuf; src.loop = true; src.playbackRate.value = o.rate || 1;
    f.type = o.type || 'lowpass'; f.frequency.setValueAtTime(o.f0 || 1000, t); if (o.f1) f.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), t + o.dur); f.Q.value = o.q || 0.8;
    const v = Math.max(0.0002, (o.vol || 0.2) * (o.k || 1));
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + (o.a || 0.004)); g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    src.connect(f); f.connect(g); out(g, o.bus, o.w === undefined ? 0.1 : o.w); src.start(t, rnd()); src.stop(t + o.dur + 0.05);
  }
  // steel is not a note: a struck plate rings with inharmonic partials
  const PARTIALS = [[1, 1], [2.76, 0.6], [5.4, 0.36], [8.93, 0.2], [13.3, 0.1]];
  function metal(o) { PARTIALS.forEach(([r, v], i) => tone({ f: o.f * r, dur: o.dur / (1 + i * 0.45), vol: (o.vol || 0.1) * v, at: o.at, k: o.k, a: 0.002, bus: o.bus, w: o.w === undefined ? 0.3 : o.w })) }
  // a low body: the pitch drops fast, with a bit of air behind it
  function thud(o) { tone({ f: o.f, f2: o.f2, dur: o.dur, vol: o.vol, at: o.at, k: o.k, a: 0.004, bus: o.bus, w: 0.05 }); noise({ f0: o.f * 8, f1: o.f, dur: o.dur * 0.7, vol: o.vol * 0.45, at: o.at, k: o.k, bus: o.bus, w: 0.05 }) }
  // a motor: a low saw through a low-pass, sweeping
  function servo(o) { tone({ f: o.f, f2: o.f2, dur: o.dur, vol: o.vol, at: o.at, k: o.k, type: 'sawtooth', lp: o.lp || 700, a: 0.03, w: 0.06 }) }
  // electrical crackle: many tiny random bursts
  function crackle(o) { for (let i = 0; i < o.n; i++) noise({ type: 'highpass', f0: 3000 + rnd() * 3500, dur: 0.012 + rnd() * 0.022, vol: o.vol * (0.4 + rnd() * 0.6), at: (o.at || 0) + rnd() * o.dur, k: o.k, a: 0.001, w: 0.05 }) }

  // ---- the sound effects (k is the volume scale) ----------------------------------------------------------------------------
  const SFX = {
    jump:   k => { noise({ type: 'bandpass', f0: 500, f1: 1500, dur: 0.17, vol: 0.07, q: 0.7, k }); thud({ f: 140, f2: 75, dur: 0.09, vol: 0.09, k }) },
    land:   k => { thud({ f: 85, f2: 38, dur: 0.17, vol: 0.2, k }); noise({ f0: 1500, f1: 200, dur: 0.09, vol: 0.09, k }); metal({ f: 210, dur: 0.2, vol: 0.03, k }) },
    step:   k => { noise({ type: 'bandpass', f0: 450 + rnd() * 350, dur: 0.05, vol: 0.06, q: 1.2, k }); metal({ f: 300 + rnd() * 110, dur: 0.07, vol: 0.012, k, w: 0.1 }) },
    grab:   k => { noise({ type: 'bandpass', f0: 2200, dur: 0.09, vol: 0.06, q: 2, k }); thud({ f: 115, f2: 70, dur: 0.09, vol: 0.11, k }) },
    climb:  k => { servo({ f: 160, f2: 300, dur: 0.26, vol: 0.05, k }); noise({ f0: 700, f1: 1300, dur: 0.2, vol: 0.05, k }) },
    cog:    k => { noise({ type: 'highpass', f0: 5000, dur: 0.03, vol: 0.05, k }); thud({ f: 180, f2: 110, dur: 0.06, vol: 0.06, k }); metal({ f: 1180, dur: 1.0, vol: 0.075, at: 0.03, w: 0.4, k }) },
    checkpoint: k => { noise({ type: 'bandpass', f0: 2500, dur: 0.03, vol: 0.08, q: 3, k }); thud({ f: 120, f2: 70, dur: 0.1, vol: 0.12, k }); servo({ f: 55, f2: 120, dur: 0.7, vol: 0.09, lp: 360, at: 0.05, k }); metal({ f: 660, dur: 0.8, vol: 0.03, at: 0.3, w: 0.5, k }) },
    hurt:   k => { thud({ f: 105, f2: 34, dur: 0.38, vol: 0.26, k }); noise({ f0: 3000, f1: 300, dur: 0.42, vol: 0.15, k }); crackle({ n: 10, dur: 0.3, vol: 0.06, k }) },
    catch:  k => { servo({ f: 300, f2: 950, dur: 0.22, vol: 0.06, lp: 1500, k }); noise({ type: 'highpass', f0: 3500, dur: 0.03, vol: 0.06, at: 0.2, k }); metal({ f: 880, dur: 0.35, vol: 0.03, at: 0.2, k }) },
    ui:     k => { noise({ type: 'highpass', f0: 3500, dur: 0.018, vol: 0.07, k }); thud({ f: 165, f2: 100, dur: 0.05, vol: 0.06, k }) },
    'switch': k => { thud({ f: 90, f2: 48, dur: 0.22, vol: 0.24, k }); metal({ f: 240, dur: 0.4, vol: 0.055, k }); crackle({ n: 9, dur: 0.35, vol: 0.06, at: 0.05, k }); servo({ f: 50, f2: 60, dur: 0.6, vol: 0.06, lp: 200, at: 0.15, k }) },
    power:  k => { servo({ f: 45, f2: 115, dur: 1.1, vol: 0.13, lp: 280, k }); servo({ f: 90, f2: 230, dur: 1.1, vol: 0.06, lp: 340, at: 0.1, k }); crackle({ n: 16, dur: 0.9, vol: 0.05, at: 0.3, k }); metal({ f: 520, dur: 1.0, vol: 0.03, at: 0.7, w: 0.5, k }) },
    clunk:  k => { thud({ f: 100, f2: 45, dur: 0.17, vol: 0.23, k }); noise({ f0: 1000, f1: 250, dur: 0.12, vol: 0.1, k }); metal({ f: 190, dur: 0.28, vol: 0.045, k }) },
    valve:  k => { for (let i = 0; i < 3; i++) noise({ type: 'bandpass', f0: 900 + i * 200, f1: 1500 + i * 150, dur: 0.11, vol: 0.05, q: 6, at: i * 0.12, k }); thud({ f: 95, f2: 55, dur: 0.14, vol: 0.14, at: 0.4, k }); metal({ f: 230, dur: 0.4, vol: 0.04, at: 0.4, k }) },
    shutter: k => { noise({ type: 'highpass', f0: 2500, f1: 800, dur: 0.5, vol: 0.08, k }); servo({ f: 120, f2: 260, dur: 0.5, vol: 0.07, k }); thud({ f: 70, f2: 40, dur: 0.22, vol: 0.2, at: 0.45, k }); metal({ f: 150, dur: 0.55, vol: 0.05, at: 0.45, k }) },
    blast:  k => { noise({ f0: 350, f1: 1700, dur: 0.75, vol: 0.16, q: 0.5, a: 0.07, k }); tone({ f: 62, f2: 40, dur: 0.75, vol: 0.11, type: 'sawtooth', lp: 150, a: 0.06, k }); crackle({ n: 10, dur: 0.6, vol: 0.04, k }) },
    zap:    k => { crackle({ n: 24, dur: 0.35, vol: 0.09, k }); tone({ f: 100, dur: 0.35, vol: 0.07, type: 'sawtooth', lp: 900, k }); noise({ type: 'highpass', f0: 5000, dur: 0.3, vol: 0.04, k }) },
    spit:   k => { noise({ f0: 2600, f1: 300, dur: 0.26, vol: 0.13, k }); thud({ f: 140, f2: 60, dur: 0.15, vol: 0.14, k }); crackle({ n: 6, dur: 0.2, vol: 0.04, k }) },
    dissolve: k => { noise({ type: 'highpass', f0: 4000, f1: 1500, dur: 0.5, vol: 0.08, a: 0.05, k }); crackle({ n: 16, dur: 0.45, vol: 0.04, k }) },
    win:    k => { thud({ f: 70, f2: 35, dur: 0.5, vol: 0.2, k }); [55, 82.4, 110, 165].forEach((f, i) => { tone({ f, dur: 3.2, vol: 0.07, type: 'sawtooth', lp: 500 + i * 60, a: 0.9, at: i * 0.12, w: 0.5, k }); tone({ f: f * 1.006, dur: 3.2, vol: 0.05, type: 'sawtooth', lp: 500 + i * 60, a: 0.9, at: i * 0.12, w: 0.5, k }) }); metal({ f: 330, dur: 2.4, vol: 0.05, at: 0.6, w: 0.6, k }) },
    pack:   k => { noise({ type: 'bandpass', f0: 3000, dur: 0.02, vol: 0.05, q: 3, k }); noise({ type: 'bandpass', f0: 3600, dur: 0.02, vol: 0.045, q: 3, at: 0.06, k }); tone({ f: 900, f2: 1250, dur: 0.05, vol: 0.02, at: 0.02, k }) },
    bix:    k => { thud({ f: 150, f2: 110, dur: 0.09, vol: 0.07, k }); noise({ type: 'bandpass', f0: 600, dur: 0.09, vol: 0.03, k }) },
    vela:   k => { metal({ f: 196, dur: 0.7, vol: 0.03, w: 0.5, k }); tone({ f: 98, dur: 0.55, vol: 0.03, a: 0.09, k }) },
    sys:    k => { noise({ type: 'highpass', f0: 4500, dur: 0.015, vol: 0.04, k }) },
  };
  const MIN_GAP = { step: 0.09, pack: 0.07, bix: 0.07, vela: 0.07, sys: 0.05, zap: 0.15, blast: 0.15, ui: 0.05, grab: 0.1 };

  function play(name, o) {
    if (!ctx || muted || ctx.state !== 'running' || !SFX[name]) return;
    let k = 1;
    if (o && typeof o.d === 'number') { k = Math.pow(Math.max(0, 1 - o.d / 950), 2); if (k < 0.05) return }
    const now = ctx.currentTime;
    if (lastPlayed[name] !== undefined && now - lastPlayed[name] < (MIN_GAP[name] || 0.03)) return;
    lastPlayed[name] = now;
    if (bank[name] && bank[name].length) { try { playSample(name, k) } catch (e) { /* fall through silently */ } return }
    try { SFX[name](k) } catch (e) { /* a sound must never break the game */ }
  }

  // ---- ambient bed and music ---------------------------------------------------------------------------------------------------
  // Dark ambience, not tunes: detuned low drones whose filters breathe, a slow machine pulse, and now and then a struck plate or a swell.
  let bed = null;
  function shaper(amount) { const c = ctx.createWaveShaper(), n = 256, curve = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; curve[i] = Math.tanh(x * amount) } c.curve = curve; return c }
  function startBed(freqs, cutoff, vol, grit) {
    stopBed();
    const g = ctx.createGain(); g.gain.value = 0; g.gain.linearRampToValueAtTime(vol, ctx.currentTime + 4); g.connect(musBus);
    const nodes = [];
    freqs.forEach((f, i) => {
      for (const det of [1, 1.0065]) {
        const o = ctx.createOscillator(), og = ctx.createGain(), lp = ctx.createBiquadFilter(), lfo = ctx.createOscillator(), lg = ctx.createGain();
        o.type = 'sawtooth'; o.frequency.value = f * det; og.gain.value = 0.22;
        lp.type = 'lowpass'; lp.frequency.value = cutoff; lp.Q.value = 2;
        lfo.frequency.value = 0.04 + rnd() * 0.08 + i * 0.01; lg.gain.value = cutoff * 0.5; lfo.connect(lg); lg.connect(lp.frequency);      // the filter breathes
        o.connect(lp); lp.connect(og);
        if (grit) { const sh = shaper(grit); og.connect(sh); sh.connect(g) } else og.connect(g);
        o.start(); lfo.start(); nodes.push(o, lfo);
      }
    });
    const src = ctx.createBufferSource(), nf = ctx.createBiquadFilter(), ng = ctx.createGain();      // a distant air handler
    src.buffer = noiseBuf; src.loop = true; nf.type = 'bandpass'; nf.frequency.value = cutoff * 1.4; nf.Q.value = 0.7; ng.gain.value = 0.1; src.connect(nf); nf.connect(ng); ng.connect(g); src.start(); nodes.push(src);
    bed = { g, nodes };
  }
  function stopBed() {
    if (!bed) return; const b = bed; bed = null;
    try { b.g.gain.cancelScheduledValues(ctx.currentTime); b.g.gain.setValueAtTime(b.g.gain.value, ctx.currentTime); b.g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8) } catch (e) { /* ignore */ }
    setTimeout(() => b.nodes.forEach(n => { try { n.stop() } catch (e) { /* already stopped */ } }), 1000);
  }
  const SCENES = {
    // Facility: cold and empty. Long drones, a slow heartbeat of machinery, glassy plate rings far away.
    facility: { step: 1.2, bed: [55, 82.4, 110], cut: 230, bedVol: 0.05, grit: 0,
      tick(b, t) {
        if (b % 2 === 0) thud({ f: 58, f2: 40, dur: 0.5, vol: 0.06, at: t, bus: musBus });
        if (b % 5 === 3 && rnd() < 0.8) metal({ f: [880, 1175, 1320, 990][b % 4], dur: 2.2, vol: 0.018, at: t, w: 0.7, bus: musBus });
        if (b % 11 === 6) tone({ f: 82.4, dur: 5, vol: 0.03, a: 2.2, at: t, w: 0.6, bus: musBus });
      } },
    // Furnace: heavier, slower, hotter. A distorted drone, a pulse like a piston, steam and the odd clang.
    furnace:  { step: 0.8, bed: [41.2, 61.7, 82.4], cut: 300, bedVol: 0.07, grit: 3,
      tick(b, t) {
        if (b % 4 === 0) thud({ f: 52, f2: 34, dur: 0.6, vol: 0.09, at: t, bus: musBus });
        if (b % 4 === 2) noise({ f0: 900, f1: 300, dur: 0.5, vol: 0.03, at: t, a: 0.1, bus: musBus });
        if (b % 9 === 5) metal({ f: [150, 180, 210][b % 3], dur: 1.6, vol: 0.03, at: t, w: 0.6, bus: musBus });
        if (b % 13 === 8) tone({ f: 61.7, dur: 4, vol: 0.04, a: 1.8, at: t, type: 'sawtooth', lp: 260, w: 0.5, bus: musBus });
      } },
  };
  function schedule() {
    const s = SCENES[sceneName]; if (!s || !ctx || muted) return;
    while (nextAt < ctx.currentTime + 0.5) { s.tick(beat, Math.max(0, nextAt - ctx.currentTime)); beat++; nextAt += s.step }
  }
  function scene(name) {
    unlock(); if (!ctx) { sceneName = name || null; return }
    if (timer) { clearInterval(timer); timer = null }
    sceneName = name && SCENES[name] ? name : null;
    if (!sceneName) { stopBed(); return }
    const s = SCENES[sceneName]; startBed(s.bed, s.cut, muted ? 0 : s.bedVol, s.grit);
    beat = 0; nextAt = ctx.currentTime + 0.4; timer = setInterval(schedule, 120);
  }

  // ---- volume, mute and the settings panel ----------------------------------------------------------------------------------------
  let panel = null, rows = null;
  function paint() {
    if (!btn) return;
    btn.textContent = muted || (vol.sfx === 0 && vol.music === 0) ? '\u{1F507}' : vol.sfx < 0.35 ? '\u{1F508}' : vol.sfx < 0.7 ? '\u{1F509}' : '\u{1F50A}';
    btn.title = 'Sound settings (M mutes)'; btn.setAttribute('aria-label', btn.title); btn.setAttribute('aria-expanded', panel && panel.style.display !== 'none' ? 'true' : 'false');
    if (rows) { rows.sfx.value = Math.round(vol.sfx * 100); rows.music.value = Math.round(vol.music * 100); rows.mute.textContent = muted ? 'Sound is OFF (tap to turn on)' : 'Mute all sound' }
  }
  function saveVolume() { try { localStorage.setItem(VKEY, JSON.stringify(vol)) } catch (e) { /* not remembered */ } }
  function setVolume(kind, v) {
    if (kind !== 'sfx' && kind !== 'music') return;
    vol[kind] = clamp01(v); saveVolume();
    if (ctx && sfxBus && musBus) { const t = ctx.currentTime; sfxBus.gain.setTargetAtTime(0.9 * vol.sfx, t, 0.02); musBus.gain.setTargetAtTime(0.55 * vol.music, t, 0.02) }
    if (muted && (vol.sfx > 0 || vol.music > 0) && kind) setMuted(false); else paint();
  }
  function setMuted(v) {
    muted = !!v; try { localStorage.setItem(KEY, muted ? '1' : '0') } catch (e) { /* not remembered */ }
    if (master) master.gain.setTargetAtTime(muted ? 0 : 0.8, ctx.currentTime, 0.03);
    paint();
  }
  function toggleMute() { unlock(); setMuted(!muted); return muted }

  function makeButton() {
    if (btn || !document.body) return;
    const css = 'position:fixed;z-index:30;font:600 13px system-ui,sans-serif;color:#dff7ee;';
    btn = document.createElement('button');
    btn.id = 'soundToggle'; btn.type = 'button'; btn.tabIndex = -1;
    btn.style.cssText = css + 'top:56px;right:14px;width:38px;height:38px;border-radius:10px;border:1px solid #29424b;background:#071217d9;font-size:18px;line-height:1;cursor:pointer;padding:0;backdrop-filter:blur(8px)';
    panel = document.createElement('div'); panel.id = 'soundPanel'; panel.style.display = 'none';
    panel.style.cssText = css + 'top:100px;right:14px;width:210px;padding:12px 14px;border-radius:12px;border:1px solid #29424b;background:#071217ee;backdrop-filter:blur(10px);display:none';
    rows = {};
    const row = (label, kind) => {
      const wrap = document.createElement('label'), name = document.createElement('span'), inp = document.createElement('input');
      wrap.style.cssText = 'display:block;margin:0 0 10px'; name.textContent = label; name.style.cssText = 'display:block;margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#8fb1ad';
      inp.type = 'range'; inp.min = 0; inp.max = 100; inp.step = 1; inp.tabIndex = -1; inp.style.cssText = 'width:100%;accent-color:#59e2c2;margin:0';
      inp.setAttribute('aria-label', label + ' volume');
      inp.addEventListener('input', () => { unlock(); setVolume(kind, inp.value / 100) });
      inp.addEventListener('change', () => { if (kind === 'sfx') play('cog'); inp.blur() });
      wrap.appendChild(name); wrap.appendChild(inp); panel.appendChild(wrap); rows[kind] = inp;
    };
    row('Effects', 'sfx'); row('Music', 'music');
    const mute = document.createElement('button'); mute.type = 'button'; mute.tabIndex = -1;
    mute.style.cssText = 'width:100%;padding:8px 10px;border-radius:8px;border:1px solid #29424b;background:#0d1d24;color:#dff7ee;font:600 12px system-ui,sans-serif;cursor:pointer';
    mute.addEventListener('click', e => { e.preventDefault(); toggleMute(); mute.blur() }); panel.appendChild(mute); rows.mute = mute;
    const hint = document.createElement('div'); hint.textContent = 'M mutes. [ and ] change the effects volume.'; hint.style.cssText = 'margin-top:8px;font-size:11px;color:#6f8f8b'; panel.appendChild(hint);
    const open = v => { panel.style.display = v ? 'block' : 'none'; paint() };
    btn.addEventListener('pointerdown', e => e.stopPropagation());
    btn.addEventListener('click', e => { e.preventDefault(); unlock(); open(panel.style.display === 'none'); btn.blur() });
    panel.addEventListener('pointerdown', e => e.stopPropagation());
    document.addEventListener('pointerdown', () => { if (panel.style.display !== 'none') open(false) });
    document.addEventListener('keydown', e => { if (e.code === 'Escape' && panel.style.display !== 'none') open(false) });
    document.body.appendChild(btn); document.body.appendChild(panel); paint();
  }

  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', e => {
    unlock(); if (e.code === 'KeyM' && !e.repeat) toggleMute();
    if (e.code === 'BracketLeft' || e.code === 'BracketRight') { setVolume('sfx', vol.sfx + (e.code === 'BracketRight' ? 0.1 : -0.1)); if (!e.repeat) play('cog') }
  });
  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend().catch(() => {}); else ctx.resume().catch(() => {}) });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', makeButton); else makeButton();

  window.MayhemAudio = { unlock, play, scene, toggleMute, setVolume, getVolume: () => ({ ...vol }), isMuted: () => muted, names: Object.keys(SFX), sampled: () => Object.keys(bank).filter(n => bank[n].length) };
})();
