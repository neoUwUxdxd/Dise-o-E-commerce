/* Engarce · carrito "Caja de madera".
   Al añadir: la tapa se abre, la ficha vuela y entra, la tapa se cierra y la caja tiembla. */
(function (TL) {
  'use strict';

  const estado = { items: [] };
  let caja, cuenta, dlg, lista, subtotal, vacio, pie, aviso;
  let cola = Promise.resolve();

  const valido = (it) => it && it.key && TL.design(it.design) && TL.shapes[it.shape] && it.qty > 0;
  const total = () => estado.items.reduce((n, it) => n + it.qty, 0);
  const guardar = () => TL.store.set('caja', estado.items);

  function actualizarCuenta(pop) {
    const n = total();
    cuenta.textContent = n;
    cuenta.dataset.n = n;
    caja.setAttribute('aria-label', `Abrir tu caja, ${n} ${n === 1 ? 'pieza' : 'piezas'}`);
    if (pop && n > 0) {
      cuenta.classList.remove('is-pop');
      void cuenta.offsetWidth;
      cuenta.classList.add('is-pop');
    }
  }

  function pintar() {
    const n = total();
    vacio.hidden = n > 0;
    pie.hidden = n === 0;
    lista.innerHTML = estado.items.map((it) =>
      `<li class="caja-item" data-key="${TL.esc(it.key)}">` +
        `<span class="caja-item__ficha">${TL.talavera.svg(it.design, it.shape)}</span>` +
        `<div class="caja-item__texto">` +
          `<p class="caja-item__nombre">${TL.esc(it.nombre)}</p>` +
          `<p class="caja-item__detalle">${TL.esc(it.detalle)}</p>` +
          `<div class="caja-item__cantidad">` +
            `<button type="button" data-accion="menos" aria-label="Quitar una: ${TL.esc(it.nombre)}">−</button>` +
            `<span>${it.qty}</span>` +
            `<button type="button" data-accion="mas" aria-label="Añadir una: ${TL.esc(it.nombre)}">+</button>` +
          `</div>` +
        `</div>` +
        `<div class="caja-item__lado">` +
          `<p class="caja-item__precio">${TL.precio(it.precio * it.qty)}</p>` +
          `<button type="button" class="enlace enlace--suave" data-accion="quitar">Quitar</button>` +
        `</div>` +
      `</li>`
    ).join('');
    subtotal.textContent = TL.precio(estado.items.reduce((s, it) => s + it.precio * it.qty, 0));
  }

  /* La ficha vuela en arco desde su origen hasta la boca de la caja. */
  function volar(item, origen) {
    const a = origen.getBoundingClientRect();
    const b = caja.getBoundingClientRect();
    if (!a.width && !a.height) return Promise.resolve();
    const lado = TL.clamp(a.width || 48, 30, 72);
    const x0 = a.left + a.width / 2 - lado / 2;
    const y0 = a.top + a.height / 2 - lado / 2;
    const el = document.createElement('div');
    el.className = 'volador';
    el.innerHTML = TL.talavera.svg(item.design, item.shape);
    el.style.cssText = `left:${x0}px;top:${y0}px;width:${lado}px;height:${lado}px`;
    document.body.appendChild(el);

    const tx = b.left + b.width / 2 - (x0 + lado / 2);
    const ty = b.top + b.height * 0.36 - (y0 + lado / 2);
    const alto = -Math.min(220, 90 + Math.abs(tx) * 0.22);
    const fin = 34 / lado;
    const frames = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const x = tx * t;
      const y = ty * t + alto * 4 * t * (1 - t);
      const s = 1 + (fin - 1) * t + 0.18 * Math.sin(Math.PI * t);
      const r = 420 * t;
      frames.push({
        transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${r.toFixed(1)}deg) scale(${s.toFixed(3)})`,
        opacity: t > 0.9 ? 1 - (t - 0.9) * 10 : 1,
        offset: t
      });
    }
    const anim = el.animate(frames, { duration: 760, easing: 'cubic-bezier(.45, .05, .3, 1)', fill: 'forwards' });
    return anim.finished.then(() => el.remove(), () => el.remove());
  }

  async function animar(item, origen) {
    if (TL.motion.reduce || !origen) { actualizarCuenta(true); return; }
    caja.classList.add('is-abierta');
    await TL.wait(180);
    await volar(item, origen);
    caja.classList.remove('is-abierta');
    TL.sonido.knock();
    await TL.wait(140);
    caja.classList.remove('is-temblando');
    void caja.offsetWidth;
    caja.classList.add('is-temblando');
    actualizarCuenta(true);
    setTimeout(() => caja.classList.remove('is-temblando'), 1000);
    await TL.wait(300);
  }

  function agregar(item, origen) {
    const key = item.key || item.id;
    const ex = estado.items.find((i) => i.key === key);
    if (ex) ex.qty = Math.min(9, ex.qty + 1);
    else estado.items.push({
      key, id: item.id, nombre: item.nombre, detalle: item.detalle, precio: item.precio,
      design: item.design, shape: item.shape, metal: item.metal, qty: 1
    });
    guardar();
    pintar();
    const n = total();
    TL.anunciar(`${item.nombre} se guardó en tu caja. Llevas ${n} ${n === 1 ? 'pieza' : 'piezas'}.`);
    cola = cola.then(() => animar(item, origen)).catch(() => actualizarCuenta(false));
  }

  function alClicLista(e) {
    const b = e.target.closest('[data-accion]');
    if (!b) return;
    const li = b.closest('[data-key]');
    const it = estado.items.find((i) => i.key === li.dataset.key);
    if (!it) return;
    const acc = b.dataset.accion;
    if (acc === 'mas') it.qty = Math.min(9, it.qty + 1);
    if (acc === 'menos') it.qty -= 1;
    if (acc === 'quitar') it.qty = 0;
    estado.items = estado.items.filter((i) => i.qty > 0);
    guardar();
    pintar();
    actualizarCuenta(false);
    aviso.hidden = true;
    if (acc === 'quitar' || it.qty === 0) {
      TL.anunciar(`${it.nombre} salió de tu caja.`);
      const primero = lista.querySelector('button') || dlg.querySelector('[data-cerrar]');
      if (primero) primero.focus();
    } else {
      const mismo = lista.querySelector(`[data-key="${CSS.escape(it.key)}"] [data-accion="${acc}"]`);
      if (mismo) mismo.focus();
    }
  }

  TL.caja = {
    init() {
      caja = document.querySelector('[data-caja]');
      dlg = document.querySelector('[data-panel-caja]');
      if (!caja || !dlg) return;
      cuenta = caja.querySelector('[data-caja-cuenta]');
      lista = dlg.querySelector('[data-caja-lista]');
      subtotal = dlg.querySelector('[data-caja-subtotal]');
      vacio = dlg.querySelector('[data-caja-vacio]');
      pie = dlg.querySelector('[data-caja-pie]');
      aviso = dlg.querySelector('[data-caja-aviso]');

      estado.items = (TL.store.get('caja', []) || []).filter(valido);

      caja.addEventListener('click', () => {
        pintar();
        aviso.hidden = true;
        TL.hoja.abrir(dlg);
      });
      lista.addEventListener('click', alClicLista);
      dlg.querySelector('[data-caja-pagar]').addEventListener('click', () => { aviso.hidden = false; });

      pintar();
      actualizarCuenta(false);
    },
    agregar
  };
})(window.TL);
