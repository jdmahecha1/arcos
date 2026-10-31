import art from '../content/art.json';

/**
 * Portadas y fondos oficiales (AniList) y retratos del anime (pines de Pinterest elegidos
 * a mano), a resolución reducida. Se usan sin fines comerciales y con crédito en /creditos/.
 * Los genera `npm run art` + `npm run images`.
 */
export interface Cover {
  seasonId: string;
  /** Título de la ficha en AniList y su página (fuente del crédito). */
  title: string;
  page: string;
  width: number;
  height: number;
}

export interface ArtSource {
  /** Página de origen de la imagen. */
  page: string;
}

/** Titulares de los derechos de cada serie, para el crédito. */
export const OWNERS: Record<string, string> = {
  'kimetsu-no-yaiba': 'Koyoharu Gotouge, Shueisha, Aniplex y ufotable',
  'attack-on-titan': 'Hajime Isayama, Kodansha, Wit Studio y MAPPA',
  'jujutsu-kaisen': 'Gege Akutami, Shueisha y MAPPA',
  'black-clover': 'Yūki Tabata, Shueisha y Studio Pierrot',
  'kaiju-n8': 'Naoya Matsumoto, Shueisha y Production I.G',
};

/** La portada de la primera temporada representa a la serie: nunca adelanta nada. */
export const SAGA_COVER: Record<string, string> = {
  'kimetsu-no-yaiba': 'ky-t1',
  'attack-on-titan': 'aot-t1',
  'jujutsu-kaisen': 'jjk-t1',
  'black-clover': 'bc-t1',
  'kaiju-n8': 'k8-t1',
};

const ART = art as {
  covers: Record<string, Omit<Cover, 'seasonId'>>;
  backdrops: Record<string, { title: string; page: string }>;
  portraits: Record<string, ArtSource>;
};

export function coverFor(seasonId: string): Cover | undefined {
  const c = ART.covers[seasonId];
  return c && { seasonId, ...c };
}

export function sagaCover(sagaId: string): Cover | undefined {
  const seasonId = SAGA_COVER[sagaId];
  return seasonId ? coverFor(seasonId) : undefined;
}

export function coverSrc(seasonId: string): string {
  return `img/portadas/${seasonId}.webp`;
}

/** Las portadas apaisadas no se recortan: se muestran completas. */
export function isLandscape(cover: Cover): boolean {
  return cover.width / cover.height > 0.85;
}

export const portraitKey = (sagaId: string, characterId: string) => `${sagaId}--${characterId}`;

export function portraitFor(sagaId: string, characterId: string): ArtSource | undefined {
  return ART.portraits[portraitKey(sagaId, characterId)];
}

/** Retrato cuadrado (128 o 256 px de lado), o nada si el personaje no tiene. */
export function portraitSrc(sagaId: string, characterId: string, side: 128 | 256 = 128): string | undefined {
  return portraitFor(sagaId, characterId) ? `img/personajes/${portraitKey(sagaId, characterId)}-${side}.webp` : undefined;
}

export function landscapeFor(sagaId: string): { title: string; page: string } | undefined {
  return ART.backdrops[sagaId];
}

export function landscapeSrc(sagaId: string, width: 960 | 1920): string {
  return `img/fondos/${sagaId}-${width}.webp`;
}
