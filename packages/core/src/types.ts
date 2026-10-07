export const LANGS = ['es', 'en', 'fr', 'it', 'de', 'pl'] as const;

export type Lang = (typeof LANGS)[number];

/** Fecha calendario en formato `YYYY-MM-DD`, sin hora ni zona horaria. */
export type IsoDate = string;

export type GospelSource = 'evangelizo' | 'aelf';

/** Evangelio del día normalizado, independiente de la fuente que lo entregó. */
export interface Gospel {
  date: IsoDate;
  lang: Lang;
  liturgicalTitle: string;
  reference: string;
  /** Líneas de sentido tal como las entrega la fuente (casi a nivel de versículo). */
  lines: string[];
  /** Forma breve del evangelio, cuando la fuente la ofrece. */
  shortLines?: string[];
  shortReference?: string;
  /** Línea de crédito de la traducción; debe mostrarse siempre junto al texto. */
  credit: string;
  source: GospelSource;
}

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}
