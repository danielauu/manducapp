import { FeedError, isLang, nextSunday, todayIso, type Lang, type LinkStrategy } from '@manducapp/core';
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { detectReadingLang, detectUiLang, translate, type MessageKey } from '../i18n';
import { getGospel } from '../services/gospel';
import { BUDGET_OPTIONS_MINUTES, DEFAULT_BUDGET_MINUTES, DEFAULT_STRATEGY, STRATEGIES } from '../services/plan';
import { browserStorage, type KeyValueStorage } from '../services/storage';
import { gospelToView, ownTextToView } from '../services/view';
import { navigate } from '../useRoute';
import { reducer, type AppState, type ErrorCode } from './reducer';

const SETTINGS_KEY = 'manducapp:settings';

interface Settings {
  lang?: Lang;
  budgetMinutes?: number;
  strategy?: LinkStrategy;
}

/** Lo guardado en el dispositivo puede venir de otra versión: solo se aceptan valores válidos. */
function readSettings(storage: KeyValueStorage): Settings {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(SETTINGS_KEY) ?? '{}');
    if (typeof parsed !== 'object' || parsed === null) return {};
    const { lang, budgetMinutes, strategy } = parsed as Record<string, unknown>;
    const settings: Settings = {};
    if (isLang(lang)) settings.lang = lang;
    if (typeof budgetMinutes === 'number' && (BUDGET_OPTIONS_MINUTES as readonly number[]).includes(budgetMinutes)) {
      settings.budgetMinutes = budgetMinutes;
    }
    if (typeof strategy === 'string' && (STRATEGIES as readonly string[]).includes(strategy)) {
      settings.strategy = strategy as LinkStrategy;
    }
    return settings;
  } catch {
    return {};
  }
}

function errorCodeOf(error: unknown): ErrorCode {
  return error instanceof FeedError ? error.code : 'unknown';
}

interface AppApi {
  state: AppState;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  setLang: (lang: Lang) => void;
  openGospel: (kind: 'today' | 'sunday') => Promise<void>;
  retry: () => Promise<void>;
  submitOwnText: (text: string) => void;
  setBudget: (minutes: number) => void;
  setStrategy: (strategy: LinkStrategy) => void;
  setCount: (count: number | null) => void;
}

const AppContext = createContext<AppApi | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const storage = useMemo(browserStorage, []);
  const [state, dispatch] = useReducer(reducer, undefined, (): AppState => {
    const languages = navigator.languages.length > 0 ? navigator.languages : [navigator.language];
    const saved = readSettings(storage);
    return {
      lang: saved.lang ?? detectReadingLang(languages),
      uiLang: detectUiLang(languages),
      gospel: null,
      loading: false,
      error: null,
      pending: null,
      budgetMinutes: saved.budgetMinutes ?? DEFAULT_BUDGET_MINUTES,
      strategy: saved.strategy ?? DEFAULT_STRATEGY,
      count: null,
    };
  });

  useEffect(() => {
    const settings: Settings = { lang: state.lang, budgetMinutes: state.budgetMinutes, strategy: state.strategy };
    storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [storage, state.lang, state.budgetMinutes, state.strategy]);

  useEffect(() => {
    document.documentElement.lang = state.uiLang;
  }, [state.uiLang]);

  const uiLang = state.uiLang;
  const t = useCallback<AppApi['t']>((key, params) => translate(uiLang, key, params), [uiLang]);

  const setLang = useCallback((lang: Lang) => dispatch({ type: 'setLang', lang }), []);
  const setBudget = useCallback((minutes: number) => dispatch({ type: 'setBudget', minutes }), []);
  const setStrategy = useCallback((strategy: LinkStrategy) => dispatch({ type: 'setStrategy', strategy }), []);
  const setCount = useCallback((count: number | null) => dispatch({ type: 'setCount', count }), []);

  const openGospel = useCallback<AppApi['openGospel']>(
    async (kind) => {
      dispatch({ type: 'loadStart', kind });
      const date = kind === 'today' ? todayIso() : nextSunday(todayIso());
      try {
        const gospel = await getGospel(date, state.lang, { fetchFn: (url) => fetch(url), storage });
        dispatch({ type: 'loadSuccess', gospel: gospelToView(gospel, kind) });
        navigate('preview');
      } catch (error) {
        dispatch({ type: 'loadFailure', code: errorCodeOf(error) });
      }
    },
    [state.lang, storage],
  );

  const retry = useCallback(async () => {
    if (state.pending) await openGospel(state.pending);
  }, [openGospel, state.pending]);

  const submitOwnText = useCallback<AppApi['submitOwnText']>(
    (text) => {
      dispatch({ type: 'setGospel', gospel: ownTextToView(text, state.lang, translate(uiLang, 'own.title')) });
      navigate('preview');
    },
    [state.lang, uiLang],
  );

  const value = useMemo(
    () => ({ state, t, setLang, openGospel, retry, submitOwnText, setBudget, setStrategy, setCount }),
    [state, t, setLang, openGospel, retry, submitOwnText, setBudget, setStrategy, setCount],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppApi {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp debe usarse dentro de <AppProvider>');
  return context;
}
