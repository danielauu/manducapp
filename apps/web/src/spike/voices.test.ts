import { describe, expect, it } from 'vitest';
import { baseLang, estimateSpeechMs, groupVoicesByLang } from './voices';

describe('baseLang', () => {
  it('reduce las variantes regionales al idioma base', () => {
    expect(baseLang('es-ES')).toBe('es');
    expect(baseLang('es_MX')).toBe('es');
    expect(baseLang('PL')).toBe('pl');
    expect(baseLang('')).toBe('');
  });
});

describe('groupVoicesByLang', () => {
  it('agrupa por los 6 idiomas y descarta el resto', () => {
    const voices = [
      { name: 'a', lang: 'es-CL' },
      { name: 'b', lang: 'es_ES' },
      { name: 'c', lang: 'pl-PL' },
      { name: 'd', lang: 'ja-JP' },
      { name: 'e', lang: 'de-DE' },
    ];
    const groups = groupVoicesByLang(voices);
    expect(groups.es.map((voice) => voice.name)).toEqual(['a', 'b']);
    expect(groups.pl.map((voice) => voice.name)).toEqual(['c']);
    expect(groups.de.map((voice) => voice.name)).toEqual(['e']);
    expect(groups.en).toEqual([]);
    expect(groups.fr).toEqual([]);
    expect(groups.it).toEqual([]);
  });
});

describe('estimateSpeechMs', () => {
  it('escala con las palabras y la velocidad', () => {
    expect(estimateSpeechMs('uno dos tres cuatro cinco')).toBe(2000);
    expect(estimateSpeechMs('uno dos tres cuatro cinco', 2)).toBe(1000);
    expect(estimateSpeechMs('')).toBe(0);
  });
});
