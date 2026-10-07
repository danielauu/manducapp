import { describe, expect, it } from 'vitest';
import type { GospelView } from '../services/view';
import { reducer, type AppState } from './reducer';

const VIEW: GospelView = { kind: 'today', lang: 'es', title: 't', reference: 'r', sentences: ['una oración de prueba'] };
const INITIAL: AppState = {
  lang: 'es',
  uiLang: 'es',
  gospel: null,
  loading: false,
  error: null,
  pending: null,
  budgetMinutes: 30,
  strategy: 'pairs-and-blocks',
  count: null,
};

describe('reducer: carga', () => {
  it('empieza, y termina bien o mal', () => {
    const loading = reducer(INITIAL, { type: 'loadStart', kind: 'today' });
    expect(loading).toMatchObject({ loading: true, error: null, pending: 'today' });

    expect(reducer(loading, { type: 'loadSuccess', gospel: VIEW })).toMatchObject({
      loading: false,
      gospel: VIEW,
      pending: null,
    });

    const failed = reducer(loading, { type: 'loadFailure', code: 'network' });
    expect(failed).toMatchObject({ loading: false, error: 'network', pending: 'today' });
  });

  it('volver a intentar limpia el error', () => {
    const failed = reducer(INITIAL, { type: 'loadFailure', code: 'rate-limited' });
    expect(reducer(failed, { type: 'loadStart', kind: 'sunday' })).toMatchObject({
      error: null,
      loading: true,
      pending: 'sunday',
    });
  });

  it('un texto propio se fija sin pasar por la carga', () => {
    expect(reducer(INITIAL, { type: 'setGospel', gospel: VIEW }).gospel).toBe(VIEW);
  });
});

describe('reducer: idioma', () => {
  it('cambiar el idioma descarta el texto elegido, el error y el rango', () => {
    const state: AppState = { ...INITIAL, gospel: VIEW, error: 'not-found', pending: 'today', count: 7 };
    expect(reducer(state, { type: 'setLang', lang: 'fr' })).toEqual({
      ...INITIAL,
      lang: 'fr',
      gospel: null,
      error: null,
      pending: null,
      count: null,
    });
  });
});

describe('reducer: tiempo y rango', () => {
  it('elegir el rango lo guarda, y cambiar el tiempo o las uniones vuelve a la sugerencia', () => {
    const chosen = reducer(INITIAL, { type: 'setCount', count: 6 });
    expect(chosen.count).toBe(6);
    expect(reducer(chosen, { type: 'setBudget', minutes: 15 })).toMatchObject({ budgetMinutes: 15, count: null });
    expect(reducer(chosen, { type: 'setStrategy', strategy: 'minimal' })).toMatchObject({
      strategy: 'minimal',
      count: null,
    });
  });

  it('un texto nuevo parte de la sugerencia automática', () => {
    const chosen = reducer(INITIAL, { type: 'setCount', count: 6 });
    expect(reducer(chosen, { type: 'loadSuccess', gospel: VIEW }).count).toBeNull();
    expect(reducer(chosen, { type: 'setGospel', gospel: VIEW }).count).toBeNull();
  });
});
