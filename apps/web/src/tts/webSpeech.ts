import { speechSeconds } from '@manducapp/core';
import { LANG_TAGS } from './langTags';
import type { SpeakOutcome, TtsPort } from './port';
import { baseLang, groupVoicesByLang, sortVoices, type VoiceOption } from './voices';

/** Pausa antes de hablar: Chrome puede descartar una lectura pedida justo después de `cancel()`. */
const START_DELAY_MS = 60;
/** En algunos navegadores las voces se cargan un instante después de abrir la página. */
const VOICES_WAIT_MS = 1500;
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

    speak(text, { lang, rate = 1, voiceName }) {
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
        // Una voz que ya no existe (otro dispositivo, voz desinstalada) se ignora y se usa la predeterminada.
        const voice = voiceName
          ? engine.getVoices().find((candidate) => candidate.name === voiceName && baseLang(candidate.lang) === lang)
          : undefined;
        if (voice) {
          utterance.voice = voice;
          utterance.lang = voice.lang;
        }

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

    voices(lang) {
      const engine = synth;
      if (!engine) return Promise.resolve([]);
      const read = (): VoiceOption[] =>
        sortVoices(
          groupVoicesByLang(engine.getVoices())[lang].map((voice) => ({
            name: voice.name,
            lang: voice.lang,
            local: voice.localService,
          })),
        );
      const ready = read();
      if (ready.length > 0) return Promise.resolve(ready);
      return new Promise<VoiceOption[]>((resolve) => {
        const done = () => {
          engine.removeEventListener('voiceschanged', done);
          clearTimeout(timer);
          resolve(read());
        };
        const timer = setTimeout(done, VOICES_WAIT_MS);
        engine.addEventListener('voiceschanged', done);
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
