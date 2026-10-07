import { collapseSpaces, isWord } from './text';
import type { Lang } from './types';

export const DEFAULT_MAX_WORDS = 22;
export const DEFAULT_MIN_WORDS = 6;
export const DEFAULT_MIN_SIDE_WORDS = 5;

export interface SegmentOptions {
  /** Una oración con más palabras que esto se divide. */
  maxWords?: number;
  /** Una línea con menos palabras que esto se une con la siguiente. */
  minWords?: number;
  /** Mínimo de palabras a cada lado de un corte. */
  minSideWords?: number;
}

/** Palabras antes de las cuales es natural cortar, en minúscula. Solo se usan si no hay puntuación. */
const CONJUNCTIONS: Record<Lang, ReadonlySet<string>> = {
  es: new Set(['y', 'e', 'pero', 'porque', 'sino', 'pues', 'aunque', 'cuando', 'mientras', 'entonces', 'luego']),
  en: new Set(['and', 'but', 'because', 'so', 'then', 'when', 'while', 'yet', 'or']),
  fr: new Set(['et', 'mais', 'car', 'ou', 'puis', 'alors', 'quand', 'lorsque']),
  it: new Set(['e', 'ed', 'ma', 'perché', 'poiché', 'quando', 'mentre', 'allora', 'poi', 'o']),
  de: new Set(['und', 'aber', 'denn', 'doch', 'weil', 'als', 'dann', 'oder', 'sondern']),
  pl: new Set(['i', 'a', 'ale', 'bo', 'gdy', 'kiedy', 'więc', 'ponieważ', 'lecz', 'oraz', 'lub', 'albo']),
};

/** Qué tan natural es cortar en un punto; pesa más que la distancia al centro. */
const STRENGTH = { sentence: 5, clause: 4, comma: 2, conjunction: 1, none: 0 } as const;
const STRENGTH_WEIGHT = 6;
const INSIDE_QUOTE_PENALTY = 100;

const CLOSERS = `"'»”’)`;

/** Signos que algunos idiomas separan por un espacio de la palabra anterior (« texto. », « : »). */
const DETACHED_PUNCTUATION = /^[»”’"')\]:;,.!?…]+$/;

function countWords(tokens: readonly string[]): number {
  return tokens.filter(isWord).length;
}

function tokenize(text: string): string[] {
  return collapseSpaces(text).split(' ').filter(Boolean);
}

function strengthAfter(token: string): number {
  const bare = token.replace(new RegExp(`[${CLOSERS}]+$`), '');
  if (/[.!?…]$/.test(bare)) return STRENGTH.sentence;
  if (/[;:]$/.test(bare)) return STRENGTH.clause;
  if (/[,،]$/.test(bare)) return STRENGTH.comma;
  return STRENGTH.none;
}

function leadingQuotes(token: string): number {
  return /^[«“‘"'¿¡([]*/.exec(token)?.[0].replace(/[¿¡([]/g, '').length ?? 0;
}

function trailingQuotes(token: string): number {
  const bare = token.replace(/[.,;:!?…)\]]+$/, '');
  return /[»”’"']*$/.exec(bare)?.[0].length ?? 0;
}

/** Rangos `[inicio, fin]` de citas cortas (cabrían en una oración), que conviene no partir. */
function shortQuoteSpans(tokens: readonly string[], maxWords: number): Array<[number, number]> {
  const spans: Array<[number, number]> = [];
  const open: number[] = [];
  tokens.forEach((token, index) => {
    for (let i = 0; i < leadingQuotes(token); i++) open.push(index);
    for (let i = 0; i < trailingQuotes(token); i++) {
      const start = open.pop();
      if (start !== undefined && start < index && index - start + 1 <= maxWords) {
        spans.push([start, index]);
      }
    }
  });
  return spans;
}

function bareLower(token: string): string {
  return token.replace(/^[«“‘"'¿¡([]+/, '').toLowerCase();
}

/** Parte una oración larga en el mejor punto y repite con cada mitad hasta que quepa. */
function splitTokens(
  tokens: string[],
  lang: Lang,
  maxWords: number,
  minSide: number,
): string[][] {
  if (countWords(tokens) <= maxWords || tokens.length < 2 * minSide) return [tokens];

  const spans = shortQuoteSpans(tokens, maxWords);
  const conjunctions = CONJUNCTIONS[lang];
  const middle = tokens.length / 2;

  let bestAt = -1;
  let bestScore = -Infinity;
  for (let at = minSide; at <= tokens.length - minSide; at++) {
    const next = tokens[at] ?? '';
    // En francés ` :`, ` ;` y ` »` van como palabras sueltas; nunca deben quedar al inicio de una oración.
    if (DETACHED_PUNCTUATION.test(next)) continue;
    let previousIndex = at - 1;
    while (previousIndex > 0 && DETACHED_PUNCTUATION.test(tokens[previousIndex] ?? '')) previousIndex--;
    const previous = tokens[previousIndex] ?? '';
    let strength = Math.max(strengthAfter(previous), strengthAfter(tokens[at - 1] ?? ''));
    if (strength === STRENGTH.none && conjunctions.has(bareLower(next))) {
      strength = STRENGTH.conjunction;
    }
    const insideQuote = spans.some(([start, end]) => start <= at - 1 && at <= end);
    const score =
      strength * STRENGTH_WEIGHT - Math.abs(at - middle) - (insideQuote ? INSIDE_QUOTE_PENALTY : 0);
    if (score > bestScore) {
      bestScore = score;
      bestAt = at;
    }
  }
  if (bestAt < 0) return [tokens];

  return [
    ...splitTokens(tokens.slice(0, bestAt), lang, maxWords, minSide),
    ...splitTokens(tokens.slice(bestAt), lang, maxWords, minSide),
  ];
}

/** Une las líneas demasiado cortas con la siguiente (la última, con la anterior). */
function mergeShortLines(lines: string[], minWords: number): string[] {
  const units: string[] = [];
  let buffer = '';
  for (const line of lines) {
    buffer = buffer ? `${buffer} ${line}` : line;
    if (countWords(tokenize(buffer)) >= minWords) {
      units.push(buffer);
      buffer = '';
    }
  }
  if (buffer) {
    const last = units.pop();
    units.push(last ? `${last} ${buffer}` : buffer);
  }
  return units;
}

/**
 * Convierte las líneas de la fuente en oraciones retenibles de memoria:
 * une las líneas muy cortas y divide las muy largas, cuidando no partir citas breves.
 */
export function segment(lines: readonly string[], lang: Lang, options: SegmentOptions = {}): string[] {
  const maxWords = options.maxWords ?? DEFAULT_MAX_WORDS;
  const minWords = options.minWords ?? DEFAULT_MIN_WORDS;
  const minSide = options.minSideWords ?? DEFAULT_MIN_SIDE_WORDS;

  const cleaned = lines.map(collapseSpaces).filter((line) => line.length > 0);
  return mergeShortLines(cleaned, minWords)
    .flatMap((unit) => splitTokens(tokenize(unit), lang, maxWords, minSide))
    .map((tokens) => tokens.join(' '));
}
