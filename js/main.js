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

    // Sección activa: el enlace de la sección que cruza la mitad de la pantalla queda marcado.
    if (lista && 'IntersectionObserver' in window) {
      const enlaces = Array.from(lista.querySelectorAll('a[href^="#"]'));
      const porId = new Map(enlaces.map((a) => [a.getAttribute('href').slice(1), a]));
      const marcar = (id) => enlaces.forEach((a) => {
        if (a === porId.get(id)) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
      const io = new IntersectionObserver((entradas) => {
        entradas.forEach((x) => {
          if (x.isIntersecting) marcar(x.target.id);
          else if (porId.get(x.target.id) && porId.get(x.target.id).hasAttribute('aria-current')) marcar(null);
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      porId.forEach((a, id) => {
        const sec = document.getElementById(id);
        if (sec) io.observe(sec);
      });
    }
  }

  function iniciarBoletin() {
    const form = document.querySelector('[data-boletin]');
    if (!form) return;
    const campo = form.querySelector('input[type="email"]');
    const estado = form.querySelector('[data-boletin-estado]');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = campo.value.trim() !== '' && campo.checkValidity();
      form.classList.toggle('is-error', !ok);
      campo.setAttribute('aria-invalid', String(!ok));
      if (!ok) {
        estado.textContent = 'Revisa el correo: parece que le falta algo (por ejemplo, la @).';
        campo.focus();
        return;
      }
      estado.textContent = 'Gracias. Este prototipo aún no guarda correos: aquí se conectará el boletín.';
      form.reset();
    });
  }

  const modulos = [
    ['cabecera', iniciarCabecera],
    ['boletin', iniciarBoletin],
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
