/* Utilidades HTTP de las funciones de Netlify (netlify/functions/). */
const MAX_BYTES = 20000;

exports.json = (status, cuerpo) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  body: JSON.stringify(cuerpo)
});

exports.leerJSON = (event) => {
  let raw = event.body || '';
  if (event.isBase64Encoded) raw = Buffer.from(raw, 'base64').toString('utf8');
  if (!raw || raw.length > MAX_BYTES) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
};
