import { registerSW } from 'virtual:pwa-register';
import { pwaStore } from './store';

const UPDATE_CHECK_MS = 60 * 60 * 1000;

/** Registra el service worker: la app abre sin conexión y avisa cuando hay una versión nueva. */
export function startPwa(): void {
  if (!('serviceWorker' in navigator)) return;

  const updateServiceWorker = registerSW({
    onNeedRefresh() {
      pwaStore.setNeedRefresh(() => void updateServiceWorker(true));
    },
    onOfflineReady() {
      pwaStore.setOfflineReady();
    },
    onRegisteredSW(_url, registration) {
      // Quien deja la app abierta mucho tiempo también se entera de las versiones nuevas.
      if (registration) setInterval(() => void registration.update(), UPDATE_CHECK_MS);
    },
  });
}
