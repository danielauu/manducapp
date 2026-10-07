export interface PwaState {
  /** Hay una versión nueva de la app descargada, lista para aplicarse. */
  needRefresh: boolean;
  /** La app terminó de guardarse y ya puede abrirse sin conexión. */
  offlineReady: boolean;
}

type Listener = () => void;

/** Estado de la PWA con la forma que pide `useSyncExternalStore`. */
export function createPwaStore() {
  let state: PwaState = { needRefresh: false, offlineReady: false };
  const listeners = new Set<Listener>();
  let applyUpdate: (() => void) | undefined;

  const set = (patch: Partial<PwaState>) => {
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
    /** Lo llama el registro del service worker; `apply` activa la versión nueva y recarga. */
    setNeedRefresh(apply: () => void) {
      applyUpdate = apply;
      set({ needRefresh: true });
    },
    setOfflineReady: () => set({ offlineReady: true }),
    update: () => applyUpdate?.(),
    dismiss: () => set({ needRefresh: false, offlineReady: false }),
  };
}

export const pwaStore = createPwaStore();
