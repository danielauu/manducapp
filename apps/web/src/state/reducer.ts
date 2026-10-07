import type { Lang } from '@manducapp/core';
import type { UiLang } from '../i18n';
import type { GospelKind, GospelView } from '../services/view';

export type ErrorCode = 'network' | 'rate-limited' | 'not-found' | 'out-of-range' | 'bad-response' | 'unknown';

export interface AppState {
  /** Idioma en que se lee y se memoriza el evangelio. */
  lang: Lang;
  /** Idioma de los textos de la interfaz. */
  uiLang: UiLang;
  gospel: GospelView | null;
  loading: boolean;
  error: ErrorCode | null;
  /** Lo último que se intentó cargar, para ofrecer «Reintentar». */
  pending: Exclude<GospelKind, 'own'> | null;
}

export type Action =
  | { type: 'setLang'; lang: Lang }
  | { type: 'loadStart'; kind: Exclude<GospelKind, 'own'> }
  | { type: 'loadSuccess'; gospel: GospelView }
  | { type: 'loadFailure'; code: ErrorCode }
  | { type: 'setGospel'; gospel: GospelView }
  | { type: 'clearError' };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'setLang':
      // Otro idioma invalida el texto elegido y cualquier error previo.
      return { ...state, lang: action.lang, gospel: null, error: null, pending: null };
    case 'loadStart':
      return { ...state, loading: true, error: null, pending: action.kind };
    case 'loadSuccess':
      return { ...state, loading: false, error: null, pending: null, gospel: action.gospel };
    case 'loadFailure':
      return { ...state, loading: false, error: action.code };
    case 'setGospel':
      return { ...state, gospel: action.gospel, error: null, pending: null };
    case 'clearError':
      return { ...state, error: null, pending: null };
  }
}
