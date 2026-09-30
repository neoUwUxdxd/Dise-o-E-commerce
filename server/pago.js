/* Engarce · pagos con Mercado Pago (Checkout Pro).
   Lógica independiente del hosting: los adaptadores de netlify/functions/ y api/ solo traducen
   la petición y la respuesta. Sin dependencias: usa la API REST de Mercado Pago con fetch (Node 18+).

   Variables de entorno:
     MP_ACCESS_TOKEN   Access token de Mercado Pago (de prueba o de producción). Obligatoria.
     MP_WEBHOOK_SECRET Clave secreta de las notificaciones (webhooks). Recomendada.
     SITIO_URL         URL pública de la tienda, p. ej. https://engarce.mx (sin / final).
                       Si falta, se usa el host de la petición. */
'use strict';

const crypto = require('crypto');
const TL = require('../js/data.js');

const API = 'https://api.mercadopago.com';
const MAX_POR_LINEA = 9;
const MAX_LINEAS = 30;

class ErrorPedido extends Error {
  constructor(mensaje, status = 400, codigo = 'pedido-invalido') {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
  }
}

const texto = (v, max) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '');

/* Revisa los datos del comprador. Los mismos criterios que el formulario (js/pago.js). */
function validarComprador(c = {}) {
  const d = {
    nombre: texto(c.nombre, 80),
    correo: texto(c.correo, 120).toLowerCase(),
    telefono: String(c.telefono || '').replace(/\D/g, '').slice(-10),
    cp: String(c.cp || '').replace(/\D/g, ''),
    estado: texto(c.estado, 40),
    ciudad: texto(c.ciudad, 80),
    colonia: texto(c.colonia, 80),
    calle: texto(c.calle, 120),
    numero: texto(c.numero, 30),
    referencias: texto(c.referencias, 200)
  };
  const faltan = [];
  if (d.nombre.length < 3) faltan.push('nombre');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.correo)) faltan.push('correo');
  if (d.telefono.length !== 10) faltan.push('telefono');
  if (!/^\d{5}$/.test(d.cp)) faltan.push('cp');
  if (!TL.estados.includes(d.estado)) faltan.push('estado');
  if (d.ciudad.length < 2) faltan.push('ciudad');
  if (d.colonia.length < 2) faltan.push('colonia');
  if (d.calle.length < 2) faltan.push('calle');
  if (!d.numero) faltan.push('numero');
  if (faltan.length) throw new ErrorPedido(`Revisa estos datos: ${faltan.join(', ')}.`, 422, 'datos-incompletos');
  return d;
}

/* Arma el pedido con los precios del catálogo. Del navegador solo se toman las claves y cantidades. */
function armarPedido(body = {}) {
  if (!Array.isArray(body.items) || body.items.length === 0) throw new ErrorPedido('La caja está vacía.');
  if (body.items.length > MAX_LINEAS) throw new ErrorPedido('Hay demasiadas piezas distintas en la caja.');

  const vistas = new Set();
  const lineas = body.items.map((it) => {
    const key = texto(it && it.key, 80);
    const qty = Number(it && it.qty);
    const linea = TL.lineaPedido(key);
    if (!linea) throw new ErrorPedido(`Una pieza de tu caja ya no está en el catálogo (${key || 'sin clave'}).`, 409, 'pieza-desconocida');
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_POR_LINEA) throw new ErrorPedido('La cantidad de una pieza no es válida.');
    if (vistas.has(key)) throw new ErrorPedido('Hay una pieza repetida en la caja.');
    vistas.add(key);
    return { key, qty, ...linea };
  });

  const subtotal = lineas.reduce((s, l) => s + l.precio * l.qty, 0);
  const envio = TL.costoEnvio(subtotal);
  return { lineas, subtotal, envio, total: subtotal + envio, comprador: validarComprador(body.comprador) };
}

const nuevoFolio = () =>
  'EG-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(2).toString('hex').toUpperCase();

async function llamarMP(ruta, token, opciones = {}) {
  const r = await fetch(API + ruta, {
    ...opciones,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(opciones.headers || {}) }
  });
  const datos = await r.json().catch(() => ({}));
  if (!r.ok) {
    console.error('[pago] Mercado Pago respondió', r.status, JSON.stringify(datos));
    throw new ErrorPedido('Mercado Pago no pudo crear el pago. Intenta de nuevo en un momento.', 502, 'mp-error');
  }
  return datos;
}

