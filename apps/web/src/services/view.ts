import {
  buildSession,
  estimateSessionSeconds,
  segment,
  splitSentences,
  type Gospel,
  type IsoDate,
  type Lang,
} from '@manducapp/core';

export type GospelKind = 'today' | 'sunday' | 'own';

/** Lo que las pantallas necesitan del texto elegido, ya dividido en oraciones. */
export interface GospelView {
  kind: GospelKind;
  lang: Lang;
  date?: IsoDate;
  title: string;
  reference: string;
  /** Línea de crédito de la traducción; no existe para un texto propio. */
  credit?: string;
  sentences: string[];
}

export function gospelToView(gospel: Gospel, kind: 'today' | 'sunday'): GospelView {
  return {
    kind,
    lang: gospel.lang,
    date: gospel.date,
    title: gospel.liturgicalTitle,
    reference: gospel.reference,
    credit: gospel.credit,
    sentences: segment(gospel.lines, gospel.lang),
  };
}

/** El texto pegado se parte en frases; `segment` une las muy cortas y divide las muy largas. */
export function ownTextToView(text: string, lang: Lang, title: string): GospelView {
  const lines = text.split(/\r?\n/).flatMap(splitSentences);
  return { kind: 'own', lang, title: '', reference: title, sentences: segment(lines, lang) };
}

/** Duración estimada, en minutos redondeados, de memorizar todo el texto una sola persona. */
export function estimateMinutes(sentences: readonly string[]): number {
  return Math.max(1, Math.round(estimateSessionSeconds(buildSession(sentences)) / 60));
}
