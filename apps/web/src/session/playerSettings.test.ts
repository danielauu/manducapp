import { describe, expect, it } from 'vitest';
import { DEFAULT_PLAYER_SETTINGS, parsePlayerSettings } from './playerSettings';

describe('parsePlayerSettings', () => {
  it('sin nada guardado usa los valores por defecto', () => {
    expect(parsePlayerSettings(null)).toEqual(DEFAULT_PLAYER_SETTINGS);
    expect(DEFAULT_PLAYER_SETTINGS).toEqual({
      autoAdvance: true,
      voiceEveryRepetition: false,
      hideFinalText: true,
      rate: 1,
      voices: {},
    });
  });

  it('acepta valores válidos', () => {
    expect(
      parsePlayerSettings('{"autoAdvance":false,"voiceEveryRepetition":true,"hideFinalText":false,"rate":0.8}'),
    ).toEqual({ autoAdvance: false, voiceEveryRepetition: true, hideFinalText: false, rate: 0.8, voices: {} });
  });

  it('descarta lo inválido campo por campo y no se rompe con basura', () => {
    expect(parsePlayerSettings('{"autoAdvance":"sí","voiceEveryRepetition":true,"hideFinalText":1,"rate":3}')).toEqual({
      autoAdvance: true,
      voiceEveryRepetition: true,
      hideFinalText: true,
      rate: 1,
      voices: {},
    });
    expect(parsePlayerSettings('no es json')).toEqual(DEFAULT_PLAYER_SETTINGS);
    expect(parsePlayerSettings('[1,2]')).toEqual(DEFAULT_PLAYER_SETTINGS);
    expect(parsePlayerSettings('null')).toEqual(DEFAULT_PLAYER_SETTINGS);
  });
});

describe('voz elegida por idioma', () => {
  it('conserva solo los idiomas válidos con un nombre de voz razonable', () => {
    const raw = JSON.stringify({ voices: { es: 'Voz A', pl: 'Voz B', xx: 'Voz C', fr: '', de: 7, it: 'x'.repeat(300) } });
    expect(parsePlayerSettings(raw).voices).toEqual({ es: 'Voz A', pl: 'Voz B' });
  });

  it('descarta lo que no sea un objeto', () => {
    expect(parsePlayerSettings('{"voices":["es"]}').voices).toEqual({});
    expect(parsePlayerSettings('{"voices":"es"}').voices).toEqual({});
    expect(parsePlayerSettings('{"voices":null}').voices).toEqual({});
  });
});
