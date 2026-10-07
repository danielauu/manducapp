export type Route = 'home' | 'preview' | 'own' | 'spike';

const ROUTES: readonly Route[] = ['home', 'preview', 'own', 'spike'];

/** La navegación va en el hash (`#/preview`), así el botón atrás de Android funciona sin servidor. */
export function parseRoute(hash: string): Route {
  const name = hash.replace(/^#\/?/, '').split(/[/?]/)[0] ?? '';
  return ROUTES.find((route) => route === name) ?? 'home';
}

export function routeHash(route: Route): string {
  return route === 'home' ? '#/' : `#/${route}`;
}
