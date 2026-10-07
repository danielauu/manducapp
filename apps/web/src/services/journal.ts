import { isLang, type IsoDate, type Lang } from '@manducapp/core';
import type { KeyValueStorage } from './storage';

const KEY = 'manducapp:meditations';

export interface Meditation {
  id: string;
  /** Instante en que se guardó, en milisegundos. */
  createdAt: number;
  /** Día del evangelio, si venía de la fuente; un texto propio no tiene. */
  date?: IsoDate;
  /** Referencia del pasaje, por ejemplo `Mt 22,1-14`, o el título del texto propio. */
  reference: string;
  lang: Lang;
  text: string;
}

export type NewMeditation = Omit<Meditation, 'id' | 'createdAt'>;

function isMeditation(value: unknown): value is Meditation {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    typeof item.createdAt === 'number' &&
    (item.date === undefined || typeof item.date === 'string') &&
    typeof item.reference === 'string' &&
    isLang(item.lang) &&
    typeof item.text === 'string'
  );
}

/** Las meditaciones guardadas, de la más reciente a la más antigua; ignora lo que no se pueda leer. */
export function listMeditations(storage: KeyValueStorage): Meditation[] {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isMeditation).sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

/** Guarda una meditación nueva. `id` y `now` se reciben para que sea fácil de probar. */
export function addMeditation(
  storage: KeyValueStorage,
  input: NewMeditation,
  now: number,
  id: string,
): Meditation {
  const entry: Meditation = { ...input, id, createdAt: now, text: input.text.trim() };
  storage.setItem(KEY, JSON.stringify([...listMeditations(storage), entry]));
  return entry;
}

/** Cambia el texto de una meditación. Devuelve la meditación editada, o `undefined` si no existe. */
export function updateMeditation(storage: KeyValueStorage, id: string, text: string): Meditation | undefined {
  const all = listMeditations(storage);
  const index = all.findIndex((entry) => entry.id === id);
  const current = all[index];
  if (current === undefined) return undefined;
  const updated: Meditation = { ...current, text: text.trim() };
  all[index] = updated;
  storage.setItem(KEY, JSON.stringify(all));
  return updated;
}

/** Borra una meditación. Devuelve `false` si no existía. */
export function deleteMeditation(storage: KeyValueStorage, id: string): boolean {
  const all = listMeditations(storage);
  const remaining = all.filter((entry) => entry.id !== id);
  if (remaining.length === all.length) return false;
  storage.setItem(KEY, JSON.stringify(remaining));
  return true;
}

export function newMeditationId(now: number): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${now.toString(36)}-${random}`;
}
