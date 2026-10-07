import { buildSession, type SessionStep } from '@manducapp/core';
import { useEffect, useId, useMemo, type CSSProperties } from 'react';
import { Layout } from '../components/Layout';
import type { MessageKey } from '../i18n';
import { RATE_OPTIONS, usePlayerSettings } from '../session/playerSettings';
import { useSessionPlayer } from '../session/useSessionPlayer';
import { useWakeLock } from '../session/useWakeLock';
import { planSession } from '../services/plan';
import { useApp } from '../state/AppContext';
import { createWebSpeechTts } from '../tts/webSpeech';
import { navigate } from '../useRoute';

type Translate = ReturnType<typeof useApp>['t'];

const KIND_LABELS: Record<SessionStep['kind'], MessageKey> = {
  learn: 'session.kind.learn',
  link: 'session.kind.link',
  block: 'session.kind.block',
  final: 'session.kind.final',
  reflection: 'session.done.title',
};

function stepHeading(t: Translate, step: SessionStep, sentenceCount: number): string {
  const kind = t(KIND_LABELS[step.kind]);
  switch (step.kind) {
    case 'learn':
      return `${kind} · ${t('session.sentence', { current: step.from + 1, total: sentenceCount })}`;
    case 'link':
    case 'block':
      return `${kind} · ${t('session.sentences', { from: step.from + 1, to: step.to + 1 })}`;
    default:
      return kind;
  }
}

export function Session() {
  const { state } = useApp();
  const gospel = state.gospel;

  // Si se recarga la página directamente en esta ruta no hay texto elegido: se vuelve al inicio.
  useEffect(() => {
    if (!gospel) navigate('home');
  }, [gospel]);

  const steps = useMemo(() => {
    if (!gospel) return [];
    const plan = planSession(gospel.sentences, state.budgetMinutes, state.strategy, state.count);
    return buildSession(gospel.sentences.slice(0, plan.count), { strategy: state.strategy });
  }, [gospel, state.budgetMinutes, state.strategy, state.count]);

  if (!gospel || steps.length === 0) return null;
  const lastSentence = steps.find((step) => step.kind === 'final')?.to ?? -1;
  return <Player steps={steps} sentenceCount={lastSentence + 1} />;
}

function Player({ steps, sentenceCount }: { steps: readonly SessionStep[]; sentenceCount: number }) {
  const { state: app, t } = useApp();
  const [settings, updateSettings] = usePlayerSettings();
  const tts = useMemo(createWebSpeechTts, []);
  const rateId = useId();

  const player = useSessionPlayer({
    steps,
    lang: app.lang,
    rate: settings.rate,
    autoAdvance: settings.autoAdvance,
    voiceEveryRepetition: settings.voiceEveryRepetition,
    tts,
  });
  const { state, step } = player;
  const finished = state.phase === 'done';
  const wakeLock = useWakeLock(!finished);

  if (finished || !step) {
    return (
      <Layout back="preview">
        <h1>{t('session.done.title')}</h1>
        <p className="muted">{t('session.done.text')}</p>
        <div className="actions">
          <button onClick={() => navigate('preview')}>{t('session.done.back')}</button>
        </div>
      </Layout>
    );
  }

  const turnPhase = state.phase === 'turn';
  const prompt = step.kind === 'final' ? t('session.yourTurnFinal') : t('session.yourTurn');
  const status = state.paused ? t('session.paused') : turnPhase ? prompt : t('session.listening');

  return (
    <Layout back="preview">
      <div
        className="progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={steps.length - 1}
        aria-valuenow={state.index}
        aria-label={t('session.progress', { current: state.index + 1, total: steps.length - 1 })}
      >
        <span style={{ width: `${Math.round(player.progress * 100)}%` }} />
      </div>
      <p className="eyebrow">{stepHeading(t, step, sentenceCount)}</p>
      {step.repetitions > 1 && (
        <p className="meta">{t('session.repetition', { current: step.repetition, total: step.repetitions })}</p>
      )}

      <blockquote className="stage" lang={app.lang}>
        {step.text}
      </blockquote>

      <p className={turnPhase && !state.paused ? 'phase turn' : 'phase'} role="status">
        {status}
      </p>
      {turnPhase && settings.autoAdvance && (
        <div className={state.paused ? 'countdown paused' : 'countdown'} aria-hidden="true">
          <span key={state.nonce} style={{ '--turn': `${player.turnMs}ms` } as CSSProperties} />
        </div>
      )}

      {!tts.available && <p className="banner soft">{t('session.noVoice')}</p>}
      {player.voiceFailed && <p className="banner soft">{t('session.voiceError')}</p>}
      {player.interrupted && <p className="banner" role="alert">{t('session.interrupted')}</p>}
      {wakeLock === 'unsupported' && <p className="banner soft">{t('session.noWakeLock')}</p>}

      <div className="controls">
        <button className="secondary" onClick={player.previous} disabled={state.index === 0}>
          ← {t('session.previous')}
        </button>
        {state.paused ? (
          <button onClick={player.resume}>{t('session.resume')}</button>
        ) : (
          <button onClick={player.pause}>{t('session.pause')}</button>
        )}
        <button className="secondary" onClick={player.next}>
          {t('session.next')} →
        </button>
      </div>
      {tts.available && (
        <div className="controls">
          <button className="secondary" onClick={player.replay} disabled={state.paused}>
            {t('session.replay')}
          </button>
        </div>
      )}

      <details className="player-settings">
        <summary>{t('session.settings')}</summary>
        <label className="check">
          <input
            type="checkbox"
            checked={settings.autoAdvance}
            onChange={(event) => updateSettings({ autoAdvance: event.target.checked })}
          />
          {t('session.auto')}
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={settings.voiceEveryRepetition}
            onChange={(event) => updateSettings({ voiceEveryRepetition: event.target.checked })}
          />
          {t('session.voiceEvery')}
        </label>
        <div className="field">
          <label htmlFor={rateId}>{t('session.speed')}</label>
          <select
            id={rateId}
            value={settings.rate}
            onChange={(event) => updateSettings({ rate: Number(event.target.value) })}
          >
            {RATE_OPTIONS.map((rate) => (
              <option key={rate} value={rate}>
                {rate}×
              </option>
            ))}
          </select>
        </div>
      </details>
    </Layout>
  );
}
