import {
  buildSession,
  estimateSessionSeconds,
  fitToBudget,
  type LinkStrategy,
} from '@manducapp/core';

export const BUDGET_OPTIONS_MINUTES = [10, 15, 20, 30, 45, 60] as const;
export const DEFAULT_BUDGET_MINUTES = 30;

export const STRATEGIES: readonly LinkStrategy[] = ['pairs-and-blocks', 'cumulative', 'minimal'];
export const DEFAULT_STRATEGY: LinkStrategy = 'pairs-and-blocks';

/** Cuánto del texto se memoriza y cuánto tardaría, según el tiempo disponible. */
export interface Plan {
  total: number;
  /** Hasta qué oración propone memorizar la app para no pasar del tiempo disponible. */
  suggested: number;
  /** Oraciones que se memorizan: lo elegido por el usuario o, si no eligió, lo sugerido. */
  count: number;
  seconds: number;
  minutes: number;
  /** `false` si lo elegido (o ni una oración) supera el tiempo disponible. */
  fits: boolean;
}

export function planSession(
  sentences: readonly string[],
  budgetMinutes: number,
  strategy: LinkStrategy,
  chosenCount: number | null,
): Plan {
  const total = sentences.length;
  const options = { strategy };
  const suggested = fitToBudget(sentences, budgetMinutes * 60, options).count;
  const count = Math.min(Math.max(chosenCount ?? suggested, Math.min(1, total)), total);
  const seconds = estimateSessionSeconds(buildSession(sentences.slice(0, count), options));
  return {
    total,
    suggested,
    count,
    seconds,
    minutes: Math.max(1, Math.round(seconds / 60)),
    fits: seconds <= budgetMinutes * 60,
  };
}
