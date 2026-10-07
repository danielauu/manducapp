import { describe, expect, it } from 'vitest';
import { parseRoute, routeHash } from './routes';

describe('rutas', () => {
  it('reconoce las rutas conocidas y manda lo demás al inicio', () => {
    expect(parseRoute('')).toBe('home');
    expect(parseRoute('#/')).toBe('home');
    expect(parseRoute('#/preview')).toBe('preview');
    expect(parseRoute('#own')).toBe('own');
    expect(parseRoute('#/session')).toBe('session');
    expect(parseRoute('#/journal')).toBe('journal');
    expect(parseRoute('#/spike?x=1')).toBe('spike');
    expect(parseRoute('#/inexistente')).toBe('home');
  });

  it('routeHash y parseRoute son inversas', () => {
    for (const route of ['home', 'preview', 'session', 'journal', 'own', 'spike'] as const) {
      expect(parseRoute(routeHash(route))).toBe(route);
    }
  });
});
