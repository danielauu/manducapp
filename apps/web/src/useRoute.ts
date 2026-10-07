import { useEffect, useState } from 'react';
import { parseRoute, routeHash, type Route } from './routes';

export function navigate(route: Route): void {
  window.location.hash = routeHash(route);
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
