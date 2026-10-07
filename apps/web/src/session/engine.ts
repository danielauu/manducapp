import { hasVoice, type SessionStep } from '@manducapp/core';

/**
 * - `voice`: la voz lee el texto del paso.
 * - `turn`: le toca a quien reza repetirlo en voz alta.
 * - `done`: se llegó al final de la sesión (el paso de reflexión).
 */
export type Phase = 'voice' | 'turn' | 'done';

export interface PlayerState {
  index: number;
  phase: Phase;
  paused: boolean;
  /** Cambia al reiniciar una fase (escuchar de nuevo, seguir tras una pausa) para que se vuelva a ejecutar. */
  nonce: number;
}

export type PlayerAction =
  | { type: 'voiceEnded' }
  | { type: 'next' }
  | { type: 'previous' }
  | { type: 'replay' }
  | { type: 'pause' }
  | { type: 'resume' };

export interface PlayerConfig {
  steps: readonly SessionStep[];
  /** Si la voz lee cada repetición y no solo la primera de cada oración. */
  voiceEveryRepetition: boolean;
  /** Sin voz en el dispositivo, la sesión sigue solo con el texto en pantalla. */
  voiceAvailable: boolean;
}

function phaseFor(step: SessionStep | undefined, config: PlayerConfig): Phase {
  if (!step || step.kind === 'reflection') return 'done';
  const voiced = hasVoice(step, { voiceOnEveryRepetition: config.voiceEveryRepetition });
  return config.voiceAvailable && voiced ? 'voice' : 'turn';
}

function enter(config: PlayerConfig, index: number, paused: boolean, nonce: number): PlayerState {
  const clamped = Math.min(Math.max(index, 0), Math.max(config.steps.length - 1, 0));
  return { index: clamped, phase: phaseFor(config.steps[clamped], config), paused, nonce: nonce + 1 };
}

export function initialPlayerState(config: PlayerConfig): PlayerState {
  return enter(config, 0, false, 0);
}

export function reducePlayer(state: PlayerState, action: PlayerAction, config: PlayerConfig): PlayerState {
  switch (action.type) {
    case 'voiceEnded':
      return state.phase === 'voice' ? { ...state, phase: 'turn' } : state;
    case 'next':
      return state.phase === 'done' ? state : enter(config, state.index + 1, state.paused, state.nonce);
    case 'previous':
      // La reflexión es siempre el último paso, así que desde el final se vuelve al último paso de verdad.
      return enter(config, state.index - 1, state.paused, state.nonce);
    case 'replay':
      // Se puede volver a escuchar cualquier paso con texto, tenga o no voz de forma habitual.
      return state.phase === 'done' || !config.voiceAvailable
        ? state
        : { ...state, phase: 'voice', nonce: state.nonce + 1 };
    case 'pause':
      return state.paused ? state : { ...state, paused: true };
    case 'resume':
      return state.paused ? { ...state, paused: false, nonce: state.nonce + 1 } : state;
  }
}

/** Avance de 0 a 1 para la barra de progreso. */
export function progressOf(state: PlayerState, config: PlayerConfig): number {
  const last = config.steps.length - 1;
  return last <= 0 ? 1 : Math.min(state.index / last, 1);
}
