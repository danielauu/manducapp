import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { startPwa } from './pwa/register';
import './styles.css';

const container = document.getElementById('root');
if (!container) throw new Error('Falta el elemento #root en index.html');

startPwa();

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
