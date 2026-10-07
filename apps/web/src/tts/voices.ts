import { LANGS, isLang, type Lang } from '@manducapp/core';

export interface VoiceOption {
  name: string;
  /** Etiqueta BCP 47 que reporta el dispositivo, por ejemplo `es-CL` o `es_ES`. */
  lang: string;
  /** `false` si la voz necesita conexión a internet. */
  local: boolean;
}

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

/** Primero las voces locales (funcionan sin conexión) y, dentro de cada grupo, por nombre. */
export function sortVoices(voices: readonly VoiceOption[]): VoiceOption[] {
  return [...voices].sort((a, b) => Number(b.local) - Number(a.local) || a.name.localeCompare(b.name));
}
