import { useSyncExternalStore } from 'react';
import { pwaStore } from '../pwa/store';
import { useApp } from '../state/AppContext';

/** Avisa de una versión nueva (con botón para aplicarla) o de que la app ya funciona sin conexión. */
export function PwaBanner() {
  const { t } = useApp();
  const state = useSyncExternalStore(pwaStore.subscribe, pwaStore.getSnapshot);
  if (!state.needRefresh && !state.offlineReady) return null;

  return (
    <div className="banner soft" role="status">
      <p>{state.needRefresh ? t('pwa.updateAvailable') : t('pwa.offlineReady')}</p>
      <div className="actions">
        {state.needRefresh && <button onClick={pwaStore.update}>{t('pwa.update')}</button>}
        <button className="secondary" onClick={pwaStore.dismiss}>
          {t('pwa.dismiss')}
        </button>
      </div>
    </div>
  );
}
