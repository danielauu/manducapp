import { FeedError } from '../errors';
import { collapseSpaces, htmlToText } from '../text';
import type { Gospel, IsoDate } from '../types';
import { getText, type FetchLike } from './http';

export const AELF_CREDIT = 'Extrait de la Traduction Liturgique de la Bible - © AELF, Paris';

export function aelfUrl(date: IsoDate): string {
  return `https://api.aelf.org/v1/messes/${date}/france`;
}

interface AelfReading {
  type: string;
  ref?: string;
  contenu?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readingsOfFirstMass(json: unknown): AelfReading[] {
  if (!isRecord(json) || !Array.isArray(json.messes)) {
    throw new FeedError('bad-response', 'AELF respondió con una estructura inesperada');
  }
  const mass: unknown = json.messes[0];
  if (!isRecord(mass) || !Array.isArray(mass.lectures)) {
    throw new FeedError('not-found', 'AELF no trae lecturas para esa fecha');
  }
  return mass.lectures.filter(isRecord).map((reading) => ({
    type: typeof reading.type === 'string' ? reading.type : '',
    ref: typeof reading.ref === 'string' ? reading.ref : undefined,
    contenu: typeof reading.contenu === 'string' ? reading.contenu : undefined,
  }));
}

/**
 * AELF entrega casi todo el evangelio en un solo párrafo, con saltos de línea poéticos de ~8
 * palabras. Cada párrafo se parte en frases (cierre `. ! ? …`, con comillas opcionales).
 * No se usa lookbehind: Safari anterior a 16.4 no compila el script entero si lo ve.
 */
function splitSentences(text: string): string[] {
  const pieces = text.match(/.+?(?:[.!?…]+(?:\s?[»”’'"])*(?=\s|$)|$)/g) ?? [];
  return pieces.map(collapseSpaces).filter((piece) => piece.length > 0);
}

/** Descarta las fórmulas litúrgicas ("– Acclamons la Parole de Dieu", "OU LECTURE BRÈVE"). */
function paragraphsToLines(html: string): string[] {
  return html
    .split(/<\/p>/i)
    .map((paragraph) => htmlToText(paragraph.replace(/<br\s*\/?>/gi, ' ')))
    .filter((text) => text.length > 0 && !/^[–—]\s/.test(text) && !/^ou lecture br[eè]ve$/i.test(text))
    .flatMap(splitSentences);
}

/** AELF escribe `Mt 22, 1-14`; se unifica con el estilo de Evangelizo (`Mt 22,1-14`). */
function cleanReference(raw: string | undefined): string {
  return collapseSpaces(raw ?? '').replace(/(\d), (\d)/g, '$1,$2');
}

function countWords(lines: string[]): number {
  return lines.join(' ').split(' ').filter(Boolean).length;
}

export function parseAelfGospel(json: unknown, date: IsoDate): Gospel {
  const gospels = readingsOfFirstMass(json).filter((reading) => reading.type === 'evangile');
  const [long, short] = gospels;
  const lines = paragraphsToLines(long?.contenu ?? '');
  if (!long || lines.length === 0) {
    throw new FeedError('not-found', `AELF no trae evangelio para ${date}`);
  }

  const info = isRecord(json) && isRecord(json.informations) ? json.informations : {};
  const liturgicalTitle = collapseSpaces(
    typeof info.jour_liturgique_nom === 'string' ? info.jour_liturgique_nom : '',
  );

  const gospel: Gospel = {
    date,
    lang: 'fr',
    liturgicalTitle,
    reference: cleanReference(long.ref),
    lines,
    credit: AELF_CREDIT,
    source: 'aelf',
  };

  // AELF lista primero la forma larga y después la breve; solo se conserva si de verdad es más corta.
  const shortLines = paragraphsToLines(short?.contenu ?? '');
  if (short && shortLines.length > 0 && countWords(shortLines) < countWords(lines)) {
    gospel.shortLines = shortLines;
    gospel.shortReference = cleanReference(short.ref);
  }
  return gospel;
}

export async function fetchAelfGospel(fetchFn: FetchLike, date: IsoDate): Promise<Gospel> {
  const raw = await getText(fetchFn, aelfUrl(date));
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (cause) {
    throw new FeedError('bad-response', 'AELF no respondió con JSON', { cause });
  }
  return parseAelfGospel(json, date);
}
