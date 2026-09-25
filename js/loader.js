/* Engarce · pantalla de carga (1.5 s).
   La animación es CSS pura: si el JS falla, el loader se desvanece solo a los 1.5 s.
   Aquí solo se retira del DOM y se permite saltarla con un clic. */
(function (TL) {
  'use strict';

  TL.initLoader = function () {
    const el = document.querySelector('[data-loader]');
    if (!el) return;
    if (document.documentElement.classList.contains('sin-intro') || TL.motion.reduce) {
      el.remove();
      return;
    }
    const quitar = () => { if (el.isConnected) el.remove(); };
    const t = setTimeout(quitar, 2050);
    el.addEventListener('click', () => {
      clearTimeout(t);
      el.classList.add('is-fuera');
      setTimeout(quitar, 320);
    }, { once: true });
  };
})(window.TL);
