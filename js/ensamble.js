/* Engarce · "Ensamblo, luego existo": infografía animada en bucle (4 escenas).
   Si se define data-src en el <video>, se usa el video real en lugar de la animación. */
(function (TL) {
  'use strict';

  const DUR = 3400;

  TL.initEnsamble = function () {
    const root = document.querySelector('[data-ensamble]');
    if (!root) return;

    const video = root.querySelector('video[data-src]');
    if (video && video.dataset.src) {
      video.src = video.dataset.src;
      video.hidden = false;
      root.querySelector('.video__svg').remove();
    }

    TL.talavera.llenar(root);
    const escenas = TL.$$('.escena', root);
    const pasos = TL.$$('[data-paso]', root);
    const btnPausa = root.querySelector('[data-pausa]');
    let i = 0;
    let timer = 0;
    let pausado = TL.motion.reduce;
    let visible = false;

    root.style.setProperty('--dur', DUR + 'ms');

    function mostrar(n) {
      i = n;
      escenas.forEach((e, k) => e.classList.toggle('is-on', k === n));
      pasos.forEach((p, k) => {
        p.classList.toggle('is-activo', k === n);
        if (k === n) p.setAttribute('aria-current', 'step');
        else p.removeAttribute('aria-current');
      });
    }

    function programar() {
      clearTimeout(timer);
      const detenido = pausado || !visible;
      root.classList.toggle('is-pausado', detenido);
      if (video && !video.hidden) {
        if (detenido) video.pause();
        else video.play().catch(() => {});
      }
      if (detenido) return;
      timer = setTimeout(() => {
        mostrar((i + 1) % escenas.length);
        programar();
      }, DUR);
    }

    pasos.forEach((p) => p.addEventListener('click', () => {
      // Reinicia la escena aunque sea la misma
      escenas[+p.dataset.paso].classList.remove('is-on');
      void root.offsetWidth;
      mostrar(+p.dataset.paso);
      programar();
    }));

    btnPausa.addEventListener('click', () => {
      pausado = !pausado;
      btnPausa.setAttribute('aria-pressed', String(pausado));
      btnPausa.querySelector('.sr-only').textContent = pausado ? 'Reanudar la animación' : 'Pausar la animación';
      programar();
    });
    if (pausado) {
      btnPausa.setAttribute('aria-pressed', 'true');
      btnPausa.querySelector('.sr-only').textContent = 'Reanudar la animación';
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((en) => {
        visible = en[0].isIntersecting;
        programar();
      }, { threshold: 0.25 }).observe(root);
    } else {
      visible = true;
    }

    mostrar(0);
    programar();
  };
})(window.TL);
