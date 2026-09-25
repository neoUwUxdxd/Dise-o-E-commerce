/* Engarce · acordeón de cuidados y compra de repuestos de fichas. */
(function (TL) {
  'use strict';

  /* Ficha partida en dos (para mostrar el caso real) */
  function rota(design, shape) {
    const zig = '52 0, 46 20, 58 38, 44 60, 55 80, 48 104';
    return `<svg viewBox="-6 -4 112 112" aria-hidden="true">` +
      `<defs><clipPath id="rota-izq"><polygon points="0 0, ${zig}, 0 104"/></clipPath>` +
      `<clipPath id="rota-der"><polygon points="${zig}, 100 104, 100 0"/></clipPath></defs>` +
      `<g clip-path="url(#rota-izq)" transform="translate(-3 2) rotate(-5 30 60)">${TL.talavera.svg(design, shape, 'width="100" height="104"')}</g>` +
      `<g clip-path="url(#rota-der)" transform="translate(4 5) rotate(6 70 60)">${TL.talavera.svg(design, shape, 'width="100" height="104"')}</g>` +
      `</svg>`;
  }

  TL.initCuidados = function () {
    // ---- Acordeón
    const acordeon = document.querySelector('[data-acordeon]');
    if (acordeon) {
      acordeon.addEventListener('click', (e) => {
        const btn = e.target.closest('.acordeon__boton');
        if (!btn) return;
        const item = btn.closest('.acordeon__item');
        const abierto = !item.classList.contains('is-abierto');
        item.classList.toggle('is-abierto', abierto);
        btn.setAttribute('aria-expanded', String(abierto));
        const panel = document.getElementById(btn.getAttribute('aria-controls'));
        if (panel) panel.inert = !abierto;
      });
    }

    // ---- Repuestos
    const rep = document.querySelector('[data-repuesto]');
    if (!rep) return;
    const selPatron = rep.querySelector('[data-repuesto-patron]');
    const selForma = rep.querySelector('[data-repuesto-forma]');
    const vistaRota = rep.querySelector('[data-repuesto-rota]');
    const vistaNueva = rep.querySelector('[data-repuesto-nueva]');
    const precio = rep.querySelector('[data-repuesto-precio]');

    selPatron.innerHTML = Object.keys(TL.families).map((fid) =>
      `<optgroup label="${TL.families[fid].label}">` +
      TL.designs.filter((d) => d.family === fid).map((d) => `<option value="${d.id}">${d.name}</option>`).join('') +
      `</optgroup>`
    ).join('');
    selForma.innerHTML = Object.keys(TL.shapes).map((s) => `<option value="${s}">${TL.shapes[s].label}</option>`).join('');
    selPatron.value = 'poblano';
    selForma.value = 'square';

    function pintar(animar) {
      const d = selPatron.value, s = selForma.value;
      vistaRota.innerHTML = rota(d, s);
      vistaNueva.innerHTML = TL.talavera.svg(d, s);
      precio.textContent = TL.precio(TL.shapes[s].repuesto);
      if (animar && !TL.motion.reduce) {
        vistaNueva.classList.remove('is-cambio');
        void vistaNueva.offsetWidth;
        vistaNueva.classList.add('is-cambio');
      }
    }
    selPatron.addEventListener('change', () => pintar(true));
    selForma.addEventListener('change', () => pintar(true));
    pintar(false);

    rep.querySelector('[data-repuesto-anadir]').addEventListener('click', () => {
      const d = TL.design(selPatron.value);
      const s = selForma.value;
      TL.caja.agregar({
        id: 'repuesto',
        key: `repuesto-${d.id}-${s}`,
        nombre: 'Repuesto de ficha',
        detalle: `${d.name} · ${TL.shapes[s].label} · incluye aro de cambio`,
        precio: TL.shapes[s].repuesto,
        design: d.id,
        shape: s,
        metal: 'plata'
      }, vistaNueva);
    });
  };
})(window.TL);
