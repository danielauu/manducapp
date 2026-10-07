import { useMemo, useState, useSyncExternalStore } from 'react';
import { installHint, installStore, isIos, readDismissedAt, writeDismissedAt } from '../pwa/install';
import { browserStorage } from '../services/storage';
import { useApp } from '../state/AppContext';

function isStandalone(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return window.matchMedia('(display-mode: standalone)').matches || iosStandalone;
}

/** Invita a instalar la app: con el botón del navegador, o con las instrucciones en iPhone. */
export function InstallBanner() {
  const { t } = useApp();
  const storage = useMemo(browserStorage, []);
  const install = useSyncExternalStore(installStore.subscribe, installStore.getSnapshot);
  const [dismissedAt, setDismissedAt] = useState(() => readDismissedAt(storage));

  const hint = installHint({
    standalone: isStandalone(),
    installed: install.installed,
    canPrompt: install.canPrompt,
    ios: isIos(navigator.userAgent, navigator.maxTouchPoints),
    dismissedAt,
    now: Date.now(),
  });
  if (hint === 'none') return null;

  const dismiss = () => {
    const now = Date.now();
    writeDismissedAt(storage, now);
    setDismissedAt(now);
  };

  return (
    <div className="banner soft" role="region" aria-label={t('install.title')}>
      <strong>{t('install.title')}</strong>
      <p>{hint === 'prompt' ? t('install.android') : t('install.ios')}</p>
      <div className="actions">
        {hint === 'prompt' && (
          <button
            onClick={() => {
              void installStore.prompt().then((outcome) => {
                if (outcome === 'dismissed') dismiss();
              });
            }}
          >
            {t('install.button')}
          </button>
        )}
        <button className="secondary" onClick={dismiss}>
          {t('install.dismiss')}
        </button>
      </div>
    </div>
  );
}
