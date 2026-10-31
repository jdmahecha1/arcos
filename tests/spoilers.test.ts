import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { Saga } from '../src/lib/schema';
import {
  completeAll,
  completion,
  countHidden,
  describeMarker,
  progressTo,
  isRelationVisible,
  isRevealed,
  sanitizeProgress,
  sortEvents,
  type Shield,
} from '../src/lib/spoilers';

// Serie mínima donde el orden interno no coincide con el de emisión (como una precuela).
const saga: Saga = {
  id: 'prueba',
  title: 'Serie de prueba',
  tagline: 'Una serie inventada',
  studio: 'Estudio',
  genre: 'Aventura',
  accent: '#336699',
  synopsis: 'Sin spoilers.',
  seasons: [
    { id: 'secuela', title: 'La secuela', year: 2010, format: 'anime', optional: false, arcs: ['Uno', 'Dos'] },
    { id: 'precuela', title: 'La precuela', year: 2018, format: 'anime', optional: false, arcs: ['Prólogo', 'Nudo', 'Final'] },
  ],
  characters: [
    { id: 'heroe', name: 'Héroe', role: 'Protagonista', intro: 'Conocido.', reveals: [] },
    {
      id: 'villano',
      name: 'Villano',
      role: 'Sorpresa',
      intro: 'Oculto.',
      appears: { season: 'precuela', arc: 1 },
      reveals: [{ text: 'Era el hermano', at: { season: 'precuela', arc: 2 } }],
    },
  ],
  events: [
    { id: 'a', title: 'A', date: '1911', order: 30, at: { season: 'secuela', arc: 0 }, text: '', characters: [], major: true },
    { id: 'b', title: 'B', date: '1899', order: 10, at: { season: 'precuela', arc: 0 }, text: '', characters: [], major: false },
    { id: 'c', title: 'C', date: '1900', order: 20, at: { season: 'precuela', arc: 2 }, text: '', characters: [], major: true },
  ],
  relations: [
    { from: 'heroe', to: 'villano', kind: 'enemigo', detail: '', at: { season: 'precuela', arc: 0 } },
  ],
};

const shield = (progress: Shield['progress'], enabled = true): Shield => ({ enabled, progress });

describe('isRevealed', () => {
  it('un dato del arco N se revela al terminar el arco N, no antes', () => {
    const at = { season: 'precuela', arc: 1 };
    expect(isRevealed(at, shield({ precuela: 1 }))).toBe(false);
    expect(isRevealed(at, shield({ precuela: 2 }))).toBe(true);
  });

  it('sin progreso solo se ve lo que no tiene marca', () => {
    expect(isRevealed(undefined, shield({}))).toBe(true);
    expect(isRevealed({ season: 'secuela', arc: 0 }, shield({}))).toBe(false);
  });

  it('con el escudo apagado se ve todo', () => {
    expect(isRevealed({ season: 'precuela', arc: 2 }, shield({}, false))).toBe(true);
  });

  it('avanzar nunca vuelve a ocultar algo ya revelado (monotonía)', () => {
    fc.assert(
      fc.property(fc.nat(5), fc.nat(5), fc.nat(5), (arc, a, b) => {
        const at = { season: 'precuela', arc };
        const [lo, hi] = a <= b ? [a, b] : [b, a];
        return !isRevealed(at, shield({ precuela: lo })) || isRevealed(at, shield({ precuela: hi }));
      }),
    );
  });
});

describe('relaciones', () => {
  it('esperan a conocer la relación y a los dos personajes', () => {
    const [rel] = saga.relations;
    // La relación se marca en el arco 0, pero el villano aparece en el arco 1.
    expect(isRelationVisible(rel, saga, shield({ precuela: 1 }))).toBe(false);
    expect(isRelationVisible(rel, saga, shield({ precuela: 2 }))).toBe(true);
  });
});

describe('sortEvents', () => {
  it('cronología interna sigue el campo order', () => {
    expect(sortEvents(saga, 'universo').map((e) => e.id)).toEqual(['b', 'c', 'a']);
  });

  it('orden de lanzamiento sigue el orden de las entregas y luego el arco', () => {
    expect(sortEvents(saga, 'lanzamiento').map((e) => e.id)).toEqual(['a', 'b', 'c']);
  });

  it('no modifica el arreglo original', () => {
    const before = saga.events.map((e) => e.id);
    sortEvents(saga, 'universo');
    expect(saga.events.map((e) => e.id)).toEqual(before);
  });
});

