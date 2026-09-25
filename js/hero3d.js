/* Engarce · collar 3D del hero en <canvas> 2D (sin librerías).
   - La cadena son eslabones alternados (de frente / de canto) ordenados por profundidad.
   - Las fichas son imágenes SVG proyectadas con una transformación afín; por detrás
     se ve el barro sin esmaltar. Tienen grosor, sombreado y un brillo especular.
   - Gira solo, voltea hacia el cursor y se puede arrastrar (táctil incluido).
   - Las fichas se balancean con la aceleración del giro. */
(function (TL) {
  'use strict';

  const N = 132;          // eslabones
  const R = 128;          // radio del collar (unidades de modelo)
  const D = 900;          // distancia de la cámara

  const norm = (v) => { const l = Math.hypot(v.x, v.y, v.z) || 1; return { x: v.x / l, y: v.y / l, z: v.z / l }; };
  const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
  const LUZ = norm({ x: -0.38, y: -0.6, z: 0.72 });
  const MEDIO = norm({ x: LUZ.x, y: LUZ.y, z: LUZ.z + 1 });

  const DIJES = [
    { t: -0.56, s: 25, design: 'rombo', shape: 'square' },
    { t: -0.29, s: 33, design: 'estrella', shape: 'round' },
    { t: 0, s: 54, design: 'cholula', shape: 'drop' },
    { t: 0.29, s: 33, design: 'estrella', shape: 'round' },
    { t: 0.56, s: 25, design: 'rombo', shape: 'square' }
  ];

  function curva(t) {
    const c = Math.cos(t), s = Math.sin(t);
    const f = (1 + c) / 2;                    // 1 al frente, 0 detrás del cuello
    const r = R * (0.8 + 0.2 * f);
    return { x: r * s, y: -60 + 124 * Math.pow(f, 2.3), z: r * c * 0.82 };
  }

  // Paleta de oro por profundidad (atrás más oscuro).
  const ORO = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    ORO.push(`rgb(${Math.round(112 + 118 * t)}, ${Math.round(80 + 104 * t)}, ${Math.round(34 + 70 * t)})`);
  }
  const oro = (t) => ORO[Math.round(TL.clamp(t, 0, 1) * 16)];

  TL.initHero = function () {
    const canvas = document.querySelector('[data-hero-canvas]');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const reduce = TL.motion.reduce;

    const cadena = [];
    for (let i = 0; i < N; i++) cadena.push(curva((i / N) * Math.PI * 2));

    let dibujable = true;
    const dijes = DIJES.map((d) => {
      const o = Object.assign({}, d, { A: curva(d.t), phi: 0, vphi: 0, psi: 0, vpsi: 0 });
      o.img = new Image();
      o.back = new Image();
      o.img.onload = o.back.onload = () => despertar(600);
      o.img.src = TL.talavera.uri(d.design, d.shape);
      o.back.src = TL.talavera.uriReverso(d.shape);
      try { o.path = new Path2D(TL.talavera.formas[d.shape]); } catch (e) { dibujable = false; }
      return o;
    });
    if (!dibujable) return;

    // ---- Estado de cámara e interacción
    let W = 0, H = 0, dpr = 1, esc = 1, cx = 0, cy = 0;
    const GIRO = reduce ? 0 : 0.3;
    let yawAuto = -0.35, yawCursor = 0, yawCursorT = 0;
    let pitch = 0.26, pitchT = 0.26;
    let yaw = yawAuto, yawPrev = yaw, omegaPrev = 0;
    let arrastrando = false, ultX = 0, ultT = 0, velArr = 0;
    let visible = true, raf = 0, ultimo = 0, despiertoHasta = 0;

    const rotar = (v) => {
      const c1 = Math.cos(yaw), s1 = Math.sin(yaw);
      const x = v.x * c1 + v.z * s1;
      const z = -v.x * s1 + v.z * c1;
      const c2 = Math.cos(pitch), s2 = Math.sin(pitch);
      return { x, y: v.y * c2 + z * s2, z: -v.y * s2 + z * c2 };
    };
    const proyectar = (v) => {
      const k = D / (D - v.z);
      return { x: cx + v.x * k * esc, y: cy + v.y * k * esc, z: v.z, k };
    };

    function medir() {
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      if (!W || !H) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      esc = W / 322;
      cx = W / 2;
      cy = H * 0.37;
      despertar(300);
    }

    function eslabon(P, i) {
      const a = P[i], b = P[(i + 1) % N];
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      const k = (a.k + b.k) / 2;
      const prof = ((a.z + b.z) / 2 + R) / (2 * R);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.translate((a.x + b.x) / 2, (a.y + b.y) / 2);
      ctx.rotate(Math.atan2(dy, dx));
      const lw = 1.35 * k * esc;
      ctx.beginPath();
      if (i % 2 === 0) {
        ctx.ellipse(0, 0, Math.max(len * 0.7, 0.5), 2.5 * k * esc, 0, 0, Math.PI * 2);
        ctx.lineWidth = lw;
        ctx.strokeStyle = oro(prof);
      } else {
        ctx.moveTo(-len * 0.64, 0);
        ctx.lineTo(len * 0.64, 0);
        ctx.lineWidth = lw * 1.6;
        ctx.strokeStyle = oro(prof * 0.78);
      }
      ctx.stroke();
    }

    function geometria(d) {
      const t = d.t, A = d.A;
      const u0 = { x: Math.cos(t), z: -Math.sin(t) };   // tangente horizontal
      const n0 = { x: Math.sin(t), z: Math.cos(t) };    // normal hacia fuera
      const cps = Math.cos(d.psi), sps = Math.sin(d.psi);
      const cph = Math.cos(d.phi), sph = Math.sin(d.phi);
      // psi: vaivén lateral en el plano de la ficha; phi: vaivén hacia fuera
      const hx = u0.x * sps, hy = cps, hz = u0.z * sps;
      const r = { x: u0.x * cps, y: -sps, z: u0.z * cps };
      const h = { x: hx * cph + n0.x * sph, y: hy * cph, z: hz * cph + n0.z * sph };
      const n = { x: n0.x * cph - hx * sph, y: -hy * sph, z: n0.z * cph - hz * sph };
      const dist = 6 + d.s * 0.48;
      const C = rotar({ x: A.x + h.x * dist, y: A.y + h.y * dist, z: A.z + h.z * dist });
      const rv = rotar(r), hv = rotar(h), nv = rotar(n);
      const half = d.s / 2;
      const Pc = proyectar(C);
      const Pu = proyectar({ x: C.x + rv.x * half, y: C.y + rv.y * half, z: C.z + rv.z * half });
      const Pv = proyectar({ x: C.x + hv.x * half, y: C.y + hv.y * half, z: C.z + hv.z * half });
      const g = 2.4;
      const Pn = proyectar({ x: C.x - nv.x * g, y: C.y - nv.y * g, z: C.z - nv.z * g });
      const Pa = proyectar(rotar({ x: A.x + h.x * 3.2, y: A.y + h.y * 3.2, z: A.z + h.z * 3.2 }));
      return {
        d, Pc, Pa, nv, hv, z: C.z,
        eu: { x: Pu.x - Pc.x, y: Pu.y - Pc.y },
        ev: { x: Pv.x - Pc.x, y: Pv.y - Pc.y },
        en: { x: Pn.x - Pc.x, y: Pn.y - Pc.y }
      };
    }

    function base(G, ox, oy) {
      ctx.setTransform(
        dpr * G.eu.x / 50, dpr * G.eu.y / 50,
        dpr * G.ev.x / 50, dpr * G.ev.y / 50,
        dpr * (G.Pc.x + ox), dpr * (G.Pc.y + oy)
      );
      ctx.translate(-50, -50);
    }

    function dije(G) {
      const d = G.d;
      // Aro que une la ficha con la cadena
      const k = G.Pc.k;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.translate(G.Pa.x, G.Pa.y);
      ctx.rotate(Math.atan2(G.ev.y, G.ev.x) - Math.PI / 2);
      ctx.beginPath();
      ctx.ellipse(0, 0, 2.6 * k * esc, 3.8 * k * esc, 0, 0, Math.PI * 2);
      ctx.lineWidth = 1.5 * k * esc;
      ctx.strokeStyle = oro(0.95);
      ctx.stroke();

      const det = G.eu.x * G.ev.y - G.eu.y * G.ev.x;
      if (Math.abs(det) < 0.01) return;
      const frente = det > 0;
      const img = frente ? d.img : d.back;

      // Canto (grosor de la cerámica): la cara lejana primero
      if (frente) base(G, G.en.x, G.en.y); else base(G, 0, 0);
      ctx.fillStyle = frente ? '#D8CAB1' : '#E2D6C2';
      ctx.fill(d.path);

      // Cara visible
      if (frente) base(G, 0, 0); else base(G, G.en.x, G.en.y);
      if (img.complete && img.naturalWidth) ctx.drawImage(img, 0, 0, 100, 104);
      else { ctx.fillStyle = frente ? '#FBF7EE' : '#CDB08A'; ctx.fill(d.path); }

      // Luz: difusa + brillo del esmalte (solo por delante)
      const nvis = frente ? G.nv : { x: -G.nv.x, y: -G.nv.y, z: -G.nv.z };
      const dif = Math.max(0, dot(nvis, LUZ));
      ctx.fillStyle = `rgba(11, 30, 61, ${((1 - dif) * 0.3).toFixed(3)})`;
      ctx.fill(d.path);
      if (frente) {
        const spec = Math.pow(Math.max(0, dot(nvis, MEDIO)), 26);
        if (spec > 0.02) {
          ctx.save();
          ctx.clip(d.path);
          const gr = ctx.createRadialGradient(34, 30, 0, 34, 30, 56);
          gr.addColorStop(0, `rgba(255, 255, 255, ${(spec * 0.85).toFixed(3)})`);
          gr.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = gr;
          ctx.fillRect(0, 0, 100, 104);
          ctx.restore();
        }
      }
    }

    function dibujar() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Sombra suave en el "piso"
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.save();
      ctx.translate(cx, H * 0.93);
      ctx.scale(1, 0.13);
      const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 0.3);
      sg.addColorStop(0, 'rgba(16, 47, 90, .2)');
      sg.addColorStop(1, 'rgba(16, 47, 90, 0)');
      ctx.fillStyle = sg;
      ctx.fillRect(-W * 0.3, -W * 0.3, W * 0.6, W * 0.6);
      ctx.restore();

      const P = cadena.map((p) => proyectar(rotar(p)));
      const lista = [];
      for (let i = 0; i < N; i++) lista.push({ z: (P[i].z + P[(i + 1) % N].z) / 2, i });
      dijes.forEach((d) => { const G = geometria(d); lista.push({ z: G.z + 0.5, G }); });
      lista.sort((a, b) => a.z - b.z);
      ctx.lineCap = 'round';
      for (const it of lista) {
        if (it.G) dije(it.G); else eslabon(P, it.i);
      }
    }

    function paso(dt) {
      if (!arrastrando) {
        // Gira despacio cuando las fichas miran al frente y más rápido cuando muestran el reverso.
        const frente = (1 + Math.cos(yaw)) / 2;
        yawAuto += (GIRO * (0.45 + 1.6 * (1 - frente)) + velArr) * dt;
        velArr *= Math.pow(0.12, dt);
      }
      const suave = 1 - Math.pow(0.03, dt);
      yawCursor += (yawCursorT - yawCursor) * suave;
      pitch += (pitchT - pitch) * suave;
      yaw = yawAuto + yawCursor;

      const omega = (yaw - yawPrev) / dt;
      const alpha = TL.clamp((omega - omegaPrev) / dt, -40, 40);
      yawPrev = yaw;
      omegaPrev = omega;
      const eq = TL.clamp(omega * omega * 0.05, 0, 0.6);
      let mov = 0;
      dijes.forEach((d) => {
        d.vphi += ((eq - d.phi) * 38 - d.vphi * 5.5) * dt;
        d.phi += d.vphi * dt;
        d.vpsi += (-d.psi * 38 - d.vpsi * 4.5 - alpha * 0.02) * dt;
        d.psi = TL.clamp(d.psi + d.vpsi * dt, -0.7, 0.7);
        mov += Math.abs(d.vphi) + Math.abs(d.vpsi);
      });
      return mov + Math.abs(omega);
    }

    function cuadro(ahora) {
      raf = 0;
      const dt = Math.min(0.05, Math.max(0.001, (ahora - (ultimo || ahora)) / 1000)) || 0.016;
      ultimo = ahora;
      const mov = paso(dt);
      dibujar();
      const seguir = visible && !document.hidden && (!reduce || ahora < despiertoHasta || mov > 0.01);
      if (seguir) raf = requestAnimationFrame(cuadro);
      else ultimo = 0;
    }

    function despertar(ms) {
      despiertoHasta = Math.max(despiertoHasta, performance.now() + (ms || 0));
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(cuadro);
    }

    // ---- Eventos
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || arrastrando) return;
      yawCursorT = ((e.clientX / innerWidth) - 0.5) * 1.6;
      pitchT = 0.26 + ((e.clientY / innerHeight) - 0.5) * 0.4;
      if (reduce) despertar(900);
    }, { passive: true });

    canvas.addEventListener('pointerdown', (e) => {
      arrastrando = true;
      ultX = e.clientX;
      ultT = e.timeStamp;
      velArr = 0;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* sin captura */ }
      despertar(1500);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!arrastrando) return;
      const dx = e.clientX - ultX;
      const dtEv = Math.max(8, e.timeStamp - ultT) / 1000;
      yawAuto += dx * 0.012;
      velArr = TL.clamp((dx * 0.012) / dtEv, -7, 7);
      ultX = e.clientX;
      ultT = e.timeStamp;
      despertar(1500);
    });
    const soltar = () => { arrastrando = false; despertar(2500); };
    canvas.addEventListener('pointerup', soltar);
    canvas.addEventListener('pointercancel', soltar);

    if ('ResizeObserver' in window) new ResizeObserver(medir).observe(canvas);
    else window.addEventListener('resize', medir);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((en) => {
        visible = en[0].isIntersecting;
        if (visible) despertar(400);
      }).observe(canvas);
    }
    document.addEventListener('visibilitychange', () => { if (!document.hidden) despertar(400); });

    medir();
    despertar(1200);
  };
})(window.TL);
