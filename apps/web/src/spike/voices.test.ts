import { describe, expect, it } from 'vitest';
import { estimateSpeechMs } from './voices';

describe('estimateSpeechMs', () => {
  it('escala con las palabras y la velocidad', () => {
    expect(estimateSpeechMs('uno dos tres cuatro cinco')).toBe(2000);
    expect(estimateSpeechMs('uno dos tres cuatro cinco', 2)).toBe(1000);
    expect(estimateSpeechMs('')).toBe(0);
  });
});
