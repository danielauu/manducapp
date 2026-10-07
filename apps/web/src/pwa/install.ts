import type { KeyValueStorage } from '../services/storage';

/** El evento de Chrome y Edge que permite ofrecer la instalación; no está en los tipos de TypeScript. */
export interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface InstallState {
  /** El navegador ofrece instalar la app con un botón (Android: Chrome, Edge). */
  canPrompt: boolean;
  /** La app ya se instaló. */
  installed: boolean;
}

type Listener = () => void;

export function createInstallStore() {
  let state: InstallState = { canPrompt: false, installed: false };
  let pending: InstallPromptEvent | undefined;
  const listeners = new Set<Listener>();

  const set = (patch: Partial<InstallState>) => {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  };

  return {
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => state,
    /** El navegador dejó guardar el evento de instalación para usarlo cuando el usuario lo pida. */
    setPrompt(event: InstallPromptEvent) {
      pending = event;
      set({ canPrompt: true });
    },
    markInstalled() {
      pending = undefined;
      set({ canPrompt: false, installed: true });
    },
    /** Muestra el diálogo de instalación del navegador. El evento solo se puede usar una vez. */
    async prompt(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
      const event = pending;
      if (!event) return 'unavailable';
      pending = undefined;
      set({ canPrompt: false });
      await event.prompt();
      return (await event.userChoice).outcome;
    },
  };
}

export const installStore = createInstallStore();

// ---------------------------------------------------------------------------------------------

const KEY = 'manducapp:install';
const HIDE_AFTER_DISMISS_MS = 30 * 24 * 60 * 60 * 1000;

export function readDismissedAt(storage: KeyValueStorage): number | undefined {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(KEY) ?? '{}');
    const value = typeof parsed === 'object' && parsed !== null ? (parsed as { dismissedAt?: unknown }).dismissedAt : undefined;
    return typeof value === 'number' ? value : undefined;
  } catch {
    return undefined;
  }
}

export function writeDismissedAt(storage: KeyValueStorage, now: number): void {
  storage.setItem(KEY, JSON.stringify({ dismissedAt: now }));
}

/** iPhone y iPad no tienen botón de instalar: hay que indicar «Compartir → Añadir a pantalla de inicio». */
export function isIos(userAgent: string, maxTouchPoints: number): boolean {
  // Desde iPadOS 13 el iPad se presenta como un Mac, pero tiene pantalla táctil.
  return /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
}

export interface InstallContext {
  /** La app ya se abre desde el ícono de la pantalla de inicio. */
  standalone: boolean;
  installed: boolean;
  canPrompt: boolean;
  ios: boolean;
  dismissedAt: number | undefined;
  now: number;
}

export type InstallHint = 'prompt' | 'ios' | 'none';

/** Qué ofrecer: el botón del navegador, las instrucciones de iPhone, o nada. */
export function installHint(context: InstallContext): InstallHint {
  if (context.standalone || context.installed) return 'none';
  if (context.dismissedAt !== undefined && context.now - context.dismissedAt < HIDE_AFTER_DISMISS_MS) return 'none';
  if (context.canPrompt) return 'prompt';
  return context.ios ? 'ios' : 'none';
}
