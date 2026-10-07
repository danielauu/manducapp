import { isLang, type Gospel, type IsoDate, type Lang } from '@manducapp/core';
import type { KeyValueStorage } from './storage';

const PREFIX = 'manducapp:gospel:';
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

interface Entry {
  savedAt: number;
  gospel: Gospel;
}

export function cacheKey(date: IsoDate, lang: Lang): string {
  return `${PREFIX}${lang}:${date}`;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/** Descarta lo que no tenga la forma de un `Gospel`: la caché pudo escribirla una versión anterior. */
function isGospel(value: unknown): value is Gospel {
  if (typeof value !== 'object' || value === null) return false;
  const gospel = value as Record<string, unknown>;
  return (
    typeof gospel.date === 'string' &&
    isLang(gospel.lang) &&
    typeof gospel.liturgicalTitle === 'string' &&
    typeof gospel.reference === 'string' &&
    isStringArray(gospel.lines) &&
    gospel.lines.length > 0 &&
    typeof gospel.credit === 'string' &&
    (gospel.source === 'evangelizo' || gospel.source === 'aelf')
  );
}

export function readCachedGospel(
  storage: KeyValueStorage,
  date: IsoDate,
  lang: Lang,
): Gospel | undefined {
  const raw = storage.getItem(cacheKey(date, lang));
  if (!raw) return undefined;
  try {
    const entry = JSON.parse(raw) as Partial<Entry>;
    return isGospel(entry.gospel) ? entry.gospel : undefined;
  } catch {
    return undefined;
  }
}

export function writeCachedGospel(storage: KeyValueStorage, gospel: Gospel, now: number): void {
  const entry: Entry = { savedAt: now, gospel };
  storage.setItem(cacheKey(gospel.date, gospel.lang), JSON.stringify(entry));
}

function isFresh(raw: string | null, now: number): boolean {
  try {
    const entry = JSON.parse(raw ?? '') as Partial<Entry>;
    return typeof entry.savedAt === 'number' && now - entry.savedAt <= MAX_AGE_MS;
  } catch {
    return false;
  }
}

/** Borra las lecturas guardadas hace más de 14 días y las que no se pueden leer. */
export function pruneGospelCache(storage: KeyValueStorage, now: number): void {
  for (const key of storage.keys()) {
    if (key.startsWith(PREFIX) && !isFresh(storage.getItem(key), now)) storage.removeItem(key);
  }
}
