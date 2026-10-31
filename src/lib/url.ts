/** Rutas internas respetando el `base` de GitHub Pages (/arcos/). */
export function url(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.replace(/^\//, '');
  return clean ? `${base}/${clean}` : `${base}/`;
}

export const sagaUrl = (sagaId: string) => url(`series/${sagaId}/`);
export const characterUrl = (sagaId: string, characterId: string) =>
  url(`series/${sagaId}/personajes/${characterId}/`);
