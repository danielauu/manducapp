import type { ReactNode } from 'react';
import { routeHash, type Route } from '../routes';
import { useApp } from '../state/AppContext';

/** `back` muestra el enlace «Volver»: al inicio con `true`, o a la pantalla indicada. */
export function Layout({ children, back = false }: { children: ReactNode; back?: boolean | Route }) {
  const { t } = useApp();
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
