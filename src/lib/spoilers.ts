import type { SeasonFormat } from './kinds';
import type { Character, LoreEvent, Marker, Relation, Saga, Season } from './schema';

export const FORMAT_LABEL: Record<SeasonFormat, string> = {
  anime: 'Anime',
  pelicula: 'Película',
  manga: 'Manga',
};

/**
 * Progreso del espectador en una serie: por cada entrega, cuántos arcos ha terminado
 * (0 = sin ver, arcs.length = entrega terminada).
 */
export type SagaProgress = Record<string, number>;

export interface Shield {
  /** Con el escudo apagado se muestra todo. */
  enabled: boolean;
  progress: SagaProgress;
}

const characterIndex = new WeakMap<Saga, Map<string, Character>>();

export function charactersById(saga: Saga): Map<string, Character> {
  let index = characterIndex.get(saga);
  if (!index) {
    index = new Map(saga.characters.map((c) => [c.id, c]));
    characterIndex.set(saga, index);
  }
  return index;
}

/** Un dato descubierto durante el arco N es visible cuando el espectador terminó ese arco. */
export function isRevealed(marker: Marker | undefined, shield: Shield): boolean {
  if (!shield.enabled || !marker) return true;
  return (shield.progress[marker.season] ?? 0) > marker.arc;
}

export function isCharacterKnown(character: Character, shield: Shield): boolean {
  return isRevealed(character.appears, shield);
}

/** Una relación solo se muestra si se conocen la relación y los dos personajes. */
export function isRelationVisible(relation: Relation, saga: Saga, shield: Shield): boolean {
  if (!isRevealed(relation.at, shield)) return false;
  const byId = charactersById(saga);
  const from = byId.get(relation.from);
  const to = byId.get(relation.to);
  return !!from && !!to && isCharacterKnown(from, shield) && isCharacterKnown(to, shield);
}

/**
 * Nombre de un arco. Los nombres también pueden ser spoilers ("La batalla de…"),
 * así que solo se muestran los de arcos terminados y el que se está viendo.
 * Sin escudo conocido (HTML estático) se usa siempre la forma genérica.
 */
export function arcLabel(season: Season, index: number, shield?: Shield): string {
  const known = shield && (!shield.enabled || index <= (shield.progress[season.id] ?? 0));
  const name = season.arcs[index];
  return known && name ? name : `arco ${index + 1} de ${season.arcs.length}`;
}

/** "Temporada 2 · arco 1 de 2": para decirle al espectador cuándo se revela algo. */
export function describeMarker(saga: Saga, marker: Marker, shield?: Shield): string {
  const season = saga.seasons.find((g) => g.id === marker.season);
  if (!season) return marker.season;
  return `${season.title} · ${arcLabel(season, marker.arc, shield)}`;
}

/** Las entregas están escritas en el orden en que conviene verlas (el manga va al final). */
export function seasonsInOrder(saga: Saga) {
  return saga.seasons;
}

/** "2019-2025": los años de emisión del anime; el manga no cuenta. */
export function airedYears(saga: Saga): string {
  const aired = saga.seasons.filter((s) => s.format !== 'manga');
  const first = Math.min(...aired.map((s) => s.year));
  const last = Math.max(...aired.map((s) => s.until ?? s.year));
  return first === last ? `${first}` : `${first}-${last}`;
}

export type TimelineMode = 'universo' | 'lanzamiento';

/**
 * Orden de la línea de tiempo. "universo" sigue la cronología interna de la saga;
 * "lanzamiento" sigue el orden en que un espectador la va descubriendo.
 */
export function sortEvents(saga: Saga, mode: TimelineMode): LoreEvent[] {
  const release = new Map(seasonsInOrder(saga).map((g, i) => [g.id, i]));
  const byRelease = (a: LoreEvent, b: LoreEvent) =>
    (release.get(a.at.season) ?? 0) - (release.get(b.at.season) ?? 0) ||
    a.at.arc - b.at.arc ||
    a.order - b.order;
  const byUniverse = (a: LoreEvent, b: LoreEvent) => a.order - b.order || byRelease(a, b);
  return [...saga.events].sort(mode === 'universo' ? byUniverse : byRelease);
}

export type FogRun<T> = { kind: 'visible'; item: T } | { kind: 'fog'; items: T[] };

/**
 * Agrupa los elementos ocultos consecutivos en un solo "banco de niebla", para no
 * mostrar una tarjeta de candado por cada evento que el espectador aún no vio.
 */
export function groupFog<T>(items: T[], visible: (item: T) => boolean): FogRun<T>[] {
  const runs: FogRun<T>[] = [];
  for (const item of items) {
    if (visible(item)) runs.push({ kind: 'visible', item });
    else {
      const last = runs[runs.length - 1];
      if (last?.kind === 'fog') last.items.push(item);
      else runs.push({ kind: 'fog', items: [item] });
    }
  }
  return runs;
}

export interface HiddenCount {
  events: number;
  characters: number;
  relations: number;
  reveals: number;
}

export function countHidden(saga: Saga, shield: Shield): HiddenCount {
  return {
    events: saga.events.filter((e) => !isRevealed(e.at, shield)).length,
    characters: saga.characters.filter((c) => !isCharacterKnown(c, shield)).length,
    relations: saga.relations.filter((r) => !isRelationVisible(r, saga, shield)).length,
    reveals: saga.characters.flatMap((c) => c.reveals).filter((r) => !isRevealed(r.at, shield))
      .length,
  };
}

/** Porcentaje de arcos terminados en toda la saga. */
export function completion(saga: Saga, progress: SagaProgress): number {
  const total = saga.seasons.reduce((n, g) => n + g.arcs.length, 0);
  const done = saga.seasons.reduce((n, g) => n + clampArc(progress[g.id], g.arcs.length), 0);
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

/**
 * Fija el progreso en una entrega. Una serie se ve en orden: lo anterior queda como
 * visto y lo posterior vuelve a cero, salvo las entregas opcionales, que no dependen
 * del resto y solo cambian cuando se marcan ellas mismas.
 */
export function progressTo(saga: Saga, progress: SagaProgress, seasonId: string, value: number): SagaProgress {
  const target = saga.seasons.findIndex((s) => s.id === seasonId);
  if (target === -1) return progress;
  const season = saga.seasons[target];
  const next = { ...progress, [seasonId]: clampArc(value, season.arcs.length) };
  if (season.optional) return next;
  saga.seasons.forEach((s, i) => {
    if (s.optional || i === target) return;
    next[s.id] = i < target ? s.arcs.length : 0;
  });
  return next;
}

export function completeAll(saga: Saga): SagaProgress {
  return Object.fromEntries(saga.seasons.map((g) => [g.id, g.arcs.length]));
}

function clampArc(value: unknown, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.min(Math.max(Math.trunc(value), 0), max);
}

/**
 * Limpia el progreso leído de localStorage: descarta entregas que ya no existen
 * y ajusta valores fuera de rango, para que datos viejos o manipulados no rompan nada.
 */
export function sanitizeProgress(saga: Saga, raw: unknown): SagaProgress {
  if (!raw || typeof raw !== 'object') return {};
  const out: SagaProgress = {};
  for (const g of saga.seasons) {
    const v = clampArc((raw as Record<string, unknown>)[g.id], g.arcs.length);
    if (v > 0) out[g.id] = v;
  }
  return out;
}
