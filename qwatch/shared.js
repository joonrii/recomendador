// shared.js — usado por las páginas de SEO de /qwatch/
// Carga en directo (vía el proxy de la app, sin exponer ninguna clave) las películas
// mejor valoradas realmente disponibles ahora mismo en la plataforma de cada página.

async function tmdbProxy(path, params) {
  const url = new URL('https://recomendador-ten.vercel.app/api/tmdb');
  url.searchParams.set('path', path);
  Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('proxy error ' + res.status);
  return res.json();
}

function posterUrl(path) {
  return path ? `https://image.tmdb.org/t/p/w300${path}` : '';
}

async function loadTopForProvider(nameVariants, containerId, region) {
  const container = document.getElementById(containerId);
  if (!container) return;
  try {
    const providerList = await tmdbProxy('/watch/providers/movie', { watch_region: region });
    const match = (providerList.results || []).find(p => nameVariants.includes(p.provider_name));
    if (!match) { container.innerHTML = '<p>No hemos podido cargar el listado en directo ahora mismo.</p>'; return; }

    const data = await tmdbProxy('/discover/movie', {
      watch_region: region,
      with_watch_providers: match.provider_id,
      watch_monetization_types: 'flatrate',
      sort_by: 'vote_average.desc',
      'vote_count.gte': 800,
      language: 'es-ES',
      page: 1
    });

    const items = (data.results || []).filter(m => m.poster_path).slice(0, 10);
    if (!items.length) { container.innerHTML = '<p>No hemos podido cargar el listado en directo ahora mismo.</p>'; return; }

    container.innerHTML = items.map((m, i) => `
      <li class="qw-item">
        <span class="qw-rank">${i + 1}</span>
        <img class="qw-poster" src="${posterUrl(m.poster_path)}" alt="Póster de ${m.title}" loading="lazy" width="60" height="90">
        <div class="qw-info">
          <span class="qw-title">${m.title}</span>
          <span class="qw-meta">★ ${m.vote_average ? m.vote_average.toFixed(1) : '—'} · ${(m.release_date || '').slice(0, 4)}</span>
        </div>
      </li>
    `).join('');
  } catch (e) {
    container.innerHTML = '<p>No hemos podido cargar el listado en directo ahora mismo. Puedes verlo directamente en la app.</p>';
  }
}
