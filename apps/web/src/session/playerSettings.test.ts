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
    });
  });

  it('acepta valores válidos', () => {
    expect(
      parsePlayerSettings('{"autoAdvance":false,"voiceEveryRepetition":true,"hideFinalText":false,"rate":0.8}'),
    ).toEqual({ autoAdvance: false, voiceEveryRepetition: true, hideFinalText: false, rate: 0.8 });
  });

  it('descarta lo inválido campo por campo y no se rompe con basura', () => {
    expect(parsePlayerSettings('{"autoAdvance":"sí","voiceEveryRepetition":true,"hideFinalText":1,"rate":3}')).toEqual({
      autoAdvance: true,
      voiceEveryRepetition: true,
      hideFinalText: true,
      rate: 1,
    });
    expect(parsePlayerSettings('no es json')).toEqual(DEFAULT_PLAYER_SETTINGS);
    expect(parsePlayerSettings('[1,2]')).toEqual(DEFAULT_PLAYER_SETTINGS);
    expect(parsePlayerSettings('null')).toEqual(DEFAULT_PLAYER_SETTINGS);
  });
});