describe('progreso', () => {
  it('countHidden cuenta lo oculto con el progreso actual', () => {
    expect(countHidden(saga, shield({}))).toEqual({ events: 3, characters: 1, relations: 1, reveals: 1 });
    expect(countHidden(saga, shield(completeAll(saga)))).toEqual({
      events: 0,
      characters: 0,
      relations: 0,
      reveals: 0,
    });
  });

  it('completion calcula el porcentaje de arcos terminados', () => {
    expect(completion(saga, {})).toBe(0);
    expect(completion(saga, { secuela: 2, precuela: 1 })).toBe(60);
    expect(completion(saga, completeAll(saga))).toBe(100);
  });

  it('progressTo da por visto lo anterior y borra lo posterior', () => {
    expect(progressTo(saga, {}, 'precuela', 1)).toEqual({ secuela: 2, precuela: 1 });
    expect(progressTo(saga, { secuela: 2, precuela: 3 }, 'secuela', 1)).toEqual({ secuela: 1, precuela: 0 });
    expect(progressTo(saga, { precuela: 1 }, 'no-existe', 1)).toEqual({ precuela: 1 });
  });

  it('progressTo no toca las entregas opcionales', () => {
    const conOpcional: Saga = {
      ...saga,
      seasons: [
        saga.seasons[0],
        { id: 'pelicula', title: 'Película', year: 2012, format: 'pelicula', optional: true, arcs: ['Única'] },
        saga.seasons[1],
      ],
    };
    expect(progressTo(conOpcional, {}, 'precuela', 2).pelicula).toBeUndefined();
    expect(progressTo(conOpcional, { pelicula: 1 }, 'secuela', 1).pelicula).toBe(1);
    expect(progressTo(conOpcional, {}, 'pelicula', 1)).toEqual({ pelicula: 1 });
  });

  it('sanitizeProgress descarta basura y ajusta valores fuera de rango', () => {
    expect(sanitizeProgress(saga, null)).toEqual({});
    expect(sanitizeProgress(saga, 'texto')).toEqual({});
    expect(sanitizeProgress(saga, { secuela: 99, precuela: -4, otro: 2 })).toEqual({ secuela: 2 });
    expect(sanitizeProgress(saga, { secuela: 1.7, precuela: 'x' })).toEqual({ secuela: 1 });
  });

  it('sanitizeProgress siempre devuelve valores válidos (propiedad)', () => {
    fc.assert(
      fc.property(fc.dictionary(fc.string(), fc.anything()), (raw) => {
        const out = sanitizeProgress(saga, raw);
        return Object.entries(out).every(([id, v]) => {
          const season = saga.seasons.find((g) => g.id === id);
          return !!season && Number.isInteger(v) && v >= 1 && v <= season.arcs.length;
        });
      }),
    );
  });
});

describe('describeMarker', () => {
  it('solo nombra arcos terminados o en curso: el nombre también puede ser spoiler', () => {
    expect(describeMarker(saga, { season: 'precuela', arc: 1 })).toBe('La precuela · arco 2 de 3');
    expect(describeMarker(saga, { season: 'precuela', arc: 1 }, shield({ precuela: 1 }))).toBe('La precuela · Nudo');
    expect(describeMarker(saga, { season: 'precuela', arc: 2 }, shield({ precuela: 1 }))).toBe('La precuela · arco 3 de 3');
    expect(describeMarker(saga, { season: 'precuela', arc: 2 }, shield({}, false))).toBe('La precuela · Final');
  });
});

describe('groupFog', () => {
  it('agrupa los ocultos consecutivos y respeta el orden', async () => {
    const { groupFog } = await import('../src/lib/spoilers');
    const runs = groupFog([1, 2, 3, 4, 5, 6], (n) => n === 1 || n === 4);
    expect(runs).toEqual([
      { kind: 'visible', item: 1 },
      { kind: 'fog', items: [2, 3] },
      { kind: 'visible', item: 4 },
      { kind: 'fog', items: [5, 6] },
    ]);
  });

  it('nunca pierde ni duplica elementos (propiedad)', async () => {
    const { groupFog } = await import('../src/lib/spoilers');
    fc.assert(
      fc.property(fc.array(fc.tuple(fc.integer(), fc.boolean())), (items) => {
        const flat = groupFog(items, ([, v]) => v).flatMap((r) => (r.kind === 'fog' ? r.items : [r.item]));
        return flat.length === items.length && flat.every((x, i) => x === items[i]);
      }),
    );
  });
});