/* POST /api/crear-pago → { url, folio, total } */
async function crearPago(body, { token, sitio }) {
  if (!token) throw new ErrorPedido('La pasarela de pago no está configurada.', 503, 'sin-configurar');
  const pedido = armarPedido(body);
  const c = pedido.comprador;
  const folio = nuevoFolio();
  const [nombre, ...apellidos] = c.nombre.split(' ');
  const https = /^https:\/\//.test(sitio);
  const volver = (estado) => `${sitio}/?pago=${estado}`;

  const preferencia = {
    items: pedido.lineas.map((l) => ({
      id: l.key,
      title: l.titulo,
      description: l.detalle,
      quantity: l.qty,
      unit_price: l.precio,
      currency_id: 'MXN',
      category_id: 'fashion'
    })),
    payer: {
      name: nombre,
      surname: apellidos.join(' '),
      email: c.correo,
      phone: { area_code: '52', number: c.telefono },
      address: { zip_code: c.cp, street_name: c.calle, street_number: c.numero }
    },
    shipments: {
      mode: 'not_specified',
      cost: pedido.envio,
      receiver_address: {
        zip_code: c.cp,
        street_name: `${c.calle}, ${c.colonia}`,
        street_number: c.numero,
        city_name: c.ciudad,
        state_name: c.estado
      }
    },
    back_urls: { success: volver('aprobado'), pending: volver('pendiente'), failure: volver('rechazado') },
    external_reference: folio,
    statement_descriptor: 'ENGARCE',
    metadata: { folio, referencias: c.referencias, colonia: c.colonia }
  };
  // Mercado Pago solo acepta regreso automático y notificaciones hacia direcciones https públicas.
  if (https) {
    preferencia.auto_return = 'approved';
    preferencia.notification_url = `${sitio}/api/mp-webhook`;
  }

  const pref = await llamarMP('/checkout/preferences', token, {
    method: 'POST',
    headers: { 'X-Idempotency-Key': folio },
    body: JSON.stringify(preferencia)
  });
  console.log('[pago] preferencia creada', folio, pref.id, 'total', pedido.total);
  return { url: pref.init_point, folio, total: pedido.total };
}

/* Comprueba la firma x-signature de una notificación de Mercado Pago. */
function firmaValida({ secreto, firma, requestId, dataId }) {
  if (!secreto || !firma) return false;
  const partes = Object.fromEntries(String(firma).split(',').map((p) => p.trim().split('=')));
  if (!partes.ts || !partes.v1) return false;
  let manifiesto = '';
  if (dataId) manifiesto += `id:${String(dataId).toLowerCase()};`;
  if (requestId) manifiesto += `request-id:${requestId};`;
  manifiesto += `ts:${partes.ts};`;
  const esperada = crypto.createHmac('sha256', secreto).update(manifiesto).digest('hex');
  const a = Buffer.from(esperada);
  const b = Buffer.from(String(partes.v1));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* POST /api/mp-webhook. Mercado Pago avisa de un pago; se consulta a la API para saber su estado real.
   PENDIENTE: guardar el pedido y avisar al taller (base de datos, correo o la herramienta que usen). */
async function recibirNotificacion({ query = {}, headers = {}, body = {} }, { token, secreto }) {
  const tipo = query.type || query.topic || body.type;
  const dataId = query['data.id'] || (body.data && body.data.id);
  if (tipo !== 'payment' || !dataId) return { status: 200, cuerpo: { ignorado: true } };

  if (secreto && !firmaValida({ secreto, firma: headers['x-signature'], requestId: headers['x-request-id'], dataId })) {
    console.warn('[pago] notificación con firma inválida', dataId);
    return { status: 401, cuerpo: { error: 'firma inválida' } };
  }
  if (!token) return { status: 503, cuerpo: { error: 'sin configurar' } };

  const pago = await llamarMP(`/v1/payments/${encodeURIComponent(dataId)}`, token);
  console.log('[pago] notificación', JSON.stringify({
    folio: pago.external_reference,
    pago: pago.id,
    estado: pago.status,
    detalle: pago.status_detail,
    metodo: pago.payment_method_id,
    total: pago.transaction_amount
  }));
  return { status: 200, cuerpo: { recibido: true } };
}

/* Adaptadores comunes */
const sitioDe = (headers = {}) => {
  if (process.env.SITIO_URL) return process.env.SITIO_URL.replace(/\/+$/, '');
  const host = headers['x-forwarded-host'] || headers.host || 'localhost';
  const proto = headers['x-forwarded-proto'] || (/^localhost|^127\./.test(host) ? 'http' : 'https');
  return `${proto}://${host}`;
};

async function responderCrearPago(body, headers) {
  try {
    const r = await crearPago(body, { token: process.env.MP_ACCESS_TOKEN, sitio: sitioDe(headers) });
    return { status: 200, cuerpo: r };
  } catch (e) {
    if (e instanceof ErrorPedido) return { status: e.status, cuerpo: { error: e.message, codigo: e.codigo } };
    console.error('[pago] error inesperado', e);
    return { status: 500, cuerpo: { error: 'No pudimos crear el pago. Intenta de nuevo.', codigo: 'error' } };
  }
}

async function responderNotificacion(peticion) {
  try {
    return await recibirNotificacion(peticion, { token: process.env.MP_ACCESS_TOKEN, secreto: process.env.MP_WEBHOOK_SECRET });
  } catch (e) {
    console.error('[pago] error al procesar notificación', e);
    return { status: 500, cuerpo: { error: 'error' } };
  }
}

module.exports = { armarPedido, crearPago, firmaValida, recibirNotificacion, responderCrearPago, responderNotificacion, ErrorPedido };
