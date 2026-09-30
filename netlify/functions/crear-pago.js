/* Netlify · POST /api/crear-pago (redirección en netlify.toml). La lógica está en server/pago.js. */
const { responderCrearPago } = require('../../server/pago.js');
const { json, leerJSON } = require('../../server/netlify-http.js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Usa POST.' });
  const body = leerJSON(event);
  if (!body) return json(400, { error: 'La petición no es válida.' });
  const r = await responderCrearPago(body, event.headers);
  return json(r.status, r.cuerpo);
};
