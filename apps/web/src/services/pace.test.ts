import { buildSession, estimateSessionSeconds, recitationSeconds } from '@manducapp/core';
import { describe, expect, it } from 'vitest';
import { DEFAULT_PACE, PACES, timingFromSettings } from './pace';

const sentence = Array.from({ length: 15 }, (_, index) => `p${index}`).join(' ');

describe('pace', () => {
  it('el ritmo normal es el predeterminado y coincide con los valores del núcleo', () => {
    expect(DEFAULT_PACE).toBe('normal');
    expect(PACES).toEqual(['slow', 'normal', 'fast']);
    const normal = timingFromSettings({ pace: 'normal', voiceEveryRepetition: false });
    expect(normal).toMatchObject({ recitationFactor: 1.2, gapSeconds: 1, voiceOnEveryRepetition: false });
    expect(recitationSeconds(sentence, normal)).toBeCloseTo(recitationSeconds(sentence), 5);
  });

  it('más lento tarda más y más rápido tarda menos en repetir la misma oración', () => {
    const seconds = (pace: 'slow' | 'normal' | 'fast') =>
      recitationSeconds(sentence, timingFromSettings({ pace, voiceEveryRepetition: false }));
    expect(seconds('slow')).toBeGreaterThan(seconds('normal'));
    expect(seconds('fast')).toBeLessThan(seconds('normal'));
  });

  it('el ritmo cambia la duración de toda una sesión', () => {
    const steps = buildSession([sentence, sentence, sentence], { people: 3 });
    const total = (pace: 'slow' | 'normal' | 'fast') =>
      estimateSessionSeconds(steps, timingFromSettings({ pace, voiceEveryRepetition: false }));
    expect(total('slow')).toBeGreaterThan(total('normal'));
    expect(total('normal')).toBeGreaterThan(total('fast'));
  });

  it('la voz en cada repetición alarga la estimación', () => {
    const steps = buildSession([sentence, sentence]);
    const without = estimateSessionSeconds(steps, timingFromSettings({ pace: 'normal', voiceEveryRepetition: false }));
    const withVoice = estimateSessionSeconds(steps, timingFromSettings({ pace: 'normal', voiceEveryRepetition: true }));
    expect(withVoice).toBeGreaterThan(without);
  });
});
