import type { LinkStrategy } from '@manducapp/core';
import { useEffect, useId, useMemo } from 'react';
import { Layout } from '../components/Layout';
import type { MessageKey } from '../i18n';
import { PEOPLE_OPTIONS } from '../services/group';
import { BUDGET_OPTIONS_MINUTES, STRATEGIES, planSession } from '../services/plan';
import { useApp } from '../state/AppContext';
import { navigate } from '../useRoute';

export function Preview() {
  const { state, t, setBudget, setStrategy, setCount, setPeople, setName } = useApp();
  const gospel = state.gospel;
  const budgetId = useId();
  const strategyId = useId();
  const rangeId = useId();
  const peopleId = useId();

  const plan = useMemo(
    () =>
      gospel ? planSession(gospel.sentences, state.budgetMinutes, state.strategy, state.count, state.people) : null,
    [gospel, state.budgetMinutes, state.strategy, state.count, state.people],
  );

  // Si se recarga la página directamente en esta ruta no hay texto elegido: se vuelve al inicio.
  useEffect(() => {
    if (!gospel) navigate('home');
  }, [gospel]);
  if (!gospel || !plan) return null;

  return (
    <Layout back>
      <p className="eyebrow">{t('preview.title')}</p>
      <h1>{gospel.reference}</h1>
      {gospel.title && <p className="muted">{gospel.title}</p>}
      <p className="meta">{t('preview.sentences', { count: plan.total })}</p>

      <section className="plan" aria-label={t('preview.title')}>
        <div className="plan-row">
          <div className="field">
            <label htmlFor={budgetId}>{t('plan.budget')}</label>
            <select id={budgetId} value={state.budgetMinutes} onChange={(event) => setBudget(Number(event.target.value))}>
              {BUDGET_OPTIONS_MINUTES.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {t('plan.budgetOption', { minutes })}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor={peopleId}>{t('plan.people')}</label>
            <select id={peopleId} value={state.people} onChange={(event) => setPeople(Number(event.target.value))}>
              {PEOPLE_OPTIONS.map((people) => (
                <option key={people} value={people}>
                  {people}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor={strategyId}>{t('plan.strategy')}</label>
            <select
              id={strategyId}
              value={state.strategy}
              onChange={(event) => setStrategy(event.target.value as LinkStrategy)}
            >
              {STRATEGIES.map((strategy) => (
                <option key={strategy} value={strategy}>
                  {t(`strategy.${strategy}` satisfies MessageKey)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {plan.total > 1 && (
          <div className="field">
            <label htmlFor={rangeId}>{t('plan.range', { count: plan.count, total: plan.total })}</label>
            <input
              id={rangeId}
              type="range"
              min={1}
              max={plan.total}
              value={plan.count}
              onChange={(event) => setCount(Number(event.target.value))}
            />
          </div>
        )}

        <p className={plan.fits ? 'estimate' : 'estimate over'} role="status">
          {t('plan.estimate', { minutes: plan.minutes })} · {plan.fits ? t('plan.fits') : t('plan.exceeds')}
        </p>
        {state.people > 1 && (
          <>
            <p className="note">{t('group.note')}</p>
            <details className="names">
              <summary>{t('group.names')}</summary>
              {Array.from({ length: state.people }, (_, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={30}
                  value={state.names[index] ?? ''}
                  placeholder={t('group.person', { number: index + 1 })}
                  aria-label={t('group.person', { number: index + 1 })}
                  onChange={(event) => setName(index, event.target.value)}
                />
              ))}
            </details>
          </>
        )}
        <div className="actions">
          <button onClick={() => navigate('session')} disabled={plan.count < 1}>
            {t('session.start')}
          </button>
          {plan.count !== plan.suggested && (
            <button className="secondary" onClick={() => setCount(null)}>
              {t('plan.fit')}
            </button>
          )}
        </div>
      </section>

      <ol className="sentences" lang={gospel.lang}>
        {gospel.sentences.map((sentence, index) => (
          <li key={index} className={index < plan.count ? undefined : 'skipped'}>
            {sentence}
          </li>
        ))}
      </ol>
      {plan.count < plan.total && <p className="note">{t('plan.skipped')}: {plan.total - plan.count}</p>}

      {gospel.credit && <p className="credit">{t('preview.credit', { credit: gospel.credit })}</p>}
    </Layout>
  );
}
