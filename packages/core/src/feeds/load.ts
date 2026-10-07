import { FeedError } from '../errors';
import type { Gospel, GospelSource, IsoDate, Lang } from '../types';
import { fetchAelfGospel } from './aelf';
import { fetchEvangelizoGospel } from './evangelizo';
import type { FetchLike } from './http';

/**
 * Pide el evangelio a la fuente indicada. Sin `source`, usa Evangelizo; en francés, si falla,
 * cae a AELF, la fuente oficial, que además no limita la fecha. Lo comparten el Worker y la app.
 */
export async function loadGospel(
  fetchFn: FetchLike,
  date: IsoDate,
  lang: Lang,
  source?: GospelSource,
): Promise<Gospel> {
  if (source === 'aelf') return fetchAelfGospel(fetchFn, date);
  try {
    return await fetchEvangelizoGospel(fetchFn, date, lang);
  } catch (error) {
    if (lang === 'fr' && source === undefined && error instanceof FeedError) {
      return fetchAelfGospel(fetchFn, date);
    }
    throw error;
  }
}
