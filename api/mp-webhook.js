/* Vercel · POST /api/mp-webhook: notificaciones de Mercado Pago. */
const { responderNotificacion } = require('../server/pago.js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Usa POST.' });
  const r = await responderNotificacion({
    query: req.query || {},
    headers: req.headers || {},
    body: req.body && typeof req.body === 'object' ? req.body : {}
  });
  return res.status(r.status).json(r.cuerpo);
};
