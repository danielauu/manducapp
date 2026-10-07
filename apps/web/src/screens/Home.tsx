import { dayOfWeek, todayIso, nextSunday } from '@manducapp/core';
import { Layout } from '../components/Layout';
import { InstallBanner } from '../components/InstallBanner';
import { PwaBanner } from '../components/PwaBanner';
import { LanguagePicker } from '../components/LanguagePicker';
import { formatDay } from '../format';
import { useApp } from '../state/AppContext';
import { navigate } from '../useRoute';

export function Home() {
  const { state, t, openGospel, retry } = useApp();
  const today = todayIso();
  const sunday = nextSunday(today);
  const todayIsSunday = dayOfWeek(today) === 0;
  const busy = state.loading;

  return (
    <Layout>
      <h1>{t('home.title')}</h1>
      <LanguagePicker />

      {state.error && (
        <div className="banner" role="alert">
          <strong>{t('error.title')}</strong>
          <p>{t(`error.${state.error}`)}</p>
          {state.pending && (
            <button className="secondary" onClick={() => void retry()} disabled={busy}>
              {t('common.retry')}
            </button>
          )}
        </div>
      )}

      <div className="choices" aria-busy={busy}>
        <button className="choice" disabled={busy} onClick={() => void openGospel('today')}>
          <span className="choice-title">{t('home.today')}</span>
          <span className="choice-sub">{formatDay(today, state.uiLang)}</span>
        </button>
        {!todayIsSunday && (
          <button className="choice" disabled={busy} onClick={() => void openGospel('sunday')}>
            <span className="choice-title">{t('home.sunday')}</span>
            <span className="choice-sub">{formatDay(sunday, state.uiLang)}</span>
          </button>
        )}
        <button className="choice" disabled={busy} onClick={() => navigate('own')}>
          <span className="choice-title">{t('home.own')}</span>
          <span className="choice-sub">{t('home.ownHint')}</span>
        </button>
      </div>
      {busy && <p className="status">{t('home.loading')}</p>}
      <p className="journal-link">
        <a href="#/journal">{t('home.journal')}</a>
        <a href="#/settings">{t('home.settings')}</a>
      </p>

      <footer>
        <p>{t('home.footer')}</p>
        <a href="#/spike">{t('home.diagnostics')}</a>
      </footer>
      <div className="toasts">
        <PwaBanner />
        <InstallBanner />
      </div>
    </Layout>
  );
}
