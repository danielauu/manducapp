import { compactDate } from '../calendar';
import { FeedError } from '../errors';
import { collapseSpaces, htmlToText } from '../text';
import type { Gospel, IsoDate, Lang } from '../types';
import { getText, type FetchLike } from './http';

export const EVANGELIZO_URL = 'https://feed.evangelizo.org/v2/reader.php';

export const EVANGELIZO_LANG: Record<Lang, string> = {
  es: 'SP',
  en: 'AM',
  fr: 'FR',
  it: 'IT',
  de: 'DE',
  pl: 'PL',
};

/**
 * El XML no trae el crédito de la traducción; sale de la versión HTML (`type=reading`).
 * Estos textos son solo el respaldo si esa segunda petición falla.
 */
export const FALLBACK_CREDITS: Record<Lang, string> = {
  es: 'Extraído de la Biblia: Libro del Pueblo de Dios.',
  en: 'Copyright © Confraternity of Christian Doctrine, USCCB',
  fr: 'Extrait de la Traduction Liturgique de la Bible - © AELF, Paris',
  it: 'Copyright © Conferenza Episcopale Italiana',
  de: 'Lektionar. Rechte: staeko.net',
  pl: 'Fragment liturgicznego tłumaczenia Biblii Tysiąclecia, © Wydawnictwo Pallottinum',
};

export type EvangelizoType = 'xml' | 'reading';

export function evangelizoUrl(date: IsoDate, lang: Lang, type: EvangelizoType): string {
  const params = {
    date: compactDate(date),
    type,
    lang: EVANGELIZO_LANG[lang],
    content: 'GSP',
  };
  const query = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  return `${EVANGELIZO_URL}?${query}`;
}

function cdata(xml: string, tag: string): string | undefined {
  const match = new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`).exec(xml);
  return match?.[1];
}

function splitLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map(collapseSpaces)
    .filter((line) => line.length > 0);
}

/** Evangelizo responde 200 con una página HTML de error cuando un parámetro es inválido. */
function assertXml(raw: string): void {
  if (raw.trimStart().startsWith('<?xml')) return;
  if (/wrong param[^<]*date/i.test(raw)) {
    throw new FeedError('out-of-range', 'Evangelizo rechazó la fecha (máximo 30 días hacia adelante)');
  }
  throw new FeedError('bad-response', 'Evangelizo no respondió con XML');
}

/** Sin el punto final que agrega la fuente: `Mt 22,1-14.` -> `Mt 22,1-14`. */
function cleanReference(raw: string): string {
  return htmlToText(raw).replace(/\.$/, '');
}

export function parseEvangelizoGospel(
  xml: string,
  date: IsoDate,
  lang: Lang,
  credit?: string,
): Gospel {
  assertXml(xml);
  const lines = splitLines(cdata(xml, 'reading_gospel') ?? '');
  if (lines.length === 0) {
    throw new FeedError('not-found', `Evangelizo no trae evangelio para ${date} (${lang})`);
  }
  // La fuente escribe `litugic_t` (sin la "r"); se acepta también la forma correcta.
  const liturgicalTitle = htmlToText(cdata(xml, 'litugic_t') ?? cdata(xml, 'liturgic_t') ?? '');
  return {
    date,
    lang,
    liturgicalTitle,
    reference: cleanReference(cdata(xml, 'reading_gospel_st') ?? ''),
    lines,
    credit: credit ?? FALLBACK_CREDITS[lang],
    source: 'evangelizo',
  };
}

/** El crédito es la primera línea después del primer doble salto de línea de la versión HTML. */
export function parseEvangelizoCredit(html: string): string | undefined {
  const blank = html.search(/<br\s*\/?>\s*<br\s*\/?>/);
  if (blank < 0) return undefined;
  for (const part of html.slice(blank).split(/<br\s*\/?>/)) {
    const text = htmlToText(part);
    if (text) return text;
  }
  return undefined;
}

export async function fetchEvangelizoGospel(
  fetchFn: FetchLike,
  date: IsoDate,
  lang: Lang,
): Promise<Gospel> {
  const [xml, creditHtml] = await Promise.all([
    getText(fetchFn, evangelizoUrl(date, lang, 'xml')),
    getText(fetchFn, evangelizoUrl(date, lang, 'reading')).catch(() => undefined),
  ]);
  const credit = creditHtml === undefined ? undefined : parseEvangelizoCredit(creditHtml);
  return parseEvangelizoGospel(xml, date, lang, credit);
}
