import { todayIso } from '@manducapp/core';
import { formatDay } from '../format';
import type { Meditation } from './journal';

/** Día en que se escribió la meditación, según el reloj del dispositivo. */
export function writtenOn(meditation: Meditation): string {
  return todayIso(new Date(meditation.createdAt));
}

/** Texto legible, pensado para pegarlo en un correo, un mensaje o un cuaderno digital. */
export function meditationsToText(meditations: readonly Meditation[], locale: string): string {
  return meditations
    .map((meditation) => {
      const gospelDay = meditation.date ? ` (${formatDay(meditation.date, locale)})` : '';
      return `## ${meditation.reference}${gospelDay}\n${formatDay(writtenOn(meditation), locale)}\n\n${meditation.text}`;
    })
    .join('\n\n---\n\n');
}

/** Copia de respaldo con todos los datos, para guardarla fuera del navegador. */
export function meditationsToJson(meditations: readonly Meditation[], now: number): string {
  return JSON.stringify({ app: 'manducapp', version: 1, exportedAt: now, meditations }, null, 2);
}

export function exportFilename(extension: 'txt' | 'json', now: number): string {
  return `manducapp-meditaciones-${todayIso(new Date(now))}.${extension}`;
}
