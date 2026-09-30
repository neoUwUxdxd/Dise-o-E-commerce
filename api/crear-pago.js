/* Vercel · POST /api/crear-pago. La lógica está en server/pago.js. */
const { responderCrearPago } = require('../server/pago.js');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Usa POST.' });
  const body = req.body && typeof req.body === 'object' ? req.body : null;
  if (!body) return res.status(400).json({ error: 'La petición no es válida.' });
  const r = await responderCrearPago(body, req.headers);
  return res.status(r.status).json(r.cuerpo);
};
