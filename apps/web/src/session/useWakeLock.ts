import { useEffect, useState } from 'react';

export type WakeLockStatus = 'on' | 'off' | 'unsupported';

/**
 * Mantiene la pantalla encendida mientras `active` sea verdadero (ADR-0002: una manducación es un uso
 * activo). El sistema suelta el bloqueo al ocultar la página, así que se vuelve a pedir al volver.
 */
export function useWakeLock(active: boolean): WakeLockStatus {
  const [status, setStatus] = useState<WakeLockStatus>('off');

  useEffect(() => {
    if (!active) return;
    if (!('wakeLock' in navigator)) {
      setStatus('unsupported');
      return;
    }

    let cancelled = false;
    let lock: WakeLockSentinel | null = null;

    const request = async () => {
      try {
        const sentinel = await navigator.wakeLock.request('screen');
        if (cancelled) {
          void sentinel.release();
          return;
        }
        lock = sentinel;
        setStatus('on');
        sentinel.addEventListener('release', () => setStatus('off'));
      } catch {
        setStatus('off');
      }
    };

    void request();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void request();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      void lock?.release();
    };
  }, [active]);

  return status;
}
