/* Engarce · revelado por "volteo de baldosas".
   Cada sección [data-reveal] que aún no se ve queda cubierta por una rejilla de baldosas
   del color de su fondo; al entrar en pantalla se voltean siguiendo un patrón:
   diagonal, centro (de dentro hacia fuera), damero o filas (en zigzag, como quien coloca piso).
   Las secciones visibles al cargar no se cubren. Sin JS o con movimiento reducido no hay cubierta. */
(function (TL) {
  'use strict';

  const DURACION = 620;
  const MAX_RETRASO = 900;

  const patrones = {
    diagonal: (c, r) => c + r,
    centro: (c, r, cols, rows) => Math.max(Math.abs(c - (cols - 1) / 2), Math.abs(r - (rows - 1) / 2)),
    damero: (c, r) => ((c + r) % 2) * 6 + r * 0.6,
    filas: (c, r, cols) => r * cols * 0.25 + (r % 2 ? cols - 1 - c : c) * 0.25
  };

  function fondo(el) {
    let n = el;
    while (n && n !== document.documentElement) {
      const bg = getComputedStyle(n).backgroundColor;
      if (bg && bg !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(bg)) return bg;
      n = n.parentElement;
    }
    return getComputedStyle(document.body).backgroundColor || '#F4EEE3';
  }

  function cubrir(sec) {
    const w = sec.offsetWidth;
    const h = sec.offsetHeight;
    let lado = w < 600 ? 72 : 112;
    let cols = Math.ceil(w / lado);
    let rows = Math.ceil(h / lado) + 1;
    while (cols * rows > 190) {
      lado *= 1.15;
      cols = Math.ceil(w / lado);
      rows = Math.ceil(h / lado) + 1;
    }
    const tipo = patrones[sec.dataset.reveal] ? sec.dataset.reveal : 'diagonal';
    const fn = patrones[tipo];

    const capa = document.createElement('div');
    capa.className = 'baldosas';
    capa.setAttribute('aria-hidden', 'true');
    capa.style.setProperty('--cols', cols);
    capa.style.setProperty('--lado', lado.toFixed(1) + 'px');
    capa.style.setProperty('--bg', fondo(sec));

    const crudos = [];
    let max = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = fn(c, r, cols, rows);
        crudos.push(v);
        if (v > max) max = v;
      }
    }
    const frag = document.createDocumentFragment();
    crudos.forEach((v, i) => {
      const c = i % cols;
      const r = (i / cols) | 0;
      const b = document.createElement('span');
      b.className = 'baldosa' + (tipo === 'damero' && (c + r) % 2 ? ' baldosa--x' : '');
      b.style.setProperty('--d', Math.round((v / (max || 1)) * MAX_RETRASO) + 'ms');
      frag.appendChild(b);
    });
    capa.appendChild(frag);
    sec.appendChild(capa);
    return capa;
  }

  TL.initReveal = function () {
    if (TL.motion.reduce || !('IntersectionObserver' in window)) return;
    const secciones = TL.$$('[data-reveal]');
    const capas = new Map();

    const io = new IntersectionObserver((entradas) => {
      entradas.forEach((en) => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        const capa = capas.get(en.target);
        if (!capa) return;
        capa.classList.add('is-volteando');
        setTimeout(() => capa.remove(), MAX_RETRASO + DURACION + 80);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });

    secciones.forEach((sec) => {
      const r = sec.getBoundingClientRect();
      if (r.top < innerHeight * 0.92) return; // ya visible al cargar
      capas.set(sec, cubrir(sec));
      io.observe(sec);
    });

    // Si alguien salta con un ancla lejos (o imprime), no dejar nada cubierto.
    window.addEventListener('beforeprint', () => capas.forEach((c) => c.remove()));
  };
})(window.TL);
