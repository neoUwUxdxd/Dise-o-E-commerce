/* Engarce · catálogo colgante, filtros por patrón y detalle de producto
   con el widget "El viaje de la pieza". */
(function (TL) {
  'use strict';

  function tarjeta(p, i) {
    const fam = TL.families[p.family].label;
    const met = TL.metals[p.metal].label;
    return `<li class="producto" data-id="${p.id}" data-familia="${p.family}" data-tipo="${p.type}" style="--retraso:${(-i * 0.87).toFixed(2)}s">` +
      `<button class="producto__escena" type="button" data-abrir aria-label="Ver detalles de ${p.name}">${TL.pieza(p)}</button>` +
      `<div class="producto__info">` +
        `<p class="producto__patron">${fam} · ${met}</p>` +
        `<h3 class="producto__nombre">${p.name}</h3>` +
        `<div class="producto__pie">` +
          `<p class="producto__precio">${TL.precio(p.price)} <span>MXN</span></p>` +
          `<button class="producto__anadir" type="button" data-anadir>Añadir<span class="producto__anadir-mas"> a la caja</span><span class="sr-only">: ${p.name}</span></button>` +
        `</div>` +
      `</div></li>`;
  }

  const itemCaja = (p) => ({
    id: p.id,
    key: p.id,
    nombre: p.name,
    detalle: `${TL.design(p.design).name} · ${TL.shapes[p.shape].label} · ${TL.metals[p.metal].label}`,
    precio: p.price,
    design: p.design,
    shape: p.shape,
    metal: p.metal
  });

  TL.initCatalogo = function () {
    const muro = document.querySelector('[data-catalogo]');
    if (!muro) return;
    const conteo = document.querySelector('[data-conteo]');
    const vacio = document.querySelector('[data-catalogo-vacio]');
    const filtro = { patron: 'todos', tipo: 'todos' };

    muro.innerHTML = TL.products.map(tarjeta).join('');
    const tarjetas = Array.from(muro.children);

    document.querySelectorAll('[data-chip-ficha]').forEach((el) => {
      el.innerHTML = TL.talavera.svg(el.dataset.chipFicha, 'square');
    });

    // En móvil los chips se deslizan: el borde se desvanece mientras quede algo por ver.
    document.querySelectorAll('.filtros__chips').forEach((fila) => {
      const revisar = () => fila.classList.toggle('is-final', fila.scrollLeft + fila.clientWidth >= fila.scrollWidth - 4);
      fila.addEventListener('scroll', revisar, { passive: true });
      window.addEventListener('resize', revisar, { passive: true });
      revisar();
    });

    // ---- Filtros
    let token = 0;
    const coincide = (c) =>
      (filtro.patron === 'todos' || c.dataset.familia === filtro.patron) &&
      (filtro.tipo === 'todos' || c.dataset.tipo === filtro.tipo);

    function aplicar() {
      const mio = ++token;
      const n = tarjetas.filter(coincide).length;
      conteo.textContent = n === 1 ? '1 pieza' : `${n} piezas`;
      vacio.hidden = n > 0;
      // Un filtro anterior pudo quedar a medias: lo que vuelve a coincidir no debe quedar oculto.
      tarjetas.forEach((c) => { if (coincide(c)) c.classList.remove('is-descolgando'); });
      const salen = tarjetas.filter((c) => !c.hidden && !coincide(c));
      const entran = tarjetas.filter((c) => c.hidden && coincide(c));

      if (TL.motion.reduce) {
        tarjetas.forEach((c) => { c.hidden = !coincide(c); });
        return;
      }
      salen.forEach((c) => c.classList.add('is-descolgando'));
      setTimeout(() => {
        if (mio !== token) return;
        salen.forEach((c) => { c.hidden = true; c.classList.remove('is-descolgando'); });
        entran.forEach((c, i) => {
          c.hidden = false;
          c.style.setProperty('--orden', i);
          c.classList.remove('is-colgando');
          void c.offsetWidth;
          c.classList.add('is-colgando');
          setTimeout(() => c.classList.remove('is-colgando'), 1300 + i * 80);
        });
      }, salen.length ? 300 : 0);
    }

    // ---- Orden: se reordena el muro y las piezas visibles se vuelven a colgar
    const selOrden = document.querySelector('[data-orden]');
    const criterios = {
      destacadas: null,
      'precio-asc': (a, b) => TL.producto(a.dataset.id).price - TL.producto(b.dataset.id).price,
      'precio-desc': (a, b) => TL.producto(b.dataset.id).price - TL.producto(a.dataset.id).price
    };
    if (selOrden) selOrden.addEventListener('change', () => {
      const fn = criterios[selOrden.value];
      const orden = fn ? tarjetas.slice().sort(fn) : tarjetas;
      orden.forEach((c) => muro.appendChild(c));
      TL.anunciar(`Piezas ordenadas: ${selOrden.selectedOptions[0].textContent.toLowerCase()}.`);
      if (TL.motion.reduce) return;
      orden.filter((c) => !c.hidden).forEach((c, i) => {
        c.style.setProperty('--orden', i);
        c.classList.remove('is-colgando');
        void c.offsetWidth;
        c.classList.add('is-colgando');
        setTimeout(() => c.classList.remove('is-colgando'), 1300 + i * 80);
      });
    });

    document.querySelectorAll('[data-filtro]').forEach((grupo) => {
      grupo.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-valor]');
        if (!b || b.getAttribute('aria-pressed') === 'true') return;
        grupo.querySelectorAll('button[data-valor]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        filtro[grupo.dataset.filtro] = b.dataset.valor;
        aplicar();
      });
    });

    // ---- Despiece al pasar el cursor, o al entrar en pantalla en táctil
    muro.addEventListener('pointerover', (e) => {
      if (e.pointerType !== 'mouse') return;
      const esc = e.target.closest('.producto__escena');
      if (!esc || esc.contains(e.relatedTarget)) return;
      TL.desarmar(esc.closest('.producto'));
    });
    muro.addEventListener('focusin', (e) => {
      if (e.target.matches('.producto__escena:focus-visible')) TL.desarmar(e.target.closest('.producto'));
    });
    if (!TL.punteroFino && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((en) => {
        en.forEach((x) => {
          if (!x.isIntersecting) return;
          io.unobserve(x.target);
          setTimeout(() => TL.desarmar(x.target), 250);
        });
      }, { threshold: 0.7 });
      tarjetas.forEach((c) => io.observe(c));
    }

    // ---- Añadir y abrir detalle
    muro.addEventListener('click', (e) => {
      const li = e.target.closest('.producto');
      if (!li) return;
      const p = TL.producto(li.dataset.id);
      if (e.target.closest('[data-anadir]')) {
        TL.caja.agregar(itemCaja(p), li.querySelector('.ficha-slot .ficha'));
        return;
      }
      // El nombre también abre el detalle (con ratón; con teclado se usa la escena).
      if (e.target.closest('[data-abrir], .producto__nombre')) abrirDetalle(p);
    });
  };

  // ---- Detalle de producto
  function abrirDetalle(p) {
    const dlg = document.querySelector('[data-detalle]');
    if (!dlg) return;
    const $ = (s) => dlg.querySelector(s);
    const d = TL.design(p.design);
    const escena = $('[data-detalle-escena]');
    escena.innerHTML = TL.pieza(p);
    $('[data-detalle-patron]').textContent = `Patrón ${TL.families[p.family].label} · ${d.name}`;
    $('[data-detalle-nombre]').textContent = p.name;
    $('[data-detalle-precio]').textContent = `${TL.precio(p.price)} MXN`;
    $('[data-detalle-desc]').textContent = p.desc;
    $('[data-detalle-specs]').innerHTML =
      `<dt>Ficha</dt><dd>Talavera certificada, ${TL.shapes[p.shape].label.toLowerCase()}, ${p.ficha}${p.fichas > 1 ? ` · ${p.fichas} piezas` : ''}</dd>` +
      `<dt>Montaje</dt><dd>${TL.metals[p.metal].label} · ${p.medida}</dd>` +
      `<dt>Hecho por</dt><dd>Taller aliado (talavera) y Engarce (diseño y ensamble)</dd>`;

    const viaje = $('[data-viaje]');
    $('[data-viaje-puntos]').innerHTML = TL.viaje(p).map((v, i) =>
      `<li class="viaje__punto" style="--i:${i}">` +
        `<span class="viaje__nodo">${i + 1}</span>` +
        `<span class="viaje__etapa">${v.etapa}</span>` +
        `<span class="viaje__lugar">${v.lugar}</span>` +
        `<span class="viaje__nota">${v.nota}</span>` +
      `</li>`
    ).join('');
    viaje.classList.remove('is-trazando');

    // Otras piezas del mismo patrón
    const afines = TL.products.filter((x) => x.family === p.family && x.id !== p.id);
    $('[data-afines]').hidden = afines.length === 0;
    $('[data-afines-titulo]').textContent = `Más del patrón ${TL.families[p.family].label}`;
    $('[data-afines-lista]').innerHTML = afines.map((x) =>
      `<li><button class="afin" type="button" data-afin="${x.id}">` +
        `<span class="afin__ficha">${TL.talavera.svg(x.design, x.shape)}</span>` +
        `<span class="afin__texto"><span class="afin__nombre">${x.name}</span>` +
        `<span class="afin__precio">${TL.precio(x.price)}</span></span>` +
      `</button></li>`
    ).join('');
    $('[data-afines-lista]').onclick = (e) => {
      const b = e.target.closest('[data-afin]');
      if (!b) return;
      abrirDetalle(TL.producto(b.dataset.afin));
      dlg.querySelectorAll('.hoja__cuerpo, .detalle__info').forEach((el) => { el.scrollTop = 0; });
      $('[data-detalle-nombre]').focus({ preventScroll: true });
    };

    $('[data-detalle-anadir]').onclick = () => TL.caja.agregar(itemCaja(p), escena.querySelector('.ficha-slot .ficha'));
    $('[data-detalle-probar]').onclick = () => {
      TL.hoja.cerrar(dlg);
      const destino = document.getElementById('probador');
      if (destino) destino.scrollIntoView({ behavior: TL.motion.reduce ? 'auto' : 'smooth', block: 'start' });
      setTimeout(() => TL.probador && TL.probador.probarProducto(p.id), TL.motion.reduce ? 50 : 750);
    };
    escena.onpointerenter = (e) => { if (e.pointerType === 'mouse') TL.desarmar(escena); };
    escena.onclick = () => TL.desarmar(escena);

    TL.hoja.abrir(dlg);
    requestAnimationFrame(() => {
      void viaje.offsetWidth;
      viaje.classList.add('is-trazando');
    });
    setTimeout(() => TL.desarmar(escena), 450);
  }

  TL.abrirDetalle = abrirDetalle;
  TL.itemCaja = itemCaja;
})(window.TL);
