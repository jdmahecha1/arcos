import type { Marker, Saga } from './schema';

/**
 * Comprueba lo que Zod no puede ver: que cada referencia apunte a algo que existe
 * y que ningún dato se revele en un arco inexistente. Devuelve la lista de problemas.
 */
export function checkSaga(saga: Saga): string[] {
  const problems: string[] = [];
  const seasons = new Map(saga.seasons.map((g) => [g.id, g]));
  const characters = new Set(saga.characters.map((c) => c.id));

  const duplicates = (label: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) problems.push(`${label} duplicado: ${id}`);
      seen.add(id);
    }
  };
  duplicates('Entrega', saga.seasons.map((g) => g.id));
  duplicates('Personaje', saga.characters.map((c) => c.id));
  duplicates('Evento', saga.events.map((e) => e.id));

  const marker = (where: string, m: Marker) => {
    const season = seasons.get(m.season);
    if (!season) problems.push(`${where}: entrega desconocida "${m.season}"`);
    else if (m.arc >= season.arcs.length)
      problems.push(`${where}: "${m.season}" no tiene el arco ${m.arc}`);
  };

  for (const c of saga.characters) {
    if (c.appears) marker(`Personaje ${c.id}`, c.appears);
    c.reveals.forEach((r, i) => marker(`Personaje ${c.id}, dato ${i + 1}`, r.at));
  }
  for (const e of saga.events) {
    marker(`Evento ${e.id}`, e.at);
    for (const id of e.characters)
      if (!characters.has(id)) problems.push(`Evento ${e.id}: personaje desconocido "${id}"`);
  }
  for (const r of saga.relations) {
    const where = `Relación ${r.from} → ${r.to}`;
    marker(where, r.at);
    if (!characters.has(r.from)) problems.push(`${where}: personaje desconocido "${r.from}"`);
    if (!characters.has(r.to)) problems.push(`${where}: personaje desconocido "${r.to}"`);
    if (r.from === r.to) problems.push(`${where}: un personaje no puede relacionarse consigo mismo`);
  }
  problems.push(...checkSpoilerOrder(saga));
  return problems;
}

/**
 * Comprueba que ningún texto adelante a un personaje: un evento o una relación no
 * pueden mostrarse antes de que se conozca a quienes aparecen en ellos.
 */
function checkSpoilerOrder(saga: Saga): string[] {
  const problems: string[] = [];
  const position = (m: Marker) => [saga.seasons.findIndex((s) => s.id === m.season), m.arc] as const;
  const isBefore = (a: Marker, b: Marker) => {
    const [sa, aa] = position(a);
    const [sb, ab] = position(b);
    return sa < sb || (sa === sb && aa < ab);
  };
  const byId = new Map(saga.characters.map((c) => [c.id, c]));
  const hidden = saga.characters.filter((c) => c.appears);

  const check = (where: string, at: Marker, ids: string[], text: string) => {
    for (const id of ids) {
      const appears = byId.get(id)?.appears;
      if (appears && isBefore(at, appears)) problems.push(`${where}: se muestra antes de que aparezca ${id}`);
    }
    for (const c of hidden)
      if (text.includes(c.name) && isBefore(at, c.appears!)) problems.push(`${where}: nombra a ${c.name} antes de que aparezca`);
  };

  for (const e of saga.events) check(`Evento ${e.id}`, e.at, e.characters, `${e.title} ${e.text}`);
  for (const r of saga.relations) check(`Relación ${r.from} → ${r.to}`, r.at, [r.from, r.to], r.detail);
  for (const c of saga.characters) {
    c.reveals.forEach((r, i) => {
      if (c.appears && isBefore(r.at, c.appears)) problems.push(`Personaje ${c.id}, dato ${i + 1}: se revela antes de que aparezca`);
      check(`Personaje ${c.id}, dato ${i + 1}`, r.at, [], r.text);
    });
    if (c.appears) check(`Personaje ${c.id}`, c.appears, [], `${c.role} ${c.intro}`);
  }
  return problems;
}

/** Los ids de entrega se guardan por saga, pero también deben ser únicos entre sagas. */
export function checkCollection(sagas: Saga[]): string[] {
  const problems = sagas.flatMap((s) => checkSaga(s).map((p) => `[${s.id}] ${p}`));
  const owner = new Map<string, string>();
  for (const s of sagas) {
    if (owner.has(s.id)) problems.push(`Saga duplicada: ${s.id}`);
    owner.set(s.id, s.id);
    for (const g of s.seasons) {
      const prev = owner.get(`season:${g.id}`);
      if (prev) problems.push(`Entrega "${g.id}" repetido en ${prev} y ${s.id}`);
      owner.set(`season:${g.id}`, s.id);
    }
  }
  return problems;
}
