/* Engarce · generador de fichas de talavera en SVG.
   Cada patrón se dibuja en un lienzo de 100 × 100 con simetrías de rotación;
   la forma (cuadrada, redonda, hexagonal, lágrima) recorta el patrón.
   Sin imágenes: todo el catálogo pesa unos pocos KB. */
(function (TL) {
  'use strict';

  const C = {
    azul: '#1A4B8E', osc: '#123A70', lav: '#7C9BCB', ter: '#B4532A',
    ocre: '#D39A2E', verde: '#4E7A58', esm: '#FBF7EE', borde: '#DCCDB4'
  };

  // Repite un fragmento n veces alrededor del centro.
  const rot = (n, s, off = 0) => {
    let o = '';
    for (let i = 0; i < n; i++) o += `<g transform="rotate(${off + (i * 360) / n} 50 50)">${s}</g>`;
    return o;
  };

  const PATRONES = {
    // ---- Floral
    cholula: () =>
      rot(8, `<path d="M50 47C43.5 38 43.5 22 50 9C56.5 22 56.5 38 50 47Z" fill="${C.azul}"/>`) +
      rot(8, `<path d="M50 40C47.8 35 47.8 29 50 23C52.2 29 52.2 35 50 40Z" fill="${C.lav}"/>`, 22.5) +
      `<circle cx="50" cy="50" r="8.5" fill="${C.ocre}"/><circle cx="50" cy="50" r="3.4" fill="${C.ter}"/>` +
      rot(4, `<circle cx="8" cy="8" r="4.2" fill="${C.ter}"/><circle cx="50" cy="3.6" r="1.8" fill="${C.azul}"/>`),

    margarita: () =>
      rot(4, `<path d="M0 0H17Q10 10 0 17Z" fill="${C.ter}" opacity=".9"/>`) +
      rot(6, `<ellipse cx="50" cy="30" rx="8.5" ry="15" fill="${C.azul}"/><ellipse cx="50" cy="31" rx="3.4" ry="9" fill="${C.lav}"/>`) +
      rot(6, `<path d="M50 17Q56.5 10 50 2.5Q43.5 10 50 17Z" fill="${C.verde}"/>`, 30) +
      `<circle cx="50" cy="50" r="9" fill="${C.ocre}"/>` +
      rot(6, `<circle cx="50" cy="44.6" r="1.4" fill="${C.ter}"/>`),

    enredadera: () =>
      rot(4, `<path d="M8 52C8 32 19 19 34 17C44 16 48 23 44 28.5C41 32 35.5 30.5 36.5 25.5" fill="none" stroke="${C.azul}" stroke-width="3.4" stroke-linecap="round"/>` +
        `<path d="M17 31Q12 22 21 18Q23 27 17 31Z" fill="${C.verde}"/><circle cx="36.5" cy="25.5" r="2.5" fill="${C.ter}"/>`) +
      rot(4, `<ellipse cx="50" cy="40" rx="5" ry="9" fill="${C.ter}"/>`, 45) +
      rot(4, `<ellipse cx="50" cy="41" rx="3.4" ry="7" fill="${C.lav}"/>`) +
      `<circle cx="50" cy="50" r="4.8" fill="${C.ocre}"/>`,

    // ---- Geométrico
    estrella: () =>
      rot(4, `<path d="M0 0H22L0 22Z" fill="${C.lav}"/>`) +
      `<rect x="23" y="23" width="54" height="54" fill="${C.azul}"/>` +
      `<rect x="23" y="23" width="54" height="54" fill="${C.azul}" transform="rotate(45 50 50)"/>` +
      rot(8, `<circle cx="50" cy="19.5" r="2.3" fill="${C.esm}"/>`) +
      `<circle cx="50" cy="50" r="16.5" fill="${C.esm}"/>` +
      rot(8, `<path d="M50 49L46.8 37L50 34L53.2 37Z" fill="${C.ter}"/>`) +
      `<circle cx="50" cy="50" r="5" fill="${C.ocre}"/>`,

    rombo: () =>
      rot(4, `<path d="M0 0H50L0 50Z" fill="${C.lav}" opacity=".6"/>`) +
      `<path d="M50 5L95 50L50 95L5 50Z" fill="${C.azul}"/>` +
      `<path d="M50 18L82 50L50 82L18 50Z" fill="${C.esm}"/>` +
      rot(4, `<circle cx="50" cy="25" r="2.2" fill="${C.azul}"/>`) +
      `<path d="M50 30L70 50L50 70L30 50Z" fill="${C.ter}"/>` +
      `<path d="M50 41L59 50L50 59L41 50Z" fill="${C.ocre}"/>`,

    celosia: () =>
      rot(4, `<circle cx="0" cy="0" r="22" fill="${C.lav}"/><circle cx="0" cy="0" r="12" fill="${C.azul}"/>` +
        `<circle cx="0" cy="0" r="50" fill="none" stroke="${C.azul}" stroke-width="4.5"/>`) +
      `<circle cx="50" cy="50" r="10" fill="${C.ter}"/><circle cx="50" cy="50" r="4" fill="${C.ocre}"/>` +
      rot(4, `<circle cx="50" cy="8" r="3" fill="${C.ocre}"/>`),

    // ---- Clásico Poblano
    poblano: () =>
      rot(4, `<circle cx="0" cy="0" r="24" fill="${C.lav}"/><circle cx="0" cy="0" r="24" fill="none" stroke="${C.azul}" stroke-width="2" stroke-dasharray="2 3"/>`) +
      rot(8, `<circle cx="50" cy="12" r="1.8" fill="${C.azul}"/>`, 22.5) +
      `<circle cx="50" cy="50" r="31" fill="${C.azul}"/>` +
      rot(4, `<path d="M50 50C40 42 38 28 50 22C62 28 60 42 50 50Z" fill="${C.esm}"/>`, 45) +
      rot(4, `<circle cx="50" cy="27" r="3" fill="${C.ocre}"/>`) +
      `<circle cx="50" cy="50" r="6" fill="${C.ter}"/>` +
      `<rect x="3" y="3" width="94" height="94" fill="none" stroke="${C.azul}" stroke-width="2"/>`,

    imperial: () =>
      `<circle cx="50" cy="50" r="47" fill="${C.osc}"/>` +
      rot(4, `<circle cx="6" cy="6" r="3" fill="${C.azul}"/>`) +
      rot(12, `<ellipse cx="50" cy="14" rx="4" ry="9" fill="${C.esm}"/>`) +
      rot(24, `<circle cx="50" cy="27.5" r="1.1" fill="${C.lav}"/>`) +
      `<circle cx="50" cy="50" r="22" fill="${C.esm}"/>` +
      rot(8, `<path d="M50 50C46 44 46 35 50 29C54 35 54 44 50 50Z" fill="${C.azul}"/>`) +
      `<circle cx="50" cy="50" r="6" fill="${C.ocre}"/><circle cx="50" cy="50" r="2.5" fill="${C.ter}"/>`,

    cenefa: () => {
      let banda = `<rect width="100" height="20" fill="${C.azul}"/>`;
      for (let x = 6.25; x < 100; x += 12.5) {
        banda += `<circle cx="${x}" cy="20" r="6.25" fill="${C.azul}"/><circle cx="${x}" cy="10" r="2" fill="${C.ocre}"/>`;
      }
      return banda + `<g transform="rotate(180 50 50)">${banda}</g>` +
        rot(4, `<ellipse cx="50" cy="40" rx="5.5" ry="9" fill="${C.azul}"/>`) +
        rot(4, `<ellipse cx="50" cy="41.5" rx="3.4" ry="7" fill="${C.ter}"/>`, 45) +
        `<circle cx="50" cy="50" r="4.5" fill="${C.ocre}"/>`;
    },

    // ---- Moderno
    arco: () =>
      `<circle cx="50" cy="100" r="42" fill="${C.ter}"/>` +
      `<path d="M22 100A28 28 0 0 1 78 100" fill="none" stroke="${C.esm}" stroke-width="5"/>` +
      `<path d="M-4 100A54 54 0 0 1 104 100" fill="none" stroke="${C.azul}" stroke-width="2.4"/>` +
      `<circle cx="74" cy="27" r="11" fill="${C.azul}"/>` +
      `<circle cx="26" cy="30" r="3" fill="${C.ocre}"/>`,

    eclipse: () =>
      `<circle cx="50" cy="50" r="40" fill="none" stroke="${C.azul}" stroke-width="1.5" stroke-dasharray="1.5 3.5"/>` +
      `<circle cx="50" cy="50" r="30" fill="${C.azul}"/>` +
      `<circle cx="61" cy="42" r="25" fill="${C.esm}"/>` +
      `<circle cx="67" cy="37" r="5" fill="${C.ter}"/>` +
      `<circle cx="24" cy="80" r="2.6" fill="${C.ocre}"/>`,

    diagonal: () =>
      `<path d="M0 100L100 0V100Z" fill="${C.azul}"/>` +
      `<path d="M-2 90L90 -2" stroke="${C.ter}" stroke-width="3.2"/>` +
      `<path d="M-2 78L78 -2" stroke="${C.azul}" stroke-width="1.2"/>` +
      `<circle cx="72" cy="72" r="7.5" fill="${C.esm}"/>` +
      `<circle cx="72" cy="72" r="3" fill="${C.ocre}"/>`
  };

  const hex = (() => {
    const p = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      p.push(`${(50 + 48 * Math.cos(a)).toFixed(2)} ${(50 + 48 * Math.sin(a)).toFixed(2)}`);
    }
    return 'M' + p.join('L') + 'Z';
  })();

  const FORMAS = {
    square: 'M9 2H91Q98 2 98 9V91Q98 98 91 98H9Q2 98 2 91V9Q2 2 9 2Z',
    round: 'M50 2A48 48 0 1 1 50 98A48 48 0 1 1 50 2Z',
    hex,
    drop: 'M50 2C60 20 88 42 88 63A38 35 0 0 1 12 63C12 42 40 20 50 2Z'
  };

  let uid = 0;

  function interior(design, shape) {
    const fn = PATRONES[design] || PATRONES.estrella;
    const body = fn();
    // La lágrima tiene el peso abajo: el patrón se centra en su parte ancha.
    return shape === 'drop' ? `<g transform="translate(50 61) scale(.74) translate(-50 -50)">${body}</g>` : body;
  }

  /* Ficha esmaltada. attrs permite anidarla dentro de otro SVG (x, y, width, height). */
  function svg(design, shape = 'square', attrs = '') {
    const id = 'tv' + (++uid).toString(36);
    const d = FORMAS[shape] || FORMAS.square;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 104" ${attrs} aria-hidden="true" focusable="false">` +
      `<defs><clipPath id="${id}c"><path d="${d}"/></clipPath>` +
      `<radialGradient id="${id}g" cx=".3" cy=".22" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".72"/><stop offset=".38" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>` +
      `<linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset=".5" stop-color="#0B1E3D" stop-opacity="0"/><stop offset="1" stop-color="#0B1E3D" stop-opacity=".16"/></linearGradient></defs>` +
      `<path d="${d}" fill="${C.borde}" transform="translate(0 3)"/>` +
      `<g clip-path="url(#${id}c)"><rect width="100" height="100" fill="${C.esm}"/>${interior(design, shape)}` +
      `<rect width="100" height="100" fill="url(#${id}s)"/><rect width="100" height="100" fill="url(#${id}g)"/></g>` +
      `<path d="${d}" fill="none" stroke="#0B1E3D" stroke-opacity=".14" stroke-width="1"/></svg>`;
  }

  /* Reverso: barro sin esmalte, con el sello del taller. */
  function reverso(shape = 'square', attrs = '') {
    const d = FORMAS[shape] || FORMAS.square;
    const id = 'tr' + (++uid).toString(36);
    let s = 7;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    let puntos = '';
    for (let i = 0; i < 46; i++) {
      puntos += `<circle cx="${(rnd() * 100).toFixed(1)}" cy="${(rnd() * 100).toFixed(1)}" r="${(0.4 + rnd() * 1.2).toFixed(2)}" fill="${rnd() > 0.5 ? '#9C7B55' : '#E6D3B5'}" opacity=".7"/>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 104" ${attrs} aria-hidden="true" focusable="false">` +
      `<defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs>` +
      `<path d="${d}" fill="#B99A72" transform="translate(0 3)"/>` +
      `<g clip-path="url(#${id})"><rect width="100" height="100" fill="#CDB08A"/>${puntos}` +
      `<circle cx="50" cy="52" r="12" fill="none" stroke="${C.azul}" stroke-opacity=".55" stroke-width="1.4"/>` +
      `<text x="50" y="55.5" font-family="Georgia, serif" font-size="9" text-anchor="middle" fill="${C.azul}" fill-opacity=".6">T·A</text></g></svg>`;
  }

  const uri = (s) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);

  /* Rellena los marcadores [data-ficha] del HTML (dentro de SVG o de HTML). */
  function llenar(root = document) {
    root.querySelectorAll('[data-ficha]').forEach((el) => {
      const design = el.dataset.ficha;
      const shape = el.dataset.forma || 'square';
      if (el.namespaceURI === 'http://www.w3.org/2000/svg') {
        const sz = parseFloat(el.dataset.s) || 40;
        el.innerHTML = svg(design, shape, `x="${el.dataset.x || 0}" y="${el.dataset.y || 0}" width="${sz}" height="${(sz * 1.04).toFixed(2)}"`);
      } else {
        el.innerHTML = svg(design, shape);
      }
    });
  }

  TL.talavera = {
    svg,
    reverso,
    llenar,
    formas: FORMAS,
    colores: C,
    uri: (d, sh) => uri(svg(d, sh)),
    uriReverso: (sh) => uri(reverso(sh))
  };
})(window.TL);
