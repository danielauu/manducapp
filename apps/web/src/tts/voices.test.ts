import { describe, expect, it } from 'vitest';
import { baseLang, groupVoicesByLang, sortVoices, type VoiceOption } from './voices';

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

describe('sortVoices', () => {
  const voice = (name: string, local: boolean): VoiceOption => ({ name, lang: 'es-ES', local });

  it('pone primero las voces locales y ordena por nombre dentro de cada grupo', () => {
    const sorted = sortVoices([voice('Zeta', true), voice('Alfa', false), voice('Beta', true), voice('Gamma', false)]);
    expect(sorted.map((item) => item.name)).toEqual(['Beta', 'Zeta', 'Alfa', 'Gamma']);
  });

  it('no modifica la lista original', () => {
    const original = [voice('B', true), voice('A', true)];
    sortVoices(original);
    expect(original.map((item) => item.name)).toEqual(['B', 'A']);
  });
});
