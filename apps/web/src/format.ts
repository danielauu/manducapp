import type { IsoDate } from '@manducapp/core';

/** `2026-10-11` -> «domingo, 11 de octubre» (o su equivalente en el idioma pedido). */
export function formatDay(date: IsoDate, locale: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const local = new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
  return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(local);
}
