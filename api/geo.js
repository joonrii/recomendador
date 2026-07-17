// api/geo.js
// Devuelve el país del visitante, detectado automáticamente por la red de Vercel
// a partir de su IP (sin pedir permiso de ubicación ni usar servicios externos).

module.exports = (req, res) => {
  const country = req.headers['x-vercel-ip-country'] || null;
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ country });
};
