import { recitationSeconds, type Lang, type SessionStep } from '@manducapp/core';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { TtsPort } from '../tts/port';
import {
  initialPlayerState,
  progressOf,
  reducePlayer,
  type PlayerAction,
  type PlayerConfig,
  type PlayerState,
} from './engine';

export interface PlayerOptions {
  steps: readonly SessionStep[];
  lang: Lang;
  rate: number;
  autoAdvance: boolean;
  voiceEveryRepetition: boolean;
  tts: TtsPort;
}

export interface SessionPlayer {
  state: PlayerState;
  step: SessionStep | undefined;
  progress: number;
  /** Tiempo que se le da a quien reza para repetir el paso actual. */
  turnMs: number;
  /** La voz falló en este paso; la sesión sigue con el texto en pantalla. */
  voiceFailed: boolean;
  /** La sesión se pausó sola porque la página pasó a segundo plano. */
  interrupted: boolean;
  next: () => void;
  previous: () => void;
  replay: () => void;
  pause: () => void;
  resume: () => void;
}

export function useSessionPlayer(options: PlayerOptions): SessionPlayer {
  const { steps, lang, rate, autoAdvance, voiceEveryRepetition, tts } = options;
  const config = useMemo<PlayerConfig>(
    () => ({ steps, voiceEveryRepetition, voiceAvailable: tts.available }),
    [steps, voiceEveryRepetition, tts.available],
  );
  const [state, dispatch] = useReducer(
    (current: PlayerState, action: PlayerAction) => reducePlayer(current, action, config),
    config,
    initialPlayerState,
  );
  const [voiceFailed, setVoiceFailed] = useState(false);
  const [interrupted, setInterrupted] = useState(false);

  const step = steps[state.index];
  const turnMs = step && state.phase === 'turn' ? recitationSeconds(step.text) * 1000 : 0;

  // El idioma y la velocidad se leen al hablar; cambiarlos a mitad de una lectura no la reinicia.
  const speech = useRef({ lang, rate });
  useEffect(() => {
    speech.current = { lang, rate };
  }, [lang, rate]);

  // Fase de voz: lee el texto del paso y, al terminar, le da el turno a quien reza.
  useEffect(() => {
    if (state.paused || state.phase !== 'voice' || !step) return;
    let active = true;
    setVoiceFailed(false);
    void tts.speak(step.text, speech.current).then((outcome) => {
      if (!active) return;
      if (outcome === 'error') setVoiceFailed(true);
      dispatch({ type: 'voiceEnded' });
    });
    return () => {
      active = false;
      tts.cancel();
    };
    // `state.nonce` reinicia la lectura al pedir «escuchar de nuevo» o al seguir tras una pausa.
  }, [state.index, state.phase, state.paused, state.nonce, step, tts]);

  // Fase de turno: con avance automático pasa solo al siguiente paso cuando se acaba el tiempo.
  useEffect(() => {
    // El recitado final no avanza solo: quien reza decide cuándo terminó.
    if (state.paused || state.phase !== 'turn' || !autoAdvance || step?.kind === 'final') return;
    const timer = window.setTimeout(() => dispatch({ type: 'next' }), turnMs);
    return () => window.clearTimeout(timer);
  }, [state.index, state.phase, state.paused, state.nonce, autoAdvance, turnMs, step]);

  // ADR-0002: si la página pasa a segundo plano, la sesión se pausa y se avisa al volver.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        dispatch({ type: 'pause' });
        setInterrupted(true);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const resume = useCallback(() => {
    setInterrupted(false);
    dispatch({ type: 'resume' });
  }, []);

  return {
    state,
    step,
    progress: progressOf(state, config),
    turnMs,
    voiceFailed,
    interrupted,
    next: useCallback(() => dispatch({ type: 'next' }), []),
    previous: useCallback(() => dispatch({ type: 'previous' }), []),
    replay: useCallback(() => dispatch({ type: 'replay' }), []),
    pause: useCallback(() => dispatch({ type: 'pause' }), []),
    resume,
  };
}
