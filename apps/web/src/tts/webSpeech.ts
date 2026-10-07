import { speechSeconds } from '@manducapp/core';
import { LANG_TAGS } from './langTags';
import type { SpeakOutcome, TtsPort } from './port';

/** Pausa antes de hablar: Chrome puede descartar una lectura pedida justo después de `cancel()`. */
const START_DELAY_MS = 60;
/** Si el evento de fin no llega a tiempo se da la lectura por fallida y la sesión sigue. */
const TIMEOUT_FACTOR = 3;
const TIMEOUT_MARGIN_MS = 10_000;

interface Pending {
  /** Referencia viva: Chrome puede descartar el objeto y perder el evento de fin. */
  utterance: SpeechSynthesisUtterance;
  finish: (outcome: SpeakOutcome) => void;
}

export function createWebSpeechTts(
  synth: SpeechSynthesis | undefined = typeof window !== 'undefined' && 'speechSynthesis' in window
    ? window.speechSynthesis
    : undefined,
): TtsPort {
  let pending: Pending | null = null;

  return {
    available: synth !== undefined,

    speak(text, { lang, rate = 1 }) {
      const engine = synth;
      if (!engine) return Promise.resolve<SpeakOutcome>('error');

      if (pending) {
        pending.finish('cancelled');
        engine.cancel();
      }

      return new Promise<SpeakOutcome>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = LANG_TAGS[lang];
        utterance.rate = rate;

        let settled = false;
        const finish = (outcome: SpeakOutcome) => {
          if (settled) return;
          settled = true;
          clearTimeout(startTimer);
          clearTimeout(timeoutTimer);
          if (pending?.finish === finish) pending = null;
          resolve(outcome);
        };
        pending = { utterance, finish };

        const expectedMs = (speechSeconds(text) * 1000) / rate;
        const timeoutTimer = setTimeout(() => {
          engine.cancel();
          finish('error');
        }, expectedMs * TIMEOUT_FACTOR + TIMEOUT_MARGIN_MS);
        const startTimer = setTimeout(() => engine.speak(utterance), START_DELAY_MS);

        utterance.onend = () => finish('end');
        utterance.onerror = (event) =>
          finish(event.error === 'canceled' || event.error === 'interrupted' ? 'cancelled' : 'error');
      });
    },

    cancel() {
      const current = pending;
      pending = null;
      current?.finish('cancelled');
      synth?.cancel();
    },
  };
}
