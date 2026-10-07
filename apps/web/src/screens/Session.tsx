import { buildSession, type SessionStep } from '@manducapp/core';
import { useEffect, useId, useMemo, useState, type CSSProperties } from 'react';
import { Layout } from '../components/Layout';
import type { MessageKey } from '../i18n';
import { RATE_OPTIONS, usePlayerSettings } from '../session/playerSettings';
import { useSessionPlayer } from '../session/useSessionPlayer';
import { useWakeLock } from '../session/useWakeLock';
import { displayName } from '../services/group';
import { PACES, timingFromSettings } from '../services/pace';
import { planSession } from '../services/plan';
import type { GospelView } from '../services/view';
import { useApp } from '../state/AppContext';
import { createWebSpeechTts } from '../tts/webSpeech';
import { navigate } from '../useRoute';
import { Reflection } from './Reflection';

type Translate = ReturnType<typeof useApp>['t'];

const KIND_LABELS: Record<SessionStep['kind'], MessageKey> = {
  learn: 'session.kind.learn',
  link: 'session.kind.link',
  block: 'session.kind.block',
  final: 'session.kind.final',
  reflection: 'reflection.silenceTitle',
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
  const [player] = usePlayerSettings();
  const timing = useMemo(
    () => timingFromSettings({ pace: player.pace, voiceEveryRepetition: player.voiceEveryRepetition }),
    [player.pace, player.voiceEveryRepetition],
  );

  // Si se recarga la página directamente en esta ruta no hay texto elegido: se vuelve al inicio.
  useEffect(() => {
    if (!gospel) navigate('home');
  }, [gospel]);

  const memorized = useMemo(() => {
    if (!gospel) return [];
    const plan = planSession(gospel.sentences, state.budgetMinutes, state.strategy, state.count, state.people, timing);
    return gospel.sentences.slice(0, plan.count);
  }, [gospel, state.budgetMinutes, state.strategy, state.count, state.people, timing]);
  const steps = useMemo(
    () => buildSession(memorized, { strategy: state.strategy, people: state.people }),
    [memorized, state.strategy, state.people],
  );

  if (!gospel || steps.length === 0) return null;
  return <Player gospel={gospel} sentences={memorized} steps={steps} />;
}

interface PlayerProps {
  gospel: GospelView;
  /** Las oraciones que se memorizan en esta sesión. */
  sentences: readonly string[];
  steps: readonly SessionStep[];
}

function Player({ gospel, sentences, steps }: PlayerProps) {
  const { state: app, t } = useApp();
  const [settings, updateSettings] = usePlayerSettings();
  const tts = useMemo(createWebSpeechTts, []);
  const rateId = useId();
  const paceId = useId();
  const [peeking, setPeeking] = useState(false);

  const player = useSessionPlayer({
    steps,
    lang: app.lang,
    rate: settings.rate,
    voiceName: settings.voices[app.lang],
    autoAdvance: settings.autoAdvance,
    voiceEveryRepetition: settings.voiceEveryRepetition,
    timing: timingFromSettings({ pace: settings.pace, voiceEveryRepetition: settings.voiceEveryRepetition }),
    tts,
  });
  const { state, step } = player;
  const finished = state.phase === 'done';
  const wakeLock = useWakeLock(!finished);

  // El texto vuelve a ocultarse al cambiar de paso.
  useEffect(() => {
    setPeeking(false);
  }, [state.index]);

  if (finished || !step) return <Reflection gospel={gospel} sentences={sentences} />;

  const isFinal = step.kind === 'final';
  const turnPhase = state.phase === 'turn';
  const hidden = isFinal && settings.hideFinalText && !peeking;
  const prompt = isFinal ? t('session.yourTurnFinal') : t('session.yourTurn');
  const status = state.paused ? t('session.paused') : turnPhase ? prompt : t('session.listening');
  // El recitado final no avanza solo: quien reza decide cuándo terminó.
  const showCountdown = turnPhase && settings.autoAdvance && !isFinal;

  const personName = (index: number) => displayName(app.names, index, (number) => t('group.person', { number }));
  const nextStep = steps[state.index + 1];
  const showNext = nextStep !== undefined && nextStep.kind !== 'reflection' && nextStep.speaker !== step.speaker;

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
      <p className="eyebrow">{stepHeading(t, step, sentences.length)}</p>
      {step.repetitions > 1 && (
        <p className="meta">{t('session.repetition', { current: step.repetition, total: step.repetitions })}</p>
      )}
      {app.people > 1 && (
        <p className="turn-badge">
          <strong>
            {step.speaker === null ? t('group.everyone') : t('group.turn', { name: personName(step.speaker) })}
          </strong>
          {showNext && nextStep.speaker !== null && (
            <span>{t('group.next', { name: personName(nextStep.speaker) })}</span>
          )}
          {showNext && nextStep.speaker === null && <span>{t('group.next', { name: t('group.everyone') })}</span>}
        </p>
      )}

      {hidden ? (
        <blockquote className="stage hidden-text">{t('session.textHidden')}</blockquote>
      ) : (
        <blockquote className="stage" lang={app.lang}>
          {step.text}
        </blockquote>
      )}
      {isFinal && settings.hideFinalText && (
        <button className="secondary peek" onClick={() => setPeeking((previous) => !previous)}>
          {peeking ? t('session.hideText') : t('session.showText')}
        </button>
      )}

      <p className={turnPhase && !state.paused ? 'phase turn' : 'phase'} role="status">
        {status}
      </p>
      {showCountdown && (
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
        <button className={isFinal ? undefined : 'secondary'} onClick={player.next}>
          {isFinal ? t('session.finished') : `${t('session.next')} →`}
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
        <label className="check">
          <input
            type="checkbox"
            checked={settings.hideFinalText}
            onChange={(event) => updateSettings({ hideFinalText: event.target.checked })}
          />
          {t('session.hideFinal')}
        </label>
        <div className="field">
          <label htmlFor={paceId}>{t('plan.pace')}</label>
          <select
            id={paceId}
            value={settings.pace}
            onChange={(event) => {
              const pace = PACES.find((candidate) => candidate === event.target.value);
              if (pace) updateSettings({ pace });
            }}
          >
            {PACES.map((pace) => (
              <option key={pace} value={pace}>
                {t(`pace.${pace}` satisfies MessageKey)}
              </option>
            ))}
          </select>
        </div>
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
