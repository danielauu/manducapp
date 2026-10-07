import { describe, expect, it } from 'vitest';
import { en } from './en';
import { es } from './es';
import { detectReadingLang, detectUiLang, translate } from './index';

describe('diccionarios', () => {
  it('es y en tienen exactamente las mismas claves y ninguna vacía', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort());
    for (const value of [...Object.values(es), ...Object.values(en)]) {
      expect(value.trim().length).toBeGreaterThan(0);
    }
  });

  it('los marcadores {nombre} coinciden entre idiomas', () => {
    const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();
    for (const key of Object.keys(es) as Array<keyof typeof es>) {
      expect(placeholders(en[key])).toEqual(placeholders(es[key]));
    }
  });
});

describe('translate', () => {
  it('interpola parámetros y deja intacto el marcador que no recibe valor', () => {
    expect(translate('es', 'preview.sentences', { count: 17 })).toBe('Oraciones: 17');
    expect(translate('en', 'plan.estimate', { minutes: 22 })).toBe('Estimated time: about 22 min');
    expect(translate('es', 'preview.credit')).toBe('Traducción: {credit}');
  });
});

describe('detección de idioma', () => {
  it('la interfaz usa el primer idioma disponible del navegador', () => {
    expect(detectUiLang(['es-CL', 'en-US'])).toBe('es');
    expect(detectUiLang(['fr-FR', 'en-GB'])).toBe('en');
    expect(detectUiLang(['ja'])).toBe('en');
    expect(detectUiLang([])).toBe('en');
  });

  it('el idioma del evangelio usa el primero de los 6 que tenga el navegador', () => {
    expect(detectReadingLang(['pl-PL'])).toBe('pl');
    expect(detectReadingLang(['ja', 'de-AT'])).toBe('de');
    expect(detectReadingLang(['es_MX'])).toBe('es');
    expect(detectReadingLang(['ja'])).toBe('en');
  });
});
