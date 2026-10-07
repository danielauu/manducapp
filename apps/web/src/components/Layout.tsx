import { useEffect, type ReactNode } from 'react';
import { routeHash, type Route } from '../routes';
import { useApp } from '../state/AppContext';

/** `back` muestra el enlace «Volver»: al inicio con `true`, o a la pantalla indicada. */
export function Layout({ children, back = false }: { children: ReactNode; back?: boolean | Route }) {
  const { t } = useApp();

  // El título de la pestaña sigue al encabezado de la pantalla: es lo primero que lee un lector de pantalla.
  useEffect(() => {
    const heading = document.querySelector('main h1')?.textContent?.trim();
    document.title = heading ? `${heading} · ${t('app.name')}` : t('app.name');
  });

  // Al cambiar de pantalla el foco pasa al encabezado; si no, un teclado o un lector de pantalla
  // se quedarían en un botón que ya no existe.
  useEffect(() => {
    const heading = document.querySelector<HTMLElement>('main h1');
    if (!heading) return;
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }, []);

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#/">
          {t('app.name')}
        </a>
        {back && (
          <a className="back" href={routeHash(back === true ? 'home' : back)}>
            ← {t('common.back')}
          </a>
        )}
      </header>
      <main>{children}</main>
    </div>
  );
}
