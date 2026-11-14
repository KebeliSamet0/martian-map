// audio.js — skafandr içi ses (tamamen prosedürel WebAudio; ses dosyası ve lisans gerektirmez).
// Mars atmosferi çok ince olduğundan dış ses neredeyse duyulmaz; astronotun duyduğu kendi nefesi, skafandrın
// fan uğultusu, adımın gövdeden iletilen tok sesi ve telsiz tonlarıdır. Bu modül onları sentezler (görsel/işitsel sunum, veri değil).
//
// Kullanım:
//   const audio = initAudio();              // ilk kullanıcı tıklaması/tuşunda kendiliğinden başlar (tarayıcı kuralı)
//   audio.update(dt, { speed, effort, moving, surface, externalSteps })   // her kare; speed m/s (gösterim hızı), effort 0..1
//   audio.alert('sand' | 'limit' | 'stop' | 'scan' | 'arrive')
//   audio.setEnabled(bool), audio.enabled

export function initAudio({ volume = 0.55 } = {}) {
  let ctx = null, master = null, enabled = true, started = false;
  let breath = null, fan = null, wind = null, noiseBuf = null;
  let breathPhase = 0, stepAcc = 0, lastStepAt = 0, effortS = 0.15;

  function noiseBuffer() {
    const n = ctx.sampleRate * 2, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }   // kahverengi gürültü
    return b;
  }
  function loopNoise(filterType, freq, q, gain) {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = filterType; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); g.gain.value = gain;
    src.connect(f).connect(g).connect(master); src.start();
    return { src, f, g };
  }

  function start() {
    if (started) return; started = true;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { enabled = false; return; }
    master = ctx.createGain(); master.gain.value = enabled ? volume : 0; master.connect(ctx.destination);
    noiseBuf = noiseBuffer();
    fan = loopNoise('bandpass', 180, 0.7, 0.05);      // yaşam destek fanı: sabit alçak uğultu
    const hum = ctx.createOscillator(); hum.type = 'sine'; hum.frequency.value = 58;
    const hg = ctx.createGain(); hg.gain.value = 0.012; hum.connect(hg).connect(master); hum.start();
    wind = loopNoise('lowpass', 240, 0.4, 0.016);     // ince atmosferde çok zayıf rüzgâr (kaska sürtünme)
    breath = loopNoise('bandpass', 900, 0.9, 0.0);    // nefes: kazancı ve süzgeci aşağıda modüle edilir
  }
  for (const ev of ['pointerdown', 'keydown']) addEventListener(ev, start, { once: true, passive: true });

  /** Adım: skafandr gövdesinden iletilen tok vuruş + zemine göre çıtırtı. surface = 'sand'|'soil'|'bedrock'|'rock' ya da karışım {sand,soil,rock} (walkfeel, katman olasılıkları). */
  function step(surface = 'soil', strength = 1) {
    if (!ctx || !enabled) return;
    const mix = typeof surface === 'object' ? surface : { sand: surface === 'sand' ? 1 : 0, soil: surface === 'soil' ? 1 : 0, rock: surface === 'bedrock' || surface === 'rock' ? 1 : 0 };
    const tot = (mix.sand + mix.soil + mix.rock) || 1, ws = mix.sand / tot, wsoil = mix.soil / tot, wr = mix.rock / tot;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), og = ctx.createGain();
    // Kum: yumuşak, alçak, yavaş atak. Kaya: sert, daha yüksek ve kısa vuruş.
    const f0 = 82 * ws + 95 * wsoil + 130 * wr, f1 = 42 * ws + 48 * wsoil + 70 * wr, peak = (0.07 * ws + 0.11 * wsoil + 0.14 * wr) * strength, atk = 0.016 * ws + 0.008 * wsoil + 0.004 * wr;
    o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + 0.09);
    og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(Math.max(0.001, peak), t + atk); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(og).connect(master); o.start(t); o.stop(t + 0.18);
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.playbackRate.value = 1.6 + Math.random() * 0.8;
    const f = ctx.createBiquadFilter(), g = ctx.createGain();
    const fq = 520 * ws + 1300 * wsoil + 2400 * wr, q = 0.5 * ws + 0.9 * wsoil + 1.4 * wr, gn = 0.05 * ws + 0.055 * wsoil + 0.06 * wr, dur = 0.22 * ws + 0.12 * wsoil + 0.07 * wr;   // [frekans, Q, kazanç, süre]
    f.type = 'bandpass'; f.frequency.value = fq * (0.9 + Math.random() * 0.2); f.Q.value = q;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gn * strength, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(master); src.start(t, Math.random()); src.stop(t + dur + 0.05);
  }

  /** Tökezleme: kısa kayma çıtırtısı + ağır bir vuruş + tek soluk. */
  function stumble() {
    if (!ctx || !enabled) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.playbackRate.value = 2.4;
    const f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'bandpass'; f.frequency.setValueAtTime(3200, t); f.frequency.exponentialRampToValueAtTime(900, t + 0.28); f.Q.value = 0.8;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    src.connect(f).connect(g).connect(master); src.start(t, Math.random()); src.stop(t + 0.35);
    const o = ctx.createOscillator(), og = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(70, t + 0.12); o.frequency.exponentialRampToValueAtTime(34, t + 0.3);
    og.gain.setValueAtTime(0.0001, t + 0.12); og.gain.exponentialRampToValueAtTime(0.16, t + 0.14); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
    o.connect(og).connect(master); o.start(t + 0.12); o.stop(t + 0.38);
    if (breath) { breath.g.gain.cancelScheduledValues(t); breath.g.gain.setTargetAtTime(0.11, t + 0.2, 0.02); breathPhase = 0.02; }   // sürpriz soluğu
  }

  /** Telsiz/uyarı tonları. */
  function alert(kind = 'stop') {
    if (!ctx || !enabled) return;
    const t = ctx.currentTime;
    const seq = { sand: [[660, 0.0, 0.12], [660, 0.18, 0.12], [440, 0.36, 0.22]], limit: [[880, 0, 0.1], [880, 0.14, 0.1], [880, 0.28, 0.1]],
      stop: [[1200, 0, 0.05]], scan: [[500, 0, 0.5, 1500]], arrive: [[523, 0, 0.12], [659, 0.13, 0.12], [784, 0.26, 0.25]] }[kind] || [[1000, 0, 0.06]];
    for (const [f0, at, dur, f1] of seq) {
      const o = ctx.createOscillator(), g = ctx.createGain(), bp = ctx.createBiquadFilter();
      o.type = kind === 'scan' ? 'sine' : 'square'; o.frequency.setValueAtTime(f0, t + at); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + at + dur);
      bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.6;   // telsiz bandı
      g.gain.setValueAtTime(0.0001, t + at); g.gain.exponentialRampToValueAtTime(kind === 'scan' ? 0.05 : 0.035, t + at + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + at + dur);
      o.connect(bp).connect(g).connect(master); o.start(t + at); o.stop(t + at + dur + 0.03);
    }
  }

  function update(dt, { speed = 0, effort = 0.15, moving = false, surface = 'soil', externalSteps = false } = {}) {
    if (!ctx || !enabled || dt <= 0) return;
    effortS += (Math.min(1, Math.max(0, effort)) - effortS) * (1 - Math.exp(-dt * 0.8));   // nefes eforu gecikmeyle izler
    // Nefes: dinlenmede ~14/dk, yüksek eforda ~34/dk; nefes alma daha parlak, verme daha boğuk
    const rate = (13 + 27 * effortS) / 60;   // dinlenmede ~13/dk, yüksek eforda ~40/dk
    breathPhase = (breathPhase + dt * rate) % 1;
    const inhale = breathPhase < 0.42, x = inhale ? breathPhase / 0.42 : (breathPhase - 0.42) / 0.58;
    const env = Math.sin(Math.PI * x) ** (inhale ? 1.2 : 1.6);
    const t = ctx.currentTime;
    breath.g.gain.setTargetAtTime((inhale ? 0.045 : 0.06) * env * (0.55 + 0.75 * effortS), t, 0.03);
    breath.f.frequency.setTargetAtTime(inhale ? 1500 + 500 * effortS : 650 + 250 * effortS, t, 0.05);
    wind.g.gain.setTargetAtTime(0.012 + 0.012 * Math.sin(t * 0.21) ** 2, t, 0.5);
    // Adım: ~0,7 m'de bir, ama hızlandırılmış gösterimde makineli tüfek olmasın diye en çok ~2,1 adım/sn
    if (externalSteps) stepAcc = 0;   // adımlar walkfeel'den (zemin katmanı + mesafe) gelir
    else if (moving && speed > 0.05) {
      stepAcc += speed * dt;
      if (stepAcc >= 0.7 && t - lastStepAt > 0.47) { stepAcc = 0; lastStepAt = t; step(surface, 0.8 + 0.4 * effortS); }
    } else stepAcc = 0.5;
  }

  return {
    update, step, stumble, alert,
    get enabled() { return enabled; },
    setEnabled(on) { enabled = !!on; if (master) master.gain.setTargetAtTime(enabled ? volume : 0, ctx.currentTime, 0.05); },
    get started() { return started && !!ctx; },
  };
}
