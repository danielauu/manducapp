import { LANGS } from '@manducapp/core';
import { describe, expect, it } from 'vitest';
import { de } from './de';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { detectLang, translate } from './index';
import { it as italian } from './it';
import { pl } from './pl';

const DICTIONARIES = { es, en, fr, it: italian, de, pl };
const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();

describe('diccionarios', () => {
  it('hay uno por cada uno de los 6 idiomas', () => {
    expect(Object.keys(DICTIONARIES).sort()).toEqual([...LANGS].sort());
  });

  it.each(LANGS)('%s tiene exactamente las mismas claves que es y ninguna vacía', (lang) => {
    const dictionary: Record<string, string> = DICTIONARIES[lang];
    expect(Object.keys(dictionary).sort()).toEqual(Object.keys(es).sort());
    for (const value of Object.values(dictionary)) expect(value.trim().length).toBeGreaterThan(0);
  });

  it.each(LANGS)('%s conserva los marcadores {nombre} de es', (lang) => {
    const dictionary: Record<string, string> = DICTIONARIES[lang];
    for (const key of Object.keys(es) as Array<keyof typeof es>) {
      expect(placeholders(dictionary[key] ?? '')).toEqual(placeholders(es[key]));
    }
  });

  it('el nombre de la app no se traduce', () => {
    for (const lang of LANGS) expect(DICTIONARIES[lang]['app.name']).toBe('Manducapp');
  });
});

describe('translate', () => {
  it('interpola parámetros y deja intacto el marcador que no recibe valor', () => {
    expect(translate('es', 'preview.sentences', { count: 17 })).toBe('Oraciones: 17');
    expect(translate('en', 'plan.estimate', { minutes: 22 })).toBe('Estimated time: about 22 min');
    expect(translate('fr', 'preview.sentences', { count: 3 })).toBe('Phrases : 3');
    expect(translate('es', 'preview.credit')).toBe('Traducción: {credit}');
  });

  it('cada idioma traduce de verdad un texto de ejemplo', () => {
    const titles = LANGS.map((lang) => translate(lang, 'home.today'));
    expect(new Set(titles).size).toBe(LANGS.length);
  });
});

describe('detección de idioma', () => {
  it('usa el primer idioma del navegador que esté entre los 6', () => {
    expect(detectLang(['pl-PL'])).toBe('pl');
    expect(detectLang(['ja', 'de-AT'])).toBe('de');
    expect(detectLang(['es_MX', 'en-US'])).toBe('es');
    expect(detectLang(['fr-CA'])).toBe('fr');
  });

  it('si no hay ninguno, inglés', () => {
    expect(detectLang(['ja'])).toBe('en');
    expect(detectLang([])).toBe('en');
  });
});
