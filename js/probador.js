/* Engarce · Probador de silueta.
   - Ratón: arrastrar y soltar desde la bandeja sobre el cuello o la muñeca.
   - Táctil y teclado: Tap & Select (tocar pieza, luego tocar la silueta).
   - El collar cae con física de cuerda (Verlet): los extremos se enganchan al cuello,
     la cadena se descuelga, se balancea y se asienta con el peso del dije.
   - La pulsera cae desde arriba, pasa por la mano, rebota en la muñeca y se tambalea. */
(function (TL) {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  // Busto (viewBox 400 × 360)
  const ANCLA_I = { x: 154, y: 143 };
  const ANCLA_D = { x: 246, y: 143 };
  const NUCA_I = 'M154 143Q160 128 168 116';
  const NUCA_D = 'M246 143Q240 128 232 116';

  // Muñeca
  const PULSO = { cx: 200, y: 250, rx: 44, ry: 11 };

  const G = 1400;           // gravedad (unidades SVG / s²)
  const DT = 1 / 120;       // paso fijo
  const ITER = 16;

  function camino(p) {
    let d = `M${p[0].x.toFixed(1)} ${p[0].y.toFixed(1)}`;
    for (let i = 1; i < p.length - 1; i++) {
      const mx = (p[i].x + p[i + 1].x) / 2;
      const my = (p[i].y + p[i + 1].y) / 2;
      d += `Q${p[i].x.toFixed(1)} ${p[i].y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
    }
    const u = p[p.length - 1];
    return d + `L${u.x.toFixed(1)} ${u.y.toFixed(1)}`;
  }

  function estiloTrazo(m) {
    return m.cord
      ? { base: m.dark, luz: m.color, ab: 3.6, al: 2.4, dash: '' }
      : { base: m.dark, luz: m.light, ab: 2.6, al: 1.4, dash: '2.6 1.6' };
  }

  TL.initProbador = function () {
    const root = document.querySelector('[data-probador]');
    if (!root) return;
    const lista = root.querySelector('[data-bandeja]');
    const estadoTxt = root.querySelector('[data-bandeja-estado]');
    const zonas = {
      cuello: root.querySelector('[data-zona="cuello"]'),
      muneca: root.querySelector('[data-zona="muneca"]')
    };
    const puesto = { cuello: null, muneca: null };
    const anim = { cuello: 0, muneca: 0 };
    let seleccion = null;
    let suprimirClick = false;

    const zonaDe = (p) => (p.type === 'collar' ? 'cuello' : 'muneca');
    const TEXTO_ZONA = { cuello: 'el cuello', muneca: 'la muñeca' };

    lista.innerHTML = TL.products.map((p) =>
      `<li><button type="button" class="bandeja__item" data-prueba="${p.id}" aria-pressed="false">` +
      `<span class="bandeja__ficha">${TL.talavera.svg(p.design, p.shape)}</span>` +
      `<span class="bandeja__texto"><span class="bandeja__nombre">${p.name}</span>` +
      `<span class="bandeja__tipo">${p.type === 'collar' ? 'Collar · al cuello' : 'Pulsera · a la muñeca'}</span></span>` +
      `</button></li>`
    ).join('');

    // ---- Utilidades de interfaz
    function mostrarZona(z) {
      Object.keys(zonas).forEach((k) => zonas[k].classList.toggle('is-visible', k === z));
      root.querySelectorAll('[data-pestana]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pestana === z)));
    }

    function marcarObjetivo(p) {
      Object.keys(zonas).forEach((k) => zonas[k].classList.toggle('is-objetivo', !!p && zonaDe(p) === k));
    }

    function avisar(zona, txt) {
      const el = zonas[zona].querySelector('[data-lienzo-aviso]');
      el.textContent = txt;
      el.classList.add('is-visible');
      zonas[zona].classList.remove('is-rechazo');
      void zonas[zona].offsetWidth;
      zonas[zona].classList.add('is-rechazo');
      clearTimeout(el._t);
      el._t = setTimeout(() => el.classList.remove('is-visible'), 2200);
    }

    function seleccionar(id) {
      seleccion = seleccion === id ? null : id;
      lista.querySelectorAll('[data-prueba]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.prueba === seleccion)));
      const p = seleccion && TL.producto(seleccion);
      marcarObjetivo(p);
      if (p) {
        mostrarZona(zonaDe(p));
        estadoTxt.textContent = `${p.name}: ahora toca ${TEXTO_ZONA[zonaDe(p)]}.`;
      } else {
        estadoTxt.textContent = 'Elige una pieza de la bandeja.';
      }
    }

    function actualizarPie(zona) {
      const p = puesto[zona];
      const fig = zonas[zona];
      fig.querySelector('[data-lienzo-info]').textContent = p ? `${p.name} · ${TL.precio(p.price)}` : '';
      fig.querySelector('[data-lienzo-acciones]').hidden = !p;
    }

    function puntoSVG(zona, x, y) {
      const svg = zonas[zona].querySelector('svg');
      const m = svg.getScreenCTM && svg.getScreenCTM();
      if (!m || x == null) return null;
      const pt = svg.createSVGPoint();
      pt.x = x;
      pt.y = y;
      const r = pt.matrixTransform(m.inverse());
      return { x: TL.clamp(r.x, 40, 360), y: TL.clamp(r.y, 0, 330) };
    }

    // ---- Collar: cuerda con Verlet
    function ponerCollar(p, punto, instantaneo) {
      cancelAnimationFrame(anim.cuello);
      const capa = zonas.cuello.querySelector('[data-capa="collar"]');
      Array.from(capa.children).forEach((g) => {
        g.classList.add('is-saliendo');
        setTimeout(() => g.remove(), 320);
      });

      const m = TL.metals[p.metal];
      const est = estiloTrazo(m);
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'prenda');
      const s = p.fichas > 1 ? 30 : p.shape === 'drop' ? 40 : 36;
      const dijes = [{ off: 0, s }];
      if (p.fichas > 1) dijes.push({ off: -5, s: 20 }, { off: 5, s: 20 });
      g.innerHTML =
        `<path class="prenda__nuca" d="${NUCA_I} ${NUCA_D}" fill="none" stroke="${est.base}" stroke-width="${est.ab}" stroke-linecap="round" opacity="0"/>` +
        `<path data-base fill="none" stroke="${est.base}" stroke-width="${est.ab}" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<path data-luz fill="none" stroke="${est.luz}" stroke-width="${est.al}" stroke-dasharray="${est.dash}" stroke-linecap="round" stroke-linejoin="round"/>` +
        dijes.map((d) =>
          `<g data-dije><circle cx="0" cy="${-(d.s / 2 + 2)}" r="3.6" fill="none" stroke="${m.color}" stroke-width="1.8"/>` +
          TL.talavera.svg(p.design, p.shape, `x="${-d.s / 2}" y="${-d.s / 2}" width="${d.s}" height="${(d.s * 1.04).toFixed(1)}"`) +
          `</g>`
        ).join('');
      capa.appendChild(g);
      const nuca = g.querySelector('.prenda__nuca');
      const trazoBase = g.querySelector('[data-base]');
      const trazoLuz = g.querySelector('[data-luz]');
      const gDijes = g.querySelectorAll('[data-dije]');

      const N = 24;
      const LARGO = 236;
      const SEG = LARGO / (N - 1);
      const origen = punto || { x: 200, y: 90 };
      const pts = [];
      for (let i = 0; i < N; i++) {
        const x = origen.x + (i / (N - 1) - 0.5) * 90;
        const y = origen.y - 12;
        pts.push({ x, y, px: x, py: y - 1.5 });
      }
      const ini0 = { x: pts[0].x, y: pts[0].y };
      const iniN = { x: pts[N - 1].x, y: pts[N - 1].y };
      const mid = (N - 1) / 2 | 0;
      const pend = dijes.map((d) => {
        const i = mid + d.off;
        const L = d.s / 2 + 5;
        const q = pts[i];
        return { i, L, x: q.x, y: q.y + L, px: q.x, py: q.y + L - 1.5 };
      });

      function restringir(a, b, len, wa, wb) {
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 1e-6;
        if (dist <= len && wa + wb === 2) return; // la cadena se puede amontonar
        const dif = (dist - len) / dist;
        const t = wa + wb;
        if (!t) return;
        a.x += dx * dif * (wa / t);
        a.y += dy * dif * (wa / t);
        b.x -= dx * dif * (wb / t);
        b.y -= dy * dif * (wb / t);
      }

      function paso() {
        let mov = 0;
        for (let i = 1; i < N - 1; i++) {
          const q = pts[i];
          const vx = (q.x - q.px) * 0.985;
          const vy = (q.y - q.py) * 0.985;
          q.px = q.x; q.py = q.y;
          q.x += vx; q.y += vy + G * DT * DT;
          mov += Math.abs(vx) + Math.abs(vy);
        }
        pend.forEach((q) => {
          const vx = (q.x - q.px) * 0.985;
          const vy = (q.y - q.py) * 0.985;
          q.px = q.x; q.py = q.y;
          q.x += vx; q.y += vy + G * DT * DT;
          mov += Math.abs(vx) + Math.abs(vy);
        });
        for (let k = 0; k < ITER; k++) {
          for (let i = 0; i < N - 1; i++) {
            restringir(pts[i], pts[i + 1], SEG, i === 0 ? 0 : 1, i + 1 === N - 1 ? 0 : 1);
          }
          // El dije pesa más que un eslabón: arrastra la cadena hacia abajo.
          pend.forEach((q) => restringir(pts[q.i], q, q.L, 0.8, 0.2));
        }
        return mov / (N + pend.length);
      }

      function pintar(e) {
        const d = camino(pts);
        trazoBase.setAttribute('d', d);
        trazoLuz.setAttribute('d', d);
        nuca.setAttribute('opacity', e >= 1 ? '1' : '0');
        pend.forEach((q, k) => {
          const c = pts[q.i];
          const ang = Math.atan2(q.x - c.x, q.y - c.y) * (180 / Math.PI);
          gDijes[k].setAttribute('transform', `translate(${q.x.toFixed(1)} ${q.y.toFixed(1)}) rotate(${(-ang).toFixed(1)})`);
        });
      }

      const anclar = (e) => {
        const k = 1 - Math.pow(1 - e, 3);
        pts[0].x = TL.lerp(ini0.x, ANCLA_I.x, k);
        pts[0].y = TL.lerp(ini0.y, ANCLA_I.y, k);
        pts[N - 1].x = TL.lerp(iniN.x, ANCLA_D.x, k);
        pts[N - 1].y = TL.lerp(iniN.y, ANCLA_D.y, k);
      };

      if (instantaneo || TL.motion.reduce) {
        anclar(1);
        for (let i = 0; i < 900; i++) paso();
        pintar(1);
        return;
      }

      const t0 = performance.now();
      let ultimo = t0, acc = 0, quietos = 0, sono = false;
      function cuadro(ahora) {
        acc += Math.min(0.05, (ahora - ultimo) / 1000);
        ultimo = ahora;
        const e = Math.min(1, (ahora - t0) / 380);
        anclar(e);
        let mov = 0;
        while (acc >= DT) { mov = paso(); acc -= DT; }
        pintar(e);
        if (!sono && ahora - t0 > 520) { sono = true; TL.sonido.clink(); }
        quietos = e >= 1 && mov < 0.004 ? quietos + 1 : 0;
        if (quietos < 45) anim.cuello = requestAnimationFrame(cuadro);
      }
      anim.cuello = requestAnimationFrame(cuadro);
    }

    // ---- Pulsera: caída, rebote y tambaleo
    function ponerPulsera(p, punto, instantaneo) {
      cancelAnimationFrame(anim.muneca);
      const atras = zonas.muneca.querySelector('[data-capa="pulsera-atras"]');
      const frente = zonas.muneca.querySelector('[data-capa="pulsera-frente"]');
      [atras, frente].forEach((capa) => Array.from(capa.children).forEach((g) => {
        g.classList.add('is-saliendo');
        setTimeout(() => g.remove(), 320);
      }));

      const m = TL.metals[p.metal];
      const est = estiloTrazo(m);
      const { cx, y, rx, ry } = PULSO;
      const arco = (barrido) => `M${cx - rx} ${y}A${rx} ${ry} 0 0 ${barrido} ${cx + rx} ${y}`;
      const trazo = (d, op) =>
        `<path d="${d}" fill="none" stroke="${est.base}" stroke-width="${est.ab}" stroke-linecap="round" opacity="${op}"/>` +
        `<path d="${d}" fill="none" stroke="${est.luz}" stroke-width="${est.al}" stroke-dasharray="${est.dash}" stroke-linecap="round" opacity="${op}"/>`;

      const n = p.fichas;
      const angs = n === 1 ? [90] : n === 3 ? [90, 58, 122] : [90, 64, 116, 40, 140];
      const s = n >= 5 ? 18 : n === 3 ? 22 : 26;
      const fichas = angs.map((a) => {
        const r = (a * Math.PI) / 180;
        const fx = cx + rx * Math.cos(r);
        const fy = y + ry * Math.sin(r);
        const esc = Math.max(0.45, Math.sin(r));
        return `<g transform="translate(${fx.toFixed(1)} ${(fy + 3).toFixed(1)}) scale(${esc.toFixed(2)} 1)">` +
          `<circle cx="0" cy="0" r="2.8" fill="none" stroke="${m.color}" stroke-width="1.5"/>` +
          TL.talavera.svg(p.design, p.shape, `x="${-s / 2}" y="2" width="${s}" height="${(s * 1.04).toFixed(1)}"`) +
          `</g>`;
      }).join('');

      const gA = document.createElementNS(NS, 'g');
      const gF = document.createElementNS(NS, 'g');
      gA.setAttribute('class', 'prenda');
      gF.setAttribute('class', 'prenda');
      gA.innerHTML = trazo(arco(1), 0.75);
      gF.innerHTML = trazo(arco(0), 1) + fichas;
      atras.appendChild(gA);
      frente.appendChild(gF);

      const aplicar = (o, th) => {
        const t = `translate(0 ${o.toFixed(2)}) rotate(${(th * 57.3).toFixed(2)} ${cx} ${y})`;
        gA.setAttribute('transform', t);
        gF.setAttribute('transform', t);
      };

      if (instantaneo || TL.motion.reduce) { aplicar(0, 0); return; }

      let o = Math.min((punto ? punto.y : 0) - y - 80, -150);
      let v = 0, th = (Math.random() - 0.5) * 0.3, w = 0, rebotes = 0;
      let ultimo = performance.now();
      aplicar(o, th);
      function cuadro(ahora) {
        const dt = Math.min(0.033, (ahora - ultimo) / 1000);
        ultimo = ahora;
        v += 2600 * dt;
        o += v * dt;
        if (o >= 0) {
          o = 0;
          if (v > 90) {
            w += (rebotes % 2 ? -1 : 1) * v * 0.006;
            v = -v * 0.32;
            if (rebotes++ === 0) TL.sonido.clink();
          } else v = 0;
        }
        w += (-th * 130 - w * 8) * dt;
        th += w * dt;
        aplicar(o, th);
        if (!(v === 0 && o === 0 && Math.abs(th) < 0.0015 && Math.abs(w) < 0.01)) anim.muneca = requestAnimationFrame(cuadro);
      }
      anim.muneca = requestAnimationFrame(cuadro);
    }

    function probar(p, zona, punto, instantaneo) {
      if (zonaDe(p) !== zona) {
        avisar(zona, `Esta pieza va en ${TEXTO_ZONA[zonaDe(p)]}.`);
        return false;
      }
      puesto[zona] = p;
      if (zona === 'cuello') ponerCollar(p, punto, instantaneo);
      else ponerPulsera(p, punto, instantaneo);
      actualizarPie(zona);
      if (!instantaneo) {
        estadoTxt.textContent = `${p.name} en ${TEXTO_ZONA[zona]}. Prueba otra o añádela a tu caja.`;
        TL.anunciar(`${p.name} puesta en ${TEXTO_ZONA[zona]}.`);
      }
      return true;
    }

    function quitar(zona) {
      puesto[zona] = null;
      cancelAnimationFrame(anim[zona]);
      zonas[zona].querySelectorAll('[data-capa] > g').forEach((g) => {
        g.classList.add('is-saliendo');
        setTimeout(() => g.remove(), 320);
      });
      actualizarPie(zona);
    }

    // ---- Arrastrar (ratón y lápiz)
    function zonaEn(x, y) {
      const el = document.elementFromPoint(x, y);
      return el && el.closest('[data-zona]');
    }

    function crearFantasma(p) {
      const f = document.createElement('div');
      f.className = 'arrastre';
      f.innerHTML = TL.talavera.svg(p.design, p.shape);
      document.body.appendChild(f);
      return f;
    }

    lista.addEventListener('pointerdown', (e) => {
      const btn = e.target.closest('[data-prueba]');
      if (!btn || e.button !== 0 || e.pointerType === 'touch') return;
      e.preventDefault();
      document.documentElement.classList.add('sin-seleccion');
      const p = TL.producto(btn.dataset.prueba);
      const x0 = e.clientX, y0 = e.clientY;
      let fantasma = null, ultX = x0, incl = 0;

      const mover = (ev) => {
        if (!fantasma) {
          if (Math.hypot(ev.clientX - x0, ev.clientY - y0) < 6) return;
          fantasma = crearFantasma(p);
          btn.classList.add('is-arrastrando');
          document.documentElement.classList.add('arrastrando');
          marcarObjetivo(p);
          estadoTxt.textContent = `Suelta ${p.name} sobre ${TEXTO_ZONA[zonaDe(p)]}.`;
        }
        incl = TL.clamp(incl * 0.8 + (ev.clientX - ultX) * 0.9, -28, 28);
        ultX = ev.clientX;
        fantasma.style.transform = `translate3d(${ev.clientX}px, ${ev.clientY}px, 0) rotate(${incl.toFixed(1)}deg)`;
        const z = zonaEn(ev.clientX, ev.clientY);
        Object.values(zonas).forEach((zz) => zz.classList.toggle('is-sobre', zz === z));
      };
      const soltar = (ev) => {
        window.removeEventListener('pointermove', mover);
        window.removeEventListener('pointerup', soltar);
        window.removeEventListener('pointercancel', soltar);
        document.documentElement.classList.remove('sin-seleccion');
        if (!fantasma) return;           // fue un clic: lo resuelve el evento click
        suprimirClick = true;
        setTimeout(() => { suprimirClick = false; }, 0);
        fantasma.remove();
        btn.classList.remove('is-arrastrando');
        document.documentElement.classList.remove('arrastrando');
        Object.values(zonas).forEach((zz) => zz.classList.remove('is-sobre'));
        marcarObjetivo(null);
        const z = ev.type === 'pointerup' && zonaEn(ev.clientX, ev.clientY);
        if (z) {
          const zona = z.dataset.zona;
          probar(p, zona, puntoSVG(zona, ev.clientX, ev.clientY));
        } else {
          estadoTxt.textContent = 'Elige una pieza de la bandeja.';
        }
        seleccion = null;
        lista.querySelectorAll('[data-prueba]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
      };
      window.addEventListener('pointermove', mover);
      window.addEventListener('pointerup', soltar);
      window.addEventListener('pointercancel', soltar);
    });

    // ---- Tap & Select (táctil, teclado y clic simple)
    lista.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-prueba]');
      if (!btn || suprimirClick) return;
      seleccionar(btn.dataset.prueba);
    });

    Object.keys(zonas).forEach((zona) => {
      const fig = zonas[zona];
      fig.querySelector('[data-objetivo]').addEventListener('click', (e) => {
        if (!seleccion) {
          // Sin selección: se vuelve a soltar la pieza puesta (o se pide elegir una).
          if (puesto[zona]) probar(puesto[zona], zona, e.detail ? puntoSVG(zona, e.clientX, e.clientY) : null);
          else estadoTxt.textContent = 'Primero elige una pieza de la bandeja.';
          return;
        }
        const p = TL.producto(seleccion);
        const punto = e.detail ? puntoSVG(zona, e.clientX, e.clientY) : null;
        if (probar(p, zona, punto)) {
          seleccion = null;
          lista.querySelectorAll('[data-prueba]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
          marcarObjetivo(null);
        }
      });
      fig.querySelector('[data-lienzo-quitar]').addEventListener('click', () => quitar(zona));
      fig.querySelector('[data-lienzo-anadir]').addEventListener('click', () => {
        const p = puesto[zona];
        if (!p) return;
        const origen = zona === 'cuello'
          ? fig.querySelector('[data-dije]')
          : fig.querySelector('[data-capa="pulsera-frente"] svg');
        TL.caja.agregar(TL.itemCaja(p), origen);
      });
    });

    root.querySelectorAll('[data-pestana]').forEach((b) => b.addEventListener('click', () => mostrarZona(b.dataset.pestana)));

    // Estado inicial de ejemplo: una pieza en cada silueta, ya asentada.
    probar(TL.producto('collar-cholula'), 'cuello', null, true);
    probar(TL.producto('pulsera-enredadera'), 'muneca', null, true);

    TL.probador = {
      probarProducto(id) {
        const p = TL.producto(id);
        if (!p) return;
        const zona = zonaDe(p);
        mostrarZona(zona);
        seleccion = null;
        marcarObjetivo(null);
        probar(p, zona, null);
      }
    };
  };
})(window.TL);
