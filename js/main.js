/* Engarce · arranque. Cada módulo se inicia aislado: si uno falla, el resto sigue. */
(function (TL) {
  'use strict';

  function iniciarCabecera() {
    const cab = document.querySelector('[data-cabecera]');
    const btnMenu = document.querySelector('[data-menu]');
    const lista = document.querySelector('[data-nav-lista]');
    const btnSonido = document.querySelector('[data-sonido]');

    if (btnMenu && lista) {
      const cerrar = () => { lista.classList.remove('is-abierta'); btnMenu.setAttribute('aria-expanded', 'false'); };
      btnMenu.addEventListener('click', () => {
        const abierto = lista.classList.toggle('is-abierta');
        btnMenu.setAttribute('aria-expanded', String(abierto));
      });
      lista.addEventListener('click', (e) => { if (e.target.closest('a')) cerrar(); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrar(); });
    }

    if (btnSonido) {
      btnSonido.setAttribute('aria-pressed', String(TL.sonido.activo));
      btnSonido.addEventListener('click', () => {
        TL.sonido.set(!TL.sonido.activo);
        btnSonido.setAttribute('aria-pressed', String(TL.sonido.activo));
        if (TL.sonido.activo) TL.sonido.clink();
        TL.anunciar(TL.sonido.activo ? 'Sonido activado.' : 'Sonido desactivado.');
      });
    }

    if (cab) {
      let pendiente = false;
      const revisar = () => { pendiente = false; cab.classList.toggle('is-scrolled', window.scrollY > 8); };
      window.addEventListener('scroll', () => {
        if (!pendiente) { pendiente = true; requestAnimationFrame(revisar); }
      }, { passive: true });
      revisar();
    }
  }

  const modulos = [
    ['cabecera', iniciarCabecera],
    ['loader', TL.initLoader],
    ['caja', TL.caja && TL.caja.init],
    ['cursor', TL.initCursor],
    ['hero', TL.initHero],
    ['catalogo', TL.initCatalogo],
    ['taller', TL.initTaller],
    ['probador', TL.initProbador],
    ['ensamble', TL.initEnsamble],
    ['cuidados', TL.initCuidados],
    ['revelado', TL.initReveal]   // al final: mide las secciones ya pintadas
  ];

  modulos.forEach(([nombre, fn]) => {
    if (typeof fn !== 'function') return;
    try { fn(); } catch (e) { console.error(`[engarce] ${nombre}:`, e); }
  });
})(window.TL);
