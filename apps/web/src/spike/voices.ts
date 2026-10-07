import { wordCount } from '@manducapp/core';

/** Duración esperada de una lectura; sirve para detectar un evento de fin que nunca llega. */
export function estimateSpeechMs(text: string, rate = 1, wordsPerSecond = 2.5): number {
  return Math.round((wordCount(text) / (wordsPerSecond * rate)) * 1000);
}
