import { loadGospel, type FetchLike, type Gospel, type IsoDate, type Lang } from '@manducapp/core';
import { pruneGospelCache, readCachedGospel, writeCachedGospel } from './cache';
import type { KeyValueStorage } from './storage';

export interface GospelDeps {
  fetchFn: FetchLike;
  storage: KeyValueStorage;
  now?: () => number;
}

/**
 * Devuelve el evangelio de la caché local si ya se pidió, y si no lo busca en la fuente
 * (con las mismas reglas que el Worker) y lo guarda. Un día ya publicado no cambia.
 */
export async function getGospel(date: IsoDate, lang: Lang, deps: GospelDeps): Promise<Gospel> {
  const cached = readCachedGospel(deps.storage, date, lang);
  if (cached) return cached;

  const gospel = await loadGospel(deps.fetchFn, date, lang);
  const now = (deps.now ?? Date.now)();
  writeCachedGospel(deps.storage, gospel, now);
  pruneGospelCache(deps.storage, now);
  return gospel;
}
