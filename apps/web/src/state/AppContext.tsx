import { FeedError, isLang, nextSunday, todayIso, type Lang, type LinkStrategy } from '@manducapp/core';
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { detectLang, translate, type MessageKey } from '../i18n';
import { getGospel } from '../services/gospel';
import { BUDGET_OPTIONS_MINUTES, DEFAULT_BUDGET_MINUTES, DEFAULT_STRATEGY, STRATEGIES } from '../services/plan';
import { browserStorage, type KeyValueStorage } from '../services/storage';
import { MAX_PEOPLE, normalizeNames } from '../services/group';
import { gospelToView, ownTextToView } from '../services/view';
import { navigate } from '../useRoute';
import { reducer, type AppState, type ErrorCode } from './reducer';

const SETTINGS_KEY = 'manducapp:settings';

interface Settings {
  lang?: Lang;
  uiLang?: Lang;
  budgetMinutes?: number;
  strategy?: LinkStrategy;
  people?: number;
  names?: string[];
}

/** Lo guardado en el dispositivo puede venir de otra versión: solo se aceptan valores válidos. */
function readSettings(storage: KeyValueStorage): Settings {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(SETTINGS_KEY) ?? '{}');
    if (typeof parsed !== 'object' || parsed === null) return {};
    const { lang, uiLang, budgetMinutes, strategy, people, names } = parsed as Record<string, unknown>;
    const settings: Settings = {};
    if (isLang(lang)) settings.lang = lang;
    if (isLang(uiLang)) settings.uiLang = uiLang;
    if (typeof budgetMinutes === 'number' && (BUDGET_OPTIONS_MINUTES as readonly number[]).includes(budgetMinutes)) {
      settings.budgetMinutes = budgetMinutes;
    }
    if (typeof strategy === 'string' && (STRATEGIES as readonly string[]).includes(strategy)) {
      settings.strategy = strategy as LinkStrategy;
    }
    if (typeof people === 'number' && Number.isInteger(people) && people >= 1 && people <= MAX_PEOPLE) {
      settings.people = people;
    }
    if (Array.isArray(names)) settings.names = normalizeNames(names);
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
  setUiLang: (uiLang: Lang) => void;
  openGospel: (kind: 'today' | 'sunday') => Promise<void>;
  retry: () => Promise<void>;
  submitOwnText: (text: string) => void;
  setBudget: (minutes: number) => void;
  setStrategy: (strategy: LinkStrategy) => void;
  setCount: (count: number | null) => void;
  setPeople: (people: number) => void;
  setName: (index: number, name: string) => void;
}

const AppContext = createContext<AppApi | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const storage = useMemo(browserStorage, []);
  const [state, dispatch] = useReducer(reducer, undefined, (): AppState => {
    const languages = navigator.languages.length > 0 ? navigator.languages : [navigator.language];
    const saved = readSettings(storage);
    return {
      lang: saved.lang ?? detectLang(languages),
      uiLang: saved.uiLang ?? detectLang(languages),
      gospel: null,
      loading: false,
      error: null,
      pending: null,
      budgetMinutes: saved.budgetMinutes ?? DEFAULT_BUDGET_MINUTES,
      strategy: saved.strategy ?? DEFAULT_STRATEGY,
      count: null,
      people: saved.people ?? 1,
      names: saved.names ?? normalizeNames([]),
    };
  });

  useEffect(() => {
    const settings: Settings = {
      lang: state.lang,
      uiLang: state.uiLang,
      budgetMinutes: state.budgetMinutes,
      strategy: state.strategy,
      people: state.people,
      names: state.names,
    };
    storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [storage, state.lang, state.uiLang, state.budgetMinutes, state.strategy, state.people, state.names]);

  useEffect(() => {
    document.documentElement.lang = state.uiLang;
  }, [state.uiLang]);

  const uiLang = state.uiLang;
  const t = useCallback<AppApi['t']>((key, params) => translate(uiLang, key, params), [uiLang]);

  const setLang = useCallback((lang: Lang) => dispatch({ type: 'setLang', lang }), []);
  const setUiLang = useCallback((uiLang: Lang) => dispatch({ type: 'setUiLang', uiLang }), []);
  const setBudget = useCallback((minutes: number) => dispatch({ type: 'setBudget', minutes }), []);
  const setStrategy = useCallback((strategy: LinkStrategy) => dispatch({ type: 'setStrategy', strategy }), []);
  const setCount = useCallback((count: number | null) => dispatch({ type: 'setCount', count }), []);
  const setPeople = useCallback((people: number) => dispatch({ type: 'setPeople', people }), []);
  const setName = useCallback((index: number, name: string) => dispatch({ type: 'setName', index, name }), []);

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
    () => ({
      state,
      t,
      setLang,
      setUiLang,
      openGospel,
      retry,
      submitOwnText,
      setBudget,
      setStrategy,
      setCount,
      setPeople,
      setName,
    }),
    [state, t, setLang, setUiLang, openGospel, retry, submitOwnText, setBudget, setStrategy, setCount, setPeople, setName],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppApi {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp debe usarse dentro de <AppProvider>');
  return context;
}
