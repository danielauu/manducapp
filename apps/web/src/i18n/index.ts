import { isLang, type Lang } from '@manducapp/core';
import { de } from './de';
import { en } from './en';
import { es, type MessageKey } from './es';
import { fr } from './fr';
import { it } from './it';
import { pl } from './pl';

/** La interfaz está en los mismos 6 idiomas que se pueden leer. */
export type UiLang = Lang;
export type { MessageKey };

const DICTIONARIES: Record<UiLang, Record<MessageKey, string>> = { es, en, fr, it, de, pl };

/** Nombre de cada idioma en su propio idioma, para los selectores. */
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

/** El primer idioma del navegador que esté entre los 6; si no hay ninguno, inglés. */
export function detectLang(languages: readonly string[]): Lang {
  for (const tag of languages) {
    const base = baseOf(tag);
    if (isLang(base)) return base;
  }
  return 'en';
}
