import { LANGS, type Lang } from '@manducapp/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { copyText, describeEnvironment, sleep } from './env';
import { LANG_NAMES, LANG_TAGS, SAMPLES } from './samples';
import { estimateSpeechMs, groupVoicesByLang } from './voices';

interface LogEntry {
  at: number;
  text: string;
}

type Outcome = 'end' | 'error' | 'timeout' | 'cancelled';

const MAX_LOG_ENTRIES = 500;
const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

export function TtsSpike() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [lang, setLang] = useState<Lang>('es');
  const [voiceName, setVoiceName] = useState('');
  const [rate, setRate] = useState(1);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [wakeLockOn, setWakeLockOn] = useState(false);
  const [copied, setCopied] = useState('');

  const startedAt = useRef(performance.now());
  const cancelled = useRef(false);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const wakeLock = useRef<WakeLockSentinel | null>(null);

  const addLog = useCallback((text: string) => {
    const at = Math.round(performance.now() - startedAt.current);
    setLog((previous) => [...previous, { at, text }].slice(-MAX_LOG_ENTRIES));
  }, []);

  useEffect(() => {
    if (!supported) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  // La prueba clave de la pantalla bloqueada: queda registrado cuándo la página se oculta y vuelve.
  useEffect(() => {
    const onVisibility = () => addLog(`Página ${document.visibilityState === 'visible' ? 'VISIBLE' : 'OCULTA'}`);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [addLog]);

  const groups = groupVoicesByLang(voices);
  const langVoices = groups[lang];

  const speakOnce = useCallback(
    (text: string, label: string): Promise<Outcome> =>
      new Promise((resolve) => {
        const synth = window.speechSynthesis;
        const voice = voices.find((candidate) => candidate.name === voiceName);
        const spoken = new SpeechSynthesisUtterance(text);
        spoken.lang = voice?.lang ?? LANG_TAGS[lang];
        if (voice) spoken.voice = voice;
        spoken.rate = rate;
        utterance.current = spoken; // referencia viva: Chrome puede descartar el objeto y perder el evento de fin

        const began = performance.now();
        let boundaries = 0;
        let settled = false;
        const finish = (outcome: Outcome, detail = '') => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timer);
          addLog(`${label}: ${outcome}${detail} (${Math.round(performance.now() - began)} ms, ${boundaries} límites de palabra)`);
          resolve(outcome);
        };
        const timer = window.setTimeout(() => {
          synth.cancel();
          finish('timeout', ': el evento de fin nunca llegó');
        }, estimateSpeechMs(text, rate) * 3 + 10_000);

        spoken.onstart = () => addLog(`${label}: inicio`);
        spoken.onboundary = () => {
          boundaries += 1;
        };
        spoken.onend = () => finish('end');
        spoken.onerror = (event) => {
          const isCancel = event.error === 'canceled' || event.error === 'interrupted';
          finish(isCancel ? 'cancelled' : 'error', ` (${event.error})`);
        };
        synth.speak(spoken);
      }),
    [addLog, lang, rate, voiceName, voices],
  );

  const runSequence = useCallback(
    async (text: string, repetitions: number, gapMs: number, label: string) => {
      setBusy(true);
      cancelled.current = false;
      addLog(`--- ${label}: ${repetitions} repetición(es) ---`);
      let ended = 0;
      for (let index = 1; index <= repetitions && !cancelled.current; index++) {
        const outcome = await speakOnce(text, `${label} #${index}`);
        if (outcome === 'end') ended += 1;
        if (outcome === 'timeout' || outcome === 'error') break;
        if (index < repetitions) await sleep(gapMs);
      }
      addLog(`--- fin: ${ended}/${repetitions} repeticiones con evento de fin ---`);
      setBusy(false);
    },
    [addLog, speakOnce],
  );

  const stop = () => {
    cancelled.current = true;
    window.speechSynthesis.cancel();
    setBusy(false);
    addLog('Detenido por el usuario');
  };

  const toggleWakeLock = async () => {
    if (wakeLock.current) {
      await wakeLock.current.release();
      wakeLock.current = null;
      setWakeLockOn(false);
      addLog('Wake Lock liberado');
      return;
    }
    try {
      const lock = await navigator.wakeLock.request('screen');
      lock.addEventListener('release', () => addLog('Wake Lock liberado por el sistema'));
      wakeLock.current = lock;
      setWakeLockOn(true);
      addLog('Wake Lock activo');
    } catch (error) {
      addLog(`Wake Lock falló: ${String(error)}`);
    }
  };

  const buildReport = () => {
    const lines = ['== Prueba de voz (issue #2) ==', ...describeEnvironment(), '', 'Voces por idioma:'];
    for (const code of LANGS) {
      const list = groups[code].map((voice) => `${voice.name} [${voice.lang}${voice.localService ? ', local' : ', red'}]`);
      lines.push(`  ${code}: ${list.length} -> ${list.join('; ') || '(ninguna)'}`);
    }
    lines.push('', 'Registro:', ...log.map((entry) => `  ${(entry.at / 1000).toFixed(1)} s  ${entry.text}`));
    return lines.join('\n');
  };

  const copyReport = async () => {
    setCopied((await copyText(buildReport())) ? 'Informe copiado' : 'No se pudo copiar; selecciónelo a mano');
  };

  const sample = SAMPLES[lang];

  if (!supported) {
    return (
      <section>
        <h2>1. Voz del dispositivo</h2>
        <p className="bad">Este navegador no ofrece síntesis de voz (speechSynthesis).</p>
      </section>
    );
  }

  return (
    <section>
      <h2>1. Voz del dispositivo</h2>
      <p className="hint">
        Responde a: ¿hay voz para cada idioma?, ¿llega siempre el evento de fin de frase?, ¿qué pasa con la pantalla
        bloqueada?
      </p>

      <div className="row">
        <label>
          Idioma
          <select
            value={lang}
            onChange={(event) => {
              setLang(event.target.value as Lang);
              setVoiceName('');
            }}
          >
            {LANGS.map((code) => (
              <option key={code} value={code}>
                {LANG_NAMES[code]} ({groups[code].length} voces)
              </option>
            ))}
          </select>
        </label>
        <label>
          Voz
          <select value={voiceName} onChange={(event) => setVoiceName(event.target.value)}>
            <option value="">(la predeterminada del idioma)</option>
            {langVoices.map((voice) => (
              <option key={`${voice.name}-${voice.lang}`} value={voice.name}>
                {voice.name} [{voice.lang}] {voice.localService ? '' : '· requiere red'}
              </option>
            ))}
          </select>
        </label>
        <label>
          Velocidad {rate.toFixed(1)}
          <input type="range" min="0.6" max="1.4" step="0.1" value={rate} onChange={(event) => setRate(Number(event.target.value))} />
        </label>
      </div>
      {langVoices.length === 0 && (
        <p className="bad">
          No hay voces para este idioma en el dispositivo (o aún no cargan; espere unos segundos y vuelva a mirar).
        </p>
      )}

      <div className="buttons">
        <button disabled={busy} onClick={() => void runSequence(sample.short, 1, 0, 'Frase corta')}>
          Leer frase corta
        </button>
        <button disabled={busy} onClick={() => void runSequence(sample.long, 1, 0, 'Frase larga')}>
          Leer frase larga (~30 s)
        </button>
        <button disabled={busy} onClick={() => void runSequence(sample.short, 3, 800, 'Repetir 3 veces')}>
          Repetir la corta 3 veces
        </button>
        <button disabled={busy} onClick={() => void runSequence(sample.short, 25, 1500, 'Maratón')}>
          Maratón de 25 repeticiones (~2 min)
        </button>
        <button onClick={stop}>Detener</button>
        <button onClick={() => void toggleWakeLock()}>{wakeLockOn ? 'Soltar pantalla encendida' : 'Mantener pantalla encendida'}</button>
      </div>
      <p className="hint">
        Prueba de pantalla bloqueada: inicie el <strong>maratón</strong>, bloquee el teléfono 20 segundos, desbloquéelo y
        mire en el registro cuántas repeticiones siguieron. Repítalo con y sin «mantener pantalla encendida».
      </p>

      <h3>Registro</h3>
      <pre className="log" aria-live="polite">
        {log.length === 0 ? '(vacío)' : log.map((entry) => `${(entry.at / 1000).toFixed(1).padStart(6)} s  ${entry.text}`).join('\n')}
      </pre>
      <div className="buttons">
        <button onClick={() => void copyReport()}>Copiar informe de voz</button>
        <button onClick={() => setLog([])}>Limpiar registro</button>
        <span className="hint">{copied}</span>
      </div>
    </section>
  );
}
