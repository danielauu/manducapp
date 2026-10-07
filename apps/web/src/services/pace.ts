import type { TimingOptions } from '@manducapp/core';

/** Cuánto tarda quien reza en repetir cada paso: un parámetro a calibrar con grupos reales. */
export type Pace = 'slow' | 'normal' | 'fast';

export const PACES: readonly Pace[] = ['slow', 'normal', 'fast'];
export const DEFAULT_PACE: Pace = 'normal';

/**
 * Tiempo de repetición = (lo que tarda la voz) × `recitationFactor` + `gapSeconds`.
 * `normal` coincide con los valores por defecto del núcleo.
 */
const PACE_TIMING: Record<Pace, Pick<TimingOptions, 'recitationFactor' | 'gapSeconds'>> = {
  slow: { recitationFactor: 1.6, gapSeconds: 1.5 },
  normal: { recitationFactor: 1.2, gapSeconds: 1 },
  fast: { recitationFactor: 0.8, gapSeconds: 0.3 },
};

/**
 * Los ajustes del usuario que cambian cuánto dura una sesión. La estimación de la vista previa y el
 * contador del reproductor usan lo mismo, para que coincidan.
 */
export function timingFromSettings(settings: { pace: Pace; voiceEveryRepetition: boolean }): TimingOptions {
  return { ...PACE_TIMING[settings.pace], voiceOnEveryRepetition: settings.voiceEveryRepetition };
}
