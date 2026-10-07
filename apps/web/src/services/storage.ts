export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  keys(): string[];
}

export function memoryStorage(): KeyValueStorage {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
    keys: () => [...map.keys()],
  };
}

/**
 * `localStorage` puede faltar o lanzar errores (ventana privada, datos bloqueados, cuota llena).
 * Si no funciona, la app sigue en memoria: pierde la caché, pero no se rompe.
 */
export function browserStorage(): KeyValueStorage {
  try {
    const store = window.localStorage;
    const probe = '__manducapp_probe__';
    store.setItem(probe, '1');
    store.removeItem(probe);
    return {
      getItem: (key) => store.getItem(key),
      setItem: (key, value) => {
        try {
          store.setItem(key, value);
        } catch {
          // cuota llena: se ignora, el dato se vuelve a pedir cuando haga falta
        }
      },
      removeItem: (key) => store.removeItem(key),
      keys: () => Object.keys(store),
    };
  } catch {
    return memoryStorage();
  }
}
