import { describe, expect, it } from 'vitest';
import type { GospelView } from '../services/view';
import { reducer, type AppState } from './reducer';

const VIEW: GospelView = { kind: 'today', lang: 'es', title: 't', reference: 'r', sentences: ['una oración de prueba'] };
const INITIAL: AppState = { lang: 'es', uiLang: 'es', gospel: null, loading: false, error: null, pending: null };

describe('reducer', () => {
  it('cargar: empieza, y termina bien o mal', () => {
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

  it('cambiar el idioma descarta el texto elegido y el error', () => {
    const state: AppState = { ...INITIAL, gospel: VIEW, error: 'not-found', pending: 'today' };
    expect(reducer(state, { type: 'setLang', lang: 'fr' })).toEqual({
      ...INITIAL,
      lang: 'fr',
      gospel: null,
      error: null,
      pending: null,
    });
  });

  it('un texto propio se fija sin pasar por la carga', () => {
    expect(reducer(INITIAL, { type: 'setGospel', gospel: VIEW }).gospel).toBe(VIEW);
  });
});
