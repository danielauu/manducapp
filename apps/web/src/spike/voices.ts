import { LANGS, isLang, wordCount, type Lang } from '@manducapp/core';

/** `es-ES`, `es_MX` y `es` pertenecen todos a `es` (Android usa guion bajo). */
export function baseLang(tag: string): string {
  return tag.toLowerCase().replace('_', '-').split('-')[0] ?? '';
}

export function groupVoicesByLang<T extends { lang: string }>(voices: readonly T[]): Record<Lang, T[]> {
  const groups = Object.fromEntries(LANGS.map((lang) => [lang, [] as T[]])) as Record<Lang, T[]>;
  for (const voice of voices) {
    const base = baseLang(voice.lang);
    if (isLang(base)) groups[base].push(voice);
  }
  return groups;
}

/** Duración esperada de una lectura; sirve para detectar un evento de fin que nunca llega. */
export function estimateSpeechMs(text: string, rate = 1, wordsPerSecond = 2.5): number {
  return Math.round((wordCount(text) / (wordsPerSecond * rate)) * 1000);
}
