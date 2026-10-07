import type { IsoDate } from './types';

/** Evangelizo no entrega fechas a más de 30 días desde hoy. */
export const FEED_MAX_DAYS_AHEAD = 30;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function toUtcDate(date: IsoDate): Date {
  const match = ISO_DATE.exec(date);
  if (!match) throw new RangeError(`Fecha inválida: "${date}" (se esperaba YYYY-MM-DD)`);
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (utc.getUTCFullYear() !== year || utc.getUTCMonth() !== month - 1 || utc.getUTCDate() !== day) {
    throw new RangeError(`Fecha inexistente: "${date}"`);
  }
  return utc;
}

function fromUtcDate(utc: Date): IsoDate {
  const year = String(utc.getUTCFullYear()).padStart(4, '0');
  const month = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const day = String(utc.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Fecha calendario local del dispositivo (no la de UTC). */
export function todayIso(now: Date = new Date()): IsoDate {
  const year = String(now.getFullYear()).padStart(4, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(date: IsoDate, days: number): IsoDate {
  const utc = toUtcDate(date);
  utc.setUTCDate(utc.getUTCDate() + days);
  return fromUtcDate(utc);
}

export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((toUtcDate(to).getTime() - toUtcDate(from).getTime()) / 86_400_000);
}

/** 0 = domingo ... 6 = sábado. */
export function dayOfWeek(date: IsoDate): number {
  return toUtcDate(date).getUTCDay();
}

/** Devuelve la misma fecha si ya es domingo. */
export function nextSunday(from: IsoDate): IsoDate {
  return addDays(from, (7 - dayOfWeek(from)) % 7);
}

export function isWithinFeedWindow(date: IsoDate, today: IsoDate): boolean {
  const ahead = daysBetween(today, date);
  return ahead >= 0 && ahead <= FEED_MAX_DAYS_AHEAD;
}

/** `2026-10-11` -> `20261011`, el formato que pide Evangelizo. */
export function compactDate(date: IsoDate): string {
  toUtcDate(date);
  return date.replaceAll('-', '');
}
