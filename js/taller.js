/* Engarce · Taller de combinaciones (personalizador).
   Al tocar una ficha del menú, una copia vuela, gira en 3D (mostrando el barro del reverso)
   y encaja en la joya con un pulso y un "clic" cerámico. */
(function (TL) {
  'use strict';

  const FORMAS = ['round', 'square', 'hex', 'drop'];

  TL.initTaller = function () {
    const root = document.querySelector('[data-taller]');
    if (!root) return;
    const $ = (s) => root.querySelector(s);
    const svg = $('[data-taller-svg]');
    const engaste = $('[data-engaste]');
    const fichaEl = $('[data-engaste-ficha]');
    const etiqueta = $('[data-taller-etiqueta]');
    const menu = $('[data-taller-fichas]');
    const precioEl = $('[data-taller-precio]');
    const desglose = $('[data-taller-desglose]');

    const estado = { tipo: 'collar', forma: 'round', metal: 'plata', ficha: 'estrella' };
    let vuelo = null;

    // ---- Controles
    $('[data-taller-formas]').innerHTML = FORMAS.map((f) =>
      `<label class="opcion"><input type="radio" name="taller-forma" id="taller-forma-${f}" value="${f}"${f === estado.forma ? ' checked' : ''}>` +
      `<span><svg class="opcion__forma" viewBox="0 0 100 100" aria-hidden="true"><path d="${TL.talavera.formas[f]}" fill="currentColor" opacity=".85"/></svg>${TL.shapes[f].label}</span></label>`
    ).join('');

    $('[data-taller-metales]').innerHTML = Object.keys(TL.metals).map((id) => {
      const m = TL.metals[id];
      return `<label class="opcion"><input type="radio" name="taller-metal" id="taller-metal-${id}" value="${id}"${id === estado.metal ? ' checked' : ''}>` +
        `<span><span class="opcion__muestra" style="background:linear-gradient(135deg, ${m.light}, ${m.color} 55%, ${m.dark})"></span>${m.label}</span></label>`;
    }).join('');

    menu.innerHTML = Object.keys(TL.families).map((fid) =>
      `<div class="taller__grupo"><p class="taller__familia">${TL.families[fid].label}</p><div class="taller__fila">` +
      TL.designs.filter((d) => d.family === fid).map((d) =>
        `<button type="button" class="ficha-boton" data-ficha-id="${d.id}" aria-pressed="${d.id === estado.ficha}">` +
        `<span class="ficha-boton__img"></span><span class="ficha-boton__nombre">${d.name}</span></button>`
      ).join('') + `</div></div>`
    ).join('');

    function pintarMenu() {
      menu.querySelectorAll('[data-ficha-id]').forEach((b) => {
        b.querySelector('.ficha-boton__img').innerHTML = TL.talavera.svg(b.dataset.fichaId, estado.forma);
      });
    }

    function marcarMenu() {
      menu.querySelectorAll('[data-ficha-id]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.fichaId === estado.ficha)));
    }

    function dibujarBase() {
      const m = TL.metals[estado.metal];
      engaste.dataset.tipo = estado.tipo;
      engaste.style.setProperty('--metal', m.color);
      if (estado.tipo === 'collar') {
        svg.innerHTML =
          `<ellipse cx="200" cy="306" rx="64" ry="6" fill="#102F5A" opacity=".08"/>` +
          TL.trazo('M16 -8C38 150 126 208 200 210C274 208 362 150 384 -8', estado.metal, 1.2);
        engaste.style.setProperty('--y', '80%');
      } else {
        svg.innerHTML =
          `<ellipse cx="200" cy="268" rx="150" ry="10" fill="#102F5A" opacity=".08"/>` +
          `<g opacity=".5">${TL.trazo('M50 150A150 62 0 0 1 350 150', estado.metal, 1)}</g>` +
          TL.trazo('M50 150A150 62 0 0 0 350 150', estado.metal, 1.25);
        engaste.style.setProperty('--y', ((212 / 320) * 100).toFixed(2) + '%');
      }
    }

    const pintarFicha = () => { fichaEl.innerHTML = TL.talavera.svg(estado.ficha, estado.forma); };

    function precio() {
      const b = TL.bases[estado.tipo].price;
      const f = TL.shapes[estado.forma].price;
      const m = TL.metals[estado.metal].price;
      return { total: b + f + m, b, f, m };
    }

    function resumen() {
      const d = TL.design(estado.ficha);
      const pr = precio();
      etiqueta.textContent = `${TL.bases[estado.tipo].label} · ${TL.metals[estado.metal].label} · ${d.name}, ${TL.shapes[estado.forma].label.toLowerCase()}`;
      precioEl.textContent = TL.precio(pr.total);
      desglose.textContent = `Base ${TL.precio(pr.b)} · Ficha ${TL.precio(pr.f)} · Metal ${pr.m < 0 ? '−' : '+'}${TL.precio(Math.abs(pr.m))}`;
    }

    // ---- Vuelo 3D de la ficha
    function volar(desde, id) {
      const a = desde.getBoundingClientRect();
      const b = fichaEl.getBoundingClientRect();
      const el = document.createElement('div');
      el.className = 'volador';
      el.innerHTML =
        `<div class="volador__cara">${TL.talavera.svg(id, estado.forma)}</div>` +
        `<div class="volador__cara volador__cara--reverso">${TL.talavera.reverso(estado.forma)}</div>`;
      el.style.cssText = `left:${a.left}px;top:${a.top}px;width:${a.width}px;height:${a.height}px`;
      document.body.appendChild(el);

      const dx = b.left + b.width / 2 - (a.left + a.width / 2);
      const dy = b.top + b.height / 2 - (a.top + a.height / 2);
      const s = b.width / a.width;
      const arco = -TL.clamp(Math.hypot(dx, dy) * 0.3, 60, 170);
      const frames = [];
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        const x = dx * t;
        const y = dy * t + arco * 4 * t * (1 - t);
        const sc = 1 + (s - 1) * t + 0.3 * Math.sin(Math.PI * t);
        frames.push({
          transform: `perspective(800px) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${(90 * Math.sin(Math.PI * t)).toFixed(1)}px) ` +
            `rotateY(${(360 * t).toFixed(1)}deg) rotateZ(${(-16 * Math.sin(Math.PI * t)).toFixed(1)}deg) scale(${sc.toFixed(3)})`,
          offset: t
        });
      }
      const anim = el.animate(frames, { duration: 820, easing: 'cubic-bezier(.45, .05, .25, 1)', fill: 'forwards' });
      vuelo = { anim, el };
      return anim.finished.then(
        () => { el.remove(); return true; },
        () => { el.remove(); return false; }
      );
    }

    function encajar() {
      engaste.classList.remove('is-encajando');
      void engaste.offsetWidth;
      engaste.classList.add('is-encajando');
      fichaEl.animate(
        [{ transform: 'translateY(-8px) scale(1.14)' }, { transform: 'translateY(1px) scale(.95)', offset: 0.45 }, { transform: 'none' }],
        { duration: 560, easing: TL.resorte }
      );
      svg.animate(
        [{ transform: 'rotate(0)' }, { transform: 'rotate(.7deg)', offset: 0.3 }, { transform: 'rotate(-.45deg)', offset: 0.65 }, { transform: 'none' }],
        { duration: 800, easing: 'ease-out' }
      );
      TL.sonido.clink();
    }

    function elegir(id, boton) {
      if (id === estado.ficha) {
        fichaEl.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-6deg)' }, { transform: 'rotate(4deg)' }, { transform: 'none' }], { duration: 420, easing: 'ease-out' });
        return;
      }
      estado.ficha = id;
      marcarMenu();
      resumen();
      TL.anunciar(`Ficha ${TL.design(id).name} montada.`);

      if (TL.motion.reduce) { pintarFicha(); TL.sonido.clink(); return; }
      if (vuelo) { vuelo.anim.cancel(); vuelo = null; }

      const vieja = fichaEl.firstElementChild;
      if (vieja) {
        vieja.animate(
          [{ transform: 'none', opacity: 1 }, { transform: 'translateY(26px) rotate(14deg) scale(.9)', opacity: 0 }],
          { duration: 260, easing: 'cubic-bezier(.5, 0, .75, 0)', fill: 'forwards' }
        );
      }
      volar(boton.querySelector('.ficha-boton__img'), id).then((ok) => {
        if (!ok) return;
        vuelo = null;
        pintarFicha();
        encajar();
      });
    }

    function girarFicha() {
      if (TL.motion.reduce) { pintarFicha(); return; }
      const a = fichaEl.animate(
        [{ transform: 'perspective(500px) rotateY(0)' }, { transform: 'perspective(500px) rotateY(90deg)' }],
        { duration: 160, easing: 'ease-in' }
      );
      a.onfinish = () => {
        pintarFicha();
        fichaEl.animate(
          [{ transform: 'perspective(500px) rotateY(-90deg)' }, { transform: 'perspective(500px) rotateY(0)' }],
          { duration: 560, easing: TL.resorte }
        );
        TL.sonido.clink();
      };
    }

    // ---- Eventos
    menu.addEventListener('click', (e) => {
      const b = e.target.closest('[data-ficha-id]');
      if (b) elegir(b.dataset.fichaId, b);
    });

    root.addEventListener('change', (e) => {
      const t = e.target;
      if (t.name === 'taller-tipo') {
        estado.tipo = t.value;
        dibujarBase();
        if (!TL.motion.reduce) {
          svg.animate([{ opacity: 0, transform: 'translateY(-14px)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.22, 1, .36, 1)' });
        }
      }
      if (t.name === 'taller-forma') {
        estado.forma = t.value;
        pintarMenu();
        girarFicha();
      }
      if (t.name === 'taller-metal') {
        estado.metal = t.value;
        dibujarBase();
      }
      resumen();
    });

    $('[data-taller-anadir]').addEventListener('click', () => {
      const d = TL.design(estado.ficha);
      const base = TL.bases[estado.tipo];
      TL.caja.agregar({
        id: 'taller',
        key: `taller-${estado.tipo}-${estado.ficha}-${estado.forma}-${estado.metal}`,
        nombre: `${base.label} a tu medida`,
        detalle: `${d.name} · ${TL.shapes[estado.forma].label} · ${TL.metals[estado.metal].label} · ${base.medida}`,
        precio: precio().total,
        design: estado.ficha,
        shape: estado.forma,
        metal: estado.metal
      }, fichaEl);
    });

    pintarMenu();
    dibujarBase();
    pintarFicha();
    resumen();
  };
})(window.TL);
