import { registerSW } from 'virtual:pwa-register';
import { installStore, type InstallPromptEvent } from './install';
import { pwaStore } from './store';

const UPDATE_CHECK_MS = 60 * 60 * 1000;

/**
 * El navegador lanza `beforeinstallprompt` apenas carga la página, antes de que React pinte nada:
 * se guarda aquí para ofrecer la instalación cuando haga falta.
 */
function listenForInstall(): void {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installStore.setPrompt(event as InstallPromptEvent);
  });
  window.addEventListener('appinstalled', () => installStore.markInstalled());
}

/** Registra el service worker: la app abre sin conexión y avisa cuando hay una versión nueva. */
export function startPwa(): void {
  listenForInstall();
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
