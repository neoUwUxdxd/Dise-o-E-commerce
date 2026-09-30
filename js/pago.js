/* Engarce · envío y pago con Mercado Pago (Checkout Pro).
   El formulario pide contacto y dirección; /api/crear-pago recalcula el total con el catálogo
   y devuelve la dirección del pago en Mercado Pago. Al volver (?pago=aprobado|pendiente|rechazado)
   se muestra el resultado. Si el servidor no existe (sitio estático, prototipo) se avisa y no se cobra. */
(function (TL) {
  'use strict';

  const ENDPOINT = 'api/crear-pago';

  let dlg, titulo, vistaCaja, form, btnPagar, txtPagar, error;
  let enviando = false;

  /* Total calculado con los mismos precios que usa el servidor (js/data.js). */
  function cuentas() {
    const items = TL.caja.items();
    const subtotal = items.reduce((s, it) => {
      const l = TL.lineaPedido(it.key);
      return s + (l ? l.precio : it.precio) * it.qty;
    }, 0);
    const envio = TL.costoEnvio(subtotal);
    return { items, subtotal, envio, total: subtotal + envio };
  }

  function pintarCuentas() {
    const c = cuentas();
    form.querySelector('[data-checkout-subtotal]').textContent = TL.precio(c.subtotal);
    form.querySelector('[data-checkout-envio]').textContent = c.envio ? TL.precio(c.envio) : 'Gratis';
    form.querySelector('[data-checkout-total]').textContent = `${TL.precio(c.total)} MXN`;
    if (!enviando) txtPagar.textContent = `Pagar ${TL.precio(c.total)} con Mercado Pago`;
    return c;
  }

  function verCaja() {
    if (!form) return;
    form.hidden = true;
    vistaCaja.hidden = false;
    titulo.textContent = 'Tu caja';
  }

  function verCheckout() {
    if (!form || TL.caja.items().length === 0) return;
    vistaCaja.hidden = true;
    form.hidden = false;
    titulo.textContent = 'Envío y pago';
    error.hidden = true;
    pintarCuentas();
    const cuerpo = dlg.querySelector('.hoja__cuerpo');
    if (cuerpo) cuerpo.scrollTop = 0;
    const primero = Array.from(form.elements).find((el) => el.name && !el.value);
    (primero || form.querySelector('[data-checkout-volver]')).focus({ preventScroll: true });
  }

  /* ---- Validación: los mismos criterios que server/pago.js */
  const reglas = {
    nombre: (v) => v.trim().replace(/\s+/g, ' ').length >= 3,
    correo: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
    telefono: (v) => v.replace(/\D/g, '').slice(-10).length === 10,
    cp: (v) => /^\d{5}$/.test(v.trim()),
    estado: (v) => TL.estados.includes(v),
    ciudad: (v) => v.trim().length >= 2,
    colonia: (v) => v.trim().length >= 2,
    calle: (v) => v.trim().length >= 2,
    numero: (v) => v.trim().length >= 1
  };

  function revisar(campo) {
    const regla = reglas[campo.name];
    if (!regla) return true;
    const ok = regla(campo.value);
    campo.setAttribute('aria-invalid', String(!ok));
    campo.closest('.campo').classList.toggle('is-error', !ok);
    return ok;
  }

  const datos = () => Object.fromEntries(
    Array.from(form.elements).filter((el) => el.name).map((el) => [el.name, el.value.trim()])
  );

  function mostrarError(msg) {
    error.textContent = msg;
    error.hidden = false;
  }

  function ocupado(si) {
    enviando = si;
    btnPagar.disabled = si;
    btnPagar.classList.toggle('is-cargando', si);
    if (si) txtPagar.textContent = 'Conectando con Mercado Pago…';
    else pintarCuentas();
  }

  async function pagar(e) {
    e.preventDefault();
    if (enviando) return;
    error.hidden = true;
    const campos = Array.from(form.elements).filter((el) => reglas[el.name]);
    const malos = campos.filter((el) => !revisar(el));
    if (malos.length) {
      malos[0].focus();
      mostrarError(malos.length === 1 ? 'Revisa el campo marcado.' : `Revisa los ${malos.length} campos marcados.`);
      return;
    }

    const c = cuentas();
    if (!c.items.length) { verCaja(); return; }
    ocupado(true);
    try {
      const r = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: c.items.map((it) => ({ key: it.key, qty: it.qty })), comprador: datos() })
      });
      const cuerpo = await r.json().catch(() => null);
      if (r.ok && cuerpo && cuerpo.url) {
        TL.store.set('pedido', { folio: cuerpo.folio, total: cuerpo.total, fecha: Date.now() });
        txtPagar.textContent = 'Te llevamos a Mercado Pago…';
        window.location.assign(cuerpo.url);
        return;
      }
      // Sin servidor (sitio estático o prototipo) o sin credenciales: no se cobra nada.
      if (!cuerpo || r.status === 404 || r.status === 405 || (cuerpo && cuerpo.codigo === 'sin-configurar')) {
        mostrarError('La pasarela todavía no está conectada en esta versión de la tienda, así que no se hizo ningún cargo. En la tienda publicada, este botón te lleva a pagar a Mercado Pago.');
      } else {
        mostrarError(cuerpo.error || 'No pudimos crear el pago. Intenta de nuevo.');
      }
    } catch (err) {
      mostrarError('No hay conexión con la pasarela de pago. Revisa tu internet e intenta de nuevo; no se hizo ningún cargo.');
    }
    ocupado(false);
  }

  /* ---- Borrador del formulario: solo en este navegador, para no reescribir la dirección */
  const recordar = () => TL.store.set('checkout', datos());
  function restaurar() {
    const d = TL.store.get('checkout', null);
    if (!d || typeof d !== 'object') return;
    Array.from(form.elements).forEach((el) => {
      if (el.name && typeof d[el.name] === 'string') el.value = d[el.name];
    });
  }

  /* ---- Regreso desde Mercado Pago */
  const MENSAJES = {
    aprobado: {
      titulo: 'Pago aprobado',
      texto: 'Gracias. Tu pedido está confirmado y te llega un correo de Mercado Pago con el comprobante. Te escribimos cuando la pieza salga del banco de ensamble.',
      accion: 'Seguir viendo'
    },
    pendiente: {
      titulo: 'Pago pendiente',
      texto: 'Si elegiste OXXO o transferencia SPEI, completa el pago con la referencia que te dio Mercado Pago. Ensamblamos y enviamos tu pedido en cuanto se acredite.',
      accion: 'Entendido'
    },
    rechazado: {
      titulo: 'No se completó el pago',
      texto: 'No se hizo ningún cargo y tu caja sigue igual. Puedes intentarlo de nuevo con otra tarjeta o con otro medio de pago.',
      accion: 'Volver a la caja'
    }
  };

  function alVolver() {
    const q = new URLSearchParams(window.location.search);
    const estado = q.get('pago');
    if (!MENSAJES[estado]) return;
    const res = document.querySelector('[data-resultado]');
    if (!res) return;

    const guardado = TL.store.get('pedido', null);
    const folio = q.get('external_reference') || (guardado && guardado.folio) || '';
    const m = MENSAJES[estado];
    res.querySelector('[data-resultado-estado]').dataset.resultadoEstado = estado;
    res.querySelector('[data-resultado-folio]').textContent = folio ? `Pedido ${folio}` : '';
    res.querySelector('[data-resultado-titulo]').textContent = m.titulo;
    res.querySelector('[data-resultado-texto]').textContent = m.texto;
    const accion = res.querySelector('[data-resultado-accion]');
    accion.textContent = m.accion;
    accion.onclick = () => {
      TL.hoja.cerrar(res);
      if (estado === 'rechazado') setTimeout(() => document.querySelector('[data-caja]').click(), TL.motion.reduce ? 20 : 360);
    };

    // Aprobado o pendiente: el pedido ya existe en Mercado Pago, la caja se vacía para no pagarlo dos veces.
    if (estado !== 'rechazado') {
      TL.caja.vaciar();
      TL.store.set('pedido', null);
    }
    history.replaceState(null, '', window.location.pathname + window.location.hash);
    TL.hoja.abrir(res);
    TL.anunciar(m.titulo);
  }

  TL.pago = {
    init() {
      dlg = document.querySelector('[data-panel-caja]');
      form = dlg && dlg.querySelector('[data-checkout]');
      if (form) {
        titulo = dlg.querySelector('#caja-titulo');
        vistaCaja = dlg.querySelector('[data-vista-caja]');
        btnPagar = form.querySelector('[data-checkout-pagar]');
        txtPagar = form.querySelector('[data-checkout-pagar-texto]');
        error = form.querySelector('[data-checkout-error]');

        form.querySelector('[data-checkout-estados]').insertAdjacentHTML('beforeend',
          TL.estados.map((e) => `<option value="${TL.esc(e)}">${TL.esc(e)}</option>`).join(''));
        restaurar();

        form.addEventListener('submit', pagar);
        form.querySelector('[data-checkout-volver]').addEventListener('click', () => {
          verCaja();
          const b = dlg.querySelector('[data-caja-pagar]');
          if (b && !b.closest('[hidden]')) b.focus();
        });
        // Un campo marcado se revisa de nuevo mientras se corrige; el resto, al salir de él.
        form.addEventListener('input', (e) => {
          if (e.target.getAttribute('aria-invalid') === 'true') revisar(e.target);
          recordar();
        });
        form.addEventListener('change', recordar);
        form.addEventListener('focusout', (e) => { if (e.target.value) revisar(e.target); });
        dlg.addEventListener('close', verCaja);
      }
      alVolver();
    },
    verCaja,
    verCheckout,
    alCambiarCaja() {
      if (!form || form.hidden) return;
      if (TL.caja.items().length === 0) verCaja();
      else pintarCuentas();
    }
  };

  TL.initPago = TL.pago.init;
})(window.TL);
