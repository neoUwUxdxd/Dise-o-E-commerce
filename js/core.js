/* Engarce · núcleo: espacio de nombres, utilidades, almacenamiento y hojas (dialog). */
(function () {
  'use strict';

  const TL = (window.TL = window.TL || {});
  const mq = (q) => window.matchMedia(q);

  const reduce = mq('(prefers-reduced-motion: reduce)');
  TL.motion = { reduce: reduce.matches };
  if (reduce.addEventListener) reduce.addEventListener('change', (e) => { TL.motion.reduce = e.matches; });

  // Ratón o trackpad: activa cursor propio, hover y arrastre.
  TL.punteroFino = mq('(hover: hover) and (pointer: fine)').matches;

  TL.$ = (s, r = document) => r.querySelector(s);
  TL.$$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  TL.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  TL.lerp = (a, b, t) => a + (b - a) * t;
  TL.wait = (ms) => new Promise((r) => setTimeout(r, ms));
  TL.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Easing de resorte para Web Animations (con respaldo).
  const RESORTE = 'linear(0, .009, .035 2.1%, .141 4.4%, .723 12.9%, .938 16.7%, 1.017, 1.077 21.3%, 1.121 24.1%, 1.149 27.4%, 1.154 30.3%, 1.144 33.7%, 1.106 38.9%, 1.001 51.5%, .974 56.5%, .964 61.9%, .97 67.8%, 1.002 84.3%, 1)';
  TL.resorte = window.CSS && CSS.supports && CSS.supports('transition-timing-function', 'linear(0, 1)')
    ? RESORTE
    : 'cubic-bezier(.34, 1.56, .64, 1)';

  // localStorage puede no existir (modo privado, marcos aislados): todo va en try/catch.
  TL.store = {
    get(k, d) {
      try {
        const v = localStorage.getItem('engarce:' + k);
        return v === null ? d : JSON.parse(v);
      } catch (e) { return d; }
    },
    set(k, v) {
      try { localStorage.setItem('engarce:' + k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ }
    }
  };

  const fmt = new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', minimumFractionDigits: 0, maximumFractionDigits: 0
  });
  TL.precio = (n) => fmt.format(n);

  TL.anunciar = (msg) => {
    const el = document.getElementById('anuncios');
    if (!el) return;
    el.textContent = '';
    setTimeout(() => { el.textContent = msg; }, 40);
  };

  // Hojas: <dialog> con entrada y salida animadas.
  TL.hoja = {
    abrir(d) {
      if (!d || d.open) return;
      if (typeof d.showModal === 'function') d.showModal();
      else d.setAttribute('open', '');
      requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add('is-visible')));
    },
    cerrar(d) {
      if (!d || !d.open) return;
      d.classList.remove('is-visible');
      setTimeout(() => {
        if (typeof d.close === 'function') d.close();
        else d.removeAttribute('open');
      }, TL.motion.reduce ? 0 : 340);
    }
  };

  document.addEventListener('click', (e) => {
    const cerrar = e.target.closest('[data-cerrar]');
    if (cerrar) { TL.hoja.cerrar(cerrar.closest('dialog')); return; }
    // Clic en el fondo (fuera del cuerpo de la hoja)
    if (e.target.tagName === 'DIALOG' && e.target.classList.contains('hoja')) TL.hoja.cerrar(e.target);
  });
  document.addEventListener('cancel', (e) => {
    if (e.target.classList && e.target.classList.contains('hoja')) {
      e.preventDefault();
      TL.hoja.cerrar(e.target);
    }
  }, true);
})();
