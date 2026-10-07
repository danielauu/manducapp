import type { Lang, LinkStrategy } from '@manducapp/core';
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
  /** Tiempo disponible para la sesión, en minutos. */
  budgetMinutes: number;
  strategy: LinkStrategy;
  /** Oraciones que se memorizan, si el usuario las eligió; `null` usa lo que sugiere el tiempo disponible. */
  count: number | null;
  /** Personas que rezan juntas, de 1 a 5. */
  people: number;
  /** Nombres de las personas (siempre cinco, vacío = «Persona N»). */
  names: string[];
}

export type Action =
  | { type: 'setLang'; lang: Lang }
  | { type: 'loadStart'; kind: Exclude<GospelKind, 'own'> }
  | { type: 'loadSuccess'; gospel: GospelView }
  | { type: 'loadFailure'; code: ErrorCode }
  | { type: 'setGospel'; gospel: GospelView }
  | { type: 'clearError' }
  | { type: 'setBudget'; minutes: number }
  | { type: 'setStrategy'; strategy: LinkStrategy }
  | { type: 'setCount'; count: number | null }
  | { type: 'setPeople'; people: number }
  | { type: 'setName'; index: number; name: string };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'setLang':
      // Otro idioma invalida el texto elegido y cualquier error previo.
      return { ...state, lang: action.lang, gospel: null, error: null, pending: null, count: null };
    case 'loadStart':
      return { ...state, loading: true, error: null, pending: action.kind };
    case 'loadSuccess':
      return { ...state, loading: false, error: null, pending: null, gospel: action.gospel, count: null };
    case 'loadFailure':
      return { ...state, loading: false, error: action.code };
    case 'setGospel':
      return { ...state, gospel: action.gospel, error: null, pending: null, count: null };
    case 'clearError':
      return { ...state, error: null, pending: null };
    // Cambiar el tiempo o las uniones vuelve a la sugerencia automática.
    case 'setBudget':
      return { ...state, budgetMinutes: action.minutes, count: null };
    case 'setStrategy':
      return { ...state, strategy: action.strategy, count: null };
    case 'setCount':
      return { ...state, count: action.count };
    // Con más personas cambian el tiempo y lo que cabe: se vuelve a la sugerencia automática.
    case 'setPeople':
      return { ...state, people: action.people, count: null };
    case 'setName':
      return { ...state, names: state.names.map((name, index) => (index === action.index ? action.name : name)) };
  }
}
