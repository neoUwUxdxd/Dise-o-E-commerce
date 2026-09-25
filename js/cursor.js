/* Engarce · cursor propio (solo ratón o trackpad).
   Un punto azul Talavera con estela de esquirlas de esmalte que se disipan.
   Sobre botones y piezas se "hunde" como una tecla. */
(function (TL) {
  'use strict';

  const PRESIONABLE = 'a, button, [role="button"], label, select, summary, input[type="radio"], .producto__escena, .lienzo__objetivo';
  const COLORES = ['#1A4B8E', '#2A66C0', '#7C9BCB', '#1A4B8E', '#B4532A'];

  TL.initCursor = function () {
    if (!TL.punteroFino) return;
    const cursor = document.querySelector('[data-cursor]');
    const lienzo = document.querySelector('[data-estela]');
    if (!cursor || !lienzo) return;
    const ctx = lienzo.getContext('2d');
    document.documentElement.classList.add('cursor-propio');

    let x = -100, y = -100, px = x, py = y;
    let raf = 0;
    let dpr = 1;
    const parts = [];
    const conEstela = !TL.motion.reduce;

    function medir() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      lienzo.width = Math.round(innerWidth * dpr);
      lienzo.height = Math.round(innerHeight * dpr);
    }
    medir();
    window.addEventListener('resize', medir, { passive: true });

    function emitir(dist) {
      const n = Math.min(4, Math.floor(dist / 7));
      for (let i = 0; i < n; i++) {
        if (parts.length > 140) parts.shift();
        const t = (i + 1) / (n + 1);
        parts.push({
          x: TL.lerp(px, x, t) + (Math.random() - 0.5) * 4,
          y: TL.lerp(py, y, t) + (Math.random() - 0.5) * 4,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.2) * 0.5,
          r: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.12,
          s: 2 + Math.random() * 3,
          c: COLORES[(Math.random() * COLORES.length) | 0],
          vida: 1
        });
      }
    }

    function cuadro() {
      raf = 0;
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (!conEstela) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, lienzo.width, lienzo.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.vida -= 0.028;
        if (p.vida <= 0) { parts.splice(i, 1); continue; }
        p.vy += 0.035;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        const s = p.s * (0.4 + 0.6 * p.vida);
        ctx.save();
        ctx.globalAlpha = p.vida * 0.75;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.fillRect(-s / 2, -s / 2, s, s);
        ctx.restore();
      }
      if (parts.length) pedir();
    }
    const pedir = () => { if (!raf) raf = requestAnimationFrame(cuadro); };

    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      px = x; py = y;
      x = e.clientX; y = e.clientY;
      cursor.classList.remove('is-oculto');
      if (conEstela && px > -50) emitir(Math.hypot(x - px, y - py));
      pedir();
    }, { passive: true });

    document.addEventListener('pointerover', (e) => {
      const sobre = e.target.closest && e.target.closest(PRESIONABLE);
      cursor.classList.toggle('is-presion', !!sobre);
    });
    document.addEventListener('pointerdown', () => cursor.classList.add('is-hundido'));
    document.addEventListener('pointerup', () => cursor.classList.remove('is-hundido'));
    document.documentElement.addEventListener('pointerleave', () => cursor.classList.add('is-oculto'));
    window.addEventListener('blur', () => cursor.classList.add('is-oculto'));
  };
})(window.TL);
