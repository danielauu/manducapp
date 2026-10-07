import { describe, expect, it, vi } from 'vitest';
import { createPwaStore } from './store';

describe('createPwaStore', () => {
  it('empieza sin avisos', () => {
    expect(createPwaStore().getSnapshot()).toEqual({ needRefresh: false, offlineReady: false });
  });

  it('avisa a quienes escuchan cuando hay una versión nueva o la app queda lista sin conexión', () => {
    const store = createPwaStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.setOfflineReady();
    expect(store.getSnapshot()).toEqual({ needRefresh: false, offlineReady: true });
    store.setNeedRefresh(() => undefined);
    expect(store.getSnapshot()).toEqual({ needRefresh: true, offlineReady: true });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('actualizar ejecuta la función que dejó el registro y cerrar quita los avisos', () => {
    const store = createPwaStore();
    const apply = vi.fn();
    store.setNeedRefresh(apply);
    store.update();
    expect(apply).toHaveBeenCalledTimes(1);

    store.dismiss();
    expect(store.getSnapshot()).toEqual({ needRefresh: false, offlineReady: false });
  });

  it('actualizar sin versión nueva no hace nada y dejar de escuchar funciona', () => {
    const store = createPwaStore();
    expect(() => store.update()).not.toThrow();

    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    store.setOfflineReady();
    expect(listener).not.toHaveBeenCalled();
  });
});
