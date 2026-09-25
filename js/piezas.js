/* Engarce · composición de piezas colgantes (catálogo y detalle).
   Una pieza = gancho de latón (fijo) + cadena en SVG + fichas en HTML.
   Las fichas son elementos HTML para poder moverlas en 3D en el despiece. */
(function (TL) {
  'use strict';

  const W = 200;
  const H = 240;
  const pct = (v, t) => ((v / t) * 100).toFixed(2) + '%';
  const f1 = (n) => Number(n.toFixed(1));

  function bezier(p0, p1, p2, p3, t) {
    const u = 1 - t;
    return {
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y
    };
  }

  /* Trazo de cadena (doble línea con eslabones) o de hilo encerado. k escala los grosores. */
  function trazo(d, metal, k = 1) {
    const m = TL.metals[metal] || TL.metals.plata;
    if (m.cord) {
      return `<path d="${d}" fill="none" stroke="${m.dark}" stroke-width="${3.2 * k}" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<path d="${d}" fill="none" stroke="${m.color}" stroke-width="${2.2 * k}" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<path d="${d}" fill="none" stroke="${m.light}" stroke-width="${0.7 * k}" stroke-dasharray="${3 * k} ${4 * k}" stroke-linecap="round" opacity=".8"/>`;
    }
    return `<path d="${d}" fill="none" stroke="${m.dark}" stroke-width="${2.2 * k}" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="${d}" fill="none" stroke="${m.light}" stroke-width="${1.3 * k}" stroke-dasharray="${2.4 * k} ${1.4 * k}" stroke-linecap="round"/>`;
  }

  function layout(p) {
    const slots = [];
    let d;
    if (p.type === 'collar') {
      // Collar colgado del gancho: un lazo alargado con el dije abajo.
      const G = { x: 100, y: 24 };
      const B = { x: 100, y: 164 };
      const L1 = { x: 76, y: 44 }, L2 = { x: 58, y: 126 };
      const R1 = { x: 124, y: 44 }, R2 = { x: 142, y: 126 };
      d = `M${G.x} ${G.y}C${L1.x} ${L1.y} ${L2.x} ${L2.y} ${B.x} ${B.y}C${R2.x} ${R2.y} ${R1.x} ${R1.y} ${G.x} ${G.y}`;
      const s = p.fichas > 1 ? 36 : p.shape === 'drop' ? 46 : 42;
      slots.push({ x: 100, y: B.y + 5 + s / 2, s, ex: 0, ey: 9 });
      if (p.fichas > 1) {
        [[L1, L2, -1], [R1, R2, 1]].forEach(([c1, c2, sg]) => {
          const q = bezier(G, c1, c2, B, 0.74);
          const s2 = 24;
          slots.push({ x: q.x, y: q.y + 4 + s2 / 2, s: s2, ex: sg * 4, ey: 7 });
        });
      }
    } else {
      // Pulsera: lazo redondo; las fichas cuelgan como dijes.
      const cx = 100, cy = 82, rx = 50, ry = 58;
      d = `M${cx} ${cy - ry}A${rx} ${ry} 0 0 1 ${cx} ${cy + ry}A${rx} ${ry} 0 0 1 ${cx} ${cy - ry}Z`;
      const n = p.fichas;
      const angs = n === 1 ? [90] : n === 3 ? [90, 56, 124] : [90, 62, 118, 36, 144];
      const s = n >= 5 ? 22 : n === 3 ? 27 : 32;
      angs.forEach((a) => {
        const r = (a * Math.PI) / 180;
        const x = cx + rx * Math.cos(r);
        const y = cy + ry * Math.sin(r);
        slots.push({ x, y: y + 4 + s / 2, s, ex: Math.cos(r) * 7, ey: 7 });
      });
    }
    return { d, slots };
  }

  // Gancho de latón atornillado al tablero.
  const GANCHO =
    `<svg class="pieza__gancho" viewBox="0 0 ${W} ${H}" aria-hidden="true">` +
    `<circle cx="101.5" cy="11.5" r="7" fill="#102F5A" opacity=".12"/>` +
    `<circle cx="100" cy="10" r="6.5" fill="#B88E45"/>` +
    `<circle cx="98.4" cy="8.4" r="3.4" fill="#E2C47E" opacity=".75"/>` +
    `<path d="M97.5 10H102.5" stroke="#7A5A22" stroke-width="1" stroke-linecap="round"/>` +
    `<path d="M100 12V18Q100 25.5 93.5 25.5Q88.5 25.5 88.5 21" fill="none" stroke="#9C7630" stroke-width="2.6" stroke-linecap="round"/>` +
    `<path d="M100.6 12.5V18" fill="none" stroke="#E9CF8F" stroke-width=".8" stroke-linecap="round"/>` +
    `</svg>`;

  function slot(o, p) {
    const m = TL.metals[p.metal] || TL.metals.plata;
    return `<span class="ficha-slot" style="--x:${pct(o.x, W)};--y:${pct(o.y, H)};--s:${pct(o.s, W)};--ex:${f1(o.ex)};--ey:${f1(o.ey)};--metal:${m.color}">` +
      `<span class="aro"></span><span class="ficha">${TL.talavera.svg(p.design, p.shape)}</span></span>`;
  }

  function pieza(p, opts = {}) {
    const { d, slots } = layout(p);
    const gancho = opts.gancho === false ? '' : GANCHO;
    return `${gancho}<span class="pieza"><svg class="pieza__cadena" viewBox="0 0 ${W} ${H}" aria-hidden="true">${trazo(d, p.metal)}</svg>` +
      `${slots.map((o) => slot(o, p)).join('')}</span>`;
  }

  /* Dispara el despiece una vez (se ignora si ya está en curso). */
  function desarmar(el) {
    if (!el || TL.motion.reduce || el.classList.contains('is-desarmando')) return;
    el.classList.add('is-desarmando');
    setTimeout(() => el.classList.remove('is-desarmando'), 1050);
  }

  TL.pieza = pieza;
  TL.trazo = trazo;
  TL.desarmar = desarmar;
})(window.TL);
