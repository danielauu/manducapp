import type { ReactNode } from 'react';
import { useApp } from '../state/AppContext';

export function Layout({ children, back = false }: { children: ReactNode; back?: boolean }) {
  const { t } = useApp();
  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#/">
          {t('app.name')}
        </a>
        {back && (
          <a className="back" href="#/">
            ← {t('common.back')}
          </a>
        )}
      </header>
      <main>{children}</main>
    </div>
  );
}
