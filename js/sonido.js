/* Engarce · sonidos sintetizados con Web Audio (sin archivos).
   Solo suenan después de un gesto del usuario y se pueden apagar desde la cabecera. */
(function (TL) {
  'use strict';

  let ctx = null;
  let activo = TL.store.get('sonido', true);

  function contexto() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function ruido(c, dur) {
    const buf = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * dur)), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const n = c.createBufferSource();
    n.buffer = buf;
    return n;
  }

  /* "Clic" cerámico: parciales agudos que decaen rápido + un transitorio. */
  function clink() {
    if (!activo) return;
    const c = contexto();
    if (!c) return;
    const t = c.currentTime;
    const out = c.createGain();
    out.gain.value = 0.16;
    out.connect(c.destination);

    [2380, 3570, 5240].forEach((f, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f * 0.985, t + 0.25);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(i ? 0.3 / (i + 1) : 0.6, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16 + 0.12 / (i + 1));
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + 0.4);
    });

    const n = ruido(c, 0.02);
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 3200;
    const ng = c.createGain();
    ng.gain.value = 0.3;
    n.connect(hp).connect(ng).connect(out);
    n.start(t);
  }

  /* Golpe de madera: tapa de la caja que se cierra. */
  function knock() {
    if (!activo) return;
    const c = contexto();
    if (!c) return;
    const t = c.currentTime;
    const out = c.createGain();
    out.gain.value = 0.35;
    out.connect(c.destination);

    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(190, t);
    o.frequency.exponentialRampToValueAtTime(95, t + 0.12);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.9, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.2);

    const n = ruido(c, 0.05);
    const lp = c.createBiquadFilter();
    lp.type = 'bandpass';
    lp.frequency.value = 900;
    lp.Q.value = 1.2;
    const ng = c.createGain();
    ng.gain.value = 0.5;
    n.connect(lp).connect(ng).connect(out);
    n.start(t);
  }

  TL.sonido = {
    clink,
    knock,
    get activo() { return activo; },
    set(v) {
      activo = !!v;
      TL.store.set('sonido', activo);
      if (activo) contexto();
    }
  };
})(window.TL);
