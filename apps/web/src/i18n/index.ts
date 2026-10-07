import { isLang, type Lang } from '@manducapp/core';
import { en } from './en';
import { es, type MessageKey } from './es';

export type UiLang = 'es' | 'en';
export type { MessageKey };

const DICTIONARIES: Record<UiLang, Record<MessageKey, string>> = { es, en };

/** Nombre de cada idioma en su propio idioma, para el selector. */
export const LANG_NAMES: Record<Lang, string> = {
  es: 'Español',
  en: 'English',
  fr: 'Français',
  it: 'Italiano',
  de: 'Deutsch',
  pl: 'Polski',
};

export function translate(
  lang: UiLang,
  key: MessageKey,
  params: Record<string, string | number> = {},
): string {
  const template = DICTIONARIES[lang][key];
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    name in params ? String(params[name]) : placeholder,
  );
}

function baseOf(tag: string): string {
  return tag.toLowerCase().split(/[-_]/)[0] ?? '';
}

/** Idioma de la interfaz: el primero del navegador que esté entre los disponibles; si no, inglés. */
export function detectUiLang(languages: readonly string[]): UiLang {
  for (const tag of languages) {
    const base = baseOf(tag);
    if (base === 'es' || base === 'en') return base;
  }
  return 'en';
}

/** Idioma del evangelio por defecto: el primero del navegador que esté entre los 6; si no, inglés. */
export function detectReadingLang(languages: readonly string[]): Lang {
  for (const tag of languages) {
    const base = baseOf(tag);
    if (isLang(base)) return base;
  }
  return 'en';
}
