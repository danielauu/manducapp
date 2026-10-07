import type { Lang } from '@manducapp/core';

export type SpeakOutcome = 'end' | 'cancelled' | 'error';

export interface SpeakOptions {
  lang: Lang;
  /** 1 es la velocidad normal. */
  rate?: number;
}

/**
 * Voz del dispositivo. Hoy la implementa la Web Speech API del navegador; al envolver la app
 * con Capacitor se podrá cambiar por la voz nativa sin tocar el resto (ver ADR-0002).
 */
export interface TtsPort {
  /** `false` si el navegador no ofrece síntesis de voz. */
  readonly available: boolean;
  /** Lee el texto y termina cuando acaba, lo interrumpen o falla. */
  speak(text: string, options: SpeakOptions): Promise<SpeakOutcome>;
  cancel(): void;
}
