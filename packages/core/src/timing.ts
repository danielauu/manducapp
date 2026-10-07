import { buildSession, type SessionOptions, type SessionStep } from './session';
import { wordCount } from './text';

export interface TimingOptions {
  /** Velocidad de la voz y del recitado. */
  wordsPerSecond?: number;
  /** Quien repite suele tardar algo más que la voz. */
  recitationFactor?: number;
  /** Pausa fija entre repeticiones. */
  gapSeconds?: number;
  /** Por defecto la voz lee la oración solo antes de la primera repetición. */
  voiceOnEveryRepetition?: boolean;
}

export const DEFAULT_WORDS_PER_SECOND = 2.5;
export const DEFAULT_RECITATION_FACTOR = 1.2;
export const DEFAULT_GAP_SECONDS = 1;
export const DEFAULT_BUDGET_SECONDS = 30 * 60;

export function stepSeconds(step: SessionStep, options: TimingOptions = {}): number {
  if (step.kind === 'reflection') return 0;
  const wordsPerSecond = options.wordsPerSecond ?? DEFAULT_WORDS_PER_SECOND;
  const factor = options.recitationFactor ?? DEFAULT_RECITATION_FACTOR;
  const gap = options.gapSeconds ?? DEFAULT_GAP_SECONDS;

  const speech = wordCount(step.text) / wordsPerSecond;
  const voice = step.kind === 'learn' && (step.repetition === 1 || options.voiceOnEveryRepetition) ? speech : 0;
  return voice + speech * factor + gap;
}

/** La reflexión final no cuenta: el presupuesto es para memorizar. */
export function estimateSessionSeconds(steps: readonly SessionStep[], options: TimingOptions = {}): number {
  return steps.reduce((total, step) => total + stepSeconds(step, options), 0);
}

export interface BudgetFit {
  /** Cuántas oraciones del inicio se memorizan. */
  count: number;
  /** Duración estimada de esas `count` oraciones. */
  seconds: number;
  /** Duración estimada si se memorizara todo el texto. */
  totalSeconds: number;
  /** `false` solo si ni una oración cabe en el presupuesto. */
  fits: boolean;
}

const SENTENCE_END = /[.!?…]["'»”’)]*$/;
const NATURAL_END_LOOKBACK = 4;

/**
 * Propone hasta qué oración memorizar para no pasar del presupuesto. Si hay que recortar,
 * prefiere terminar en un punto final cercano antes que en medio de una frase.
 */
export function fitToBudget(
  sentences: readonly string[],
  budgetSeconds: number = DEFAULT_BUDGET_SECONDS,
  session: SessionOptions = {},
  timing: TimingOptions = {},
): BudgetFit {
  const secondsFor = (count: number) =>
    estimateSessionSeconds(buildSession(sentences.slice(0, count), session), timing);

  const total = sentences.length;
  const totalSeconds = secondsFor(total);
  if (total === 0 || totalSeconds <= budgetSeconds) {
    return { count: total, seconds: totalSeconds, totalSeconds, fits: true };
  }

  let count = total - 1;
  while (count > 1 && secondsFor(count) > budgetSeconds) count--;
  if (secondsFor(count) > budgetSeconds) {
    return { count: 1, seconds: secondsFor(1), totalSeconds, fits: false };
  }

  for (let candidate = count; candidate > Math.max(0, count - NATURAL_END_LOOKBACK); candidate--) {
    if (SENTENCE_END.test(sentences[candidate - 1] ?? '')) {
      count = candidate;
      break;
    }
  }
  return { count, seconds: secondsFor(count), totalSeconds, fits: true };
}
