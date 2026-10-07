import { FeedError, isLang, nextSunday, todayIso, type Lang } from '@manducapp/core';
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { detectReadingLang, detectUiLang, translate, type MessageKey } from '../i18n';
import { getGospel } from '../services/gospel';
import { browserStorage, type KeyValueStorage } from '../services/storage';
import { gospelToView, ownTextToView } from '../services/view';
import { navigate } from '../useRoute';
import { reducer, type AppState, type ErrorCode } from './reducer';

const SETTINGS_KEY = 'manducapp:settings';

function readSavedLang(storage: KeyValueStorage): Lang | undefined {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(SETTINGS_KEY) ?? '{}');
    const lang = typeof parsed === 'object' && parsed !== null ? (parsed as { lang?: unknown }).lang : undefined;
    return isLang(lang) ? lang : undefined;
  } catch {
    return undefined;
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
}

const AppContext = createContext<AppApi | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const storage = useMemo(browserStorage, []);
  const [state, dispatch] = useReducer(reducer, undefined, (): AppState => {
    const languages = navigator.languages.length > 0 ? navigator.languages : [navigator.language];
    return {
      lang: readSavedLang(storage) ?? detectReadingLang(languages),
      uiLang: detectUiLang(languages),
      gospel: null,
      loading: false,
      error: null,
      pending: null,
    };
  });

  useEffect(() => {
    storage.setItem(SETTINGS_KEY, JSON.stringify({ lang: state.lang }));
  }, [storage, state.lang]);

  useEffect(() => {
    document.documentElement.lang = state.uiLang;
  }, [state.uiLang]);

  const uiLang = state.uiLang;
  const t = useCallback<AppApi['t']>((key, params) => translate(uiLang, key, params), [uiLang]);

  const setLang = useCallback((lang: Lang) => dispatch({ type: 'setLang', lang }), []);

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
    () => ({ state, t, setLang, openGospel, retry, submitOwnText }),
    [state, t, setLang, openGospel, retry, submitOwnText],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppApi {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp debe usarse dentro de <AppProvider>');
  return context;
}
