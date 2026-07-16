// api/tmdb.js
// Función serverless de Vercel: hace de intermediario entre la web y TMDB.
// La clave de API vive SOLO aquí (variable de entorno en el panel de Vercel),
// nunca llega al navegador del usuario.

module.exports = async (req, res) => {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'TMDB_API_KEY no configurada en Vercel (Settings → Environment Variables).' });
  }

  const { path, ...params } = req.query;
  if (!path) {
    return res.status(400).json({ error: 'Falta el parámetro "path".' });
  }

  const url = new URL('https://api.themoviedb.org/3' + path);
  url.searchParams.set('api_key', apiKey);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, value);
  });

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    let tmdbRes;
    try {
      tmdbRes = await fetch(url.toString(), { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
    const data = await tmdbRes.json();
    // pequeña cache en el borde de Vercel para aliviar peticiones repetidas
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(tmdbRes.status).json(data);
  } catch (e) {
    const timedOut = e.name === 'AbortError';
    return res.status(timedOut ? 504 : 502).json({ error: timedOut ? 'TMDB tardó demasiado en responder.' : 'No se ha podido contactar con TMDB.' });
  }
};
