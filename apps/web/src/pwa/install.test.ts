import { describe, expect, it, vi } from 'vitest';
import { memoryStorage } from '../services/storage';
import {
  createInstallStore,
  installHint,
  isIos,
  readDismissedAt,
  writeDismissedAt,
  type InstallContext,
  type InstallPromptEvent,
} from './install';

const DAY = 24 * 60 * 60 * 1000;

function fakeEvent(outcome: 'accepted' | 'dismissed' = 'accepted') {
  const prompt = vi.fn(() => Promise.resolve());
  const event = Object.assign(new Event('beforeinstallprompt'), {
    prompt,
    userChoice: Promise.resolve({ outcome }),
  }) as InstallPromptEvent;
  return { event, prompt };
}

describe('createInstallStore', () => {
  it('empieza sin poder instalar y avisa cuando el navegador ofrece instalarla', () => {
    const store = createInstallStore();
    const listener = vi.fn();
    store.subscribe(listener);
    expect(store.getSnapshot()).toEqual({ canPrompt: false, installed: false });

    store.setPrompt(fakeEvent().event);
    expect(store.getSnapshot().canPrompt).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('pedir la instalación muestra el diálogo, devuelve la elección y usa el evento una sola vez', async () => {
    const store = createInstallStore();
    const { event, prompt } = fakeEvent('accepted');
    store.setPrompt(event);

    expect(await store.prompt()).toBe('accepted');
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().canPrompt).toBe(false);
    expect(await store.prompt()).toBe('unavailable');
  });

  it('sin evento guardado no hay nada que mostrar', async () => {
    expect(await createInstallStore().prompt()).toBe('unavailable');
  });

  it('al instalarse queda marcada y deja de ofrecerse', () => {
    const store = createInstallStore();
    store.setPrompt(fakeEvent().event);
    store.markInstalled();
    expect(store.getSnapshot()).toEqual({ canPrompt: false, installed: true });
  });
});

describe('isIos', () => {
  it('reconoce iPhone, iPad e iPadOS que se presenta como Mac', () => {
    expect(isIos('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 5)).toBe(true);
    expect(isIos('Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)', 5)).toBe(true);
    expect(isIos('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5)).toBe(true);
  });

  it('no confunde un Mac de escritorio ni un Android', () => {
    expect(isIos('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 0)).toBe(false);
    expect(isIos('Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/152', 5)).toBe(false);
  });
});

describe('installHint', () => {
  const base: InstallContext = { standalone: false, installed: false, canPrompt: false, ios: false, dismissedAt: undefined, now: 100 * DAY };

  it('ofrece el botón cuando el navegador lo permite y las instrucciones en iPhone', () => {
    expect(installHint({ ...base, canPrompt: true })).toBe('prompt');
    expect(installHint({ ...base, ios: true })).toBe('ios');
  });

  it('el botón del navegador tiene prioridad sobre las instrucciones', () => {
    expect(installHint({ ...base, canPrompt: true, ios: true })).toBe('prompt');
  });

  it('no ofrece nada si ya está instalada, abierta desde el ícono, o si no hay forma de instalar', () => {
    expect(installHint({ ...base, canPrompt: true, standalone: true })).toBe('none');
    expect(installHint({ ...base, canPrompt: true, installed: true })).toBe('none');
    expect(installHint(base)).toBe('none');
  });

  it('descartarlo lo oculta 30 días', () => {
    expect(installHint({ ...base, canPrompt: true, dismissedAt: 90 * DAY })).toBe('none');
    expect(installHint({ ...base, canPrompt: true, dismissedAt: 60 * DAY })).toBe('prompt');
  });
});

describe('descartar el aviso', () => {
  it('se guarda y se lee, y lo corrupto se ignora', () => {
    const storage = memoryStorage();
    expect(readDismissedAt(storage)).toBeUndefined();
    writeDismissedAt(storage, 1234);
    expect(readDismissedAt(storage)).toBe(1234);
    storage.setItem('manducapp:install', 'no es json');
    expect(readDismissedAt(storage)).toBeUndefined();
    storage.setItem('manducapp:install', '{"dismissedAt":"ayer"}');
    expect(readDismissedAt(storage)).toBeUndefined();
  });
});
