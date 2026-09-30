/* Netlify · POST /api/mp-webhook: notificaciones de Mercado Pago. */
const { responderNotificacion } = require('../../server/pago.js');
const { json, leerJSON } = require('../../server/netlify-http.js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Usa POST.' });
  const r = await responderNotificacion({
    query: event.queryStringParameters || {},
    headers: event.headers || {},
    body: leerJSON(event) || {}
  });
  return json(r.status, r.cuerpo);
};
