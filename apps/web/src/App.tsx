import { useMemo } from 'react';
import { FeedSpike } from './spike/FeedSpike';
import { TtsSpike } from './spike/TtsSpike';
import { describeEnvironment } from './spike/env';

export function App() {
  const environment = useMemo(describeEnvironment, []);

  return (
    <main>
      <h1>Manducapp</h1>
      <p className="lead">
        Prueba técnica de la Fase 0. Aún no es la app: sirve para comprobar, en un teléfono real, la voz del dispositivo
        y el acceso al evangelio.
      </p>

      <section>
        <h2>Cómo probar</h2>
        <ol>
          <li>
            <strong>iPhone</strong>: ábrala en Safari, toque Compartir y «Añadir a pantalla de inicio». Ábrala desde ese
            ícono, no desde Safari.
          </li>
          <li>
            <strong>Android</strong>: ábrala en Chrome, menú ⋮ y «Instalar aplicación». Ábrala desde ese ícono.
          </li>
          <li>Haga las pruebas 1 y 2 de abajo, toque «Copiar informe» en cada una y péguelos en el chat.</li>
          <li>Repita también con la página abierta en el navegador normal, sin instalar.</li>
        </ol>
      </section>

      <section>
        <h2>Este dispositivo</h2>
        <ul className="env">
          {environment.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <TtsSpike />
      <FeedSpike />

      <footer>
        Los textos del evangelio son propiedad de sus titulares y se piden en tiempo real; no se guardan en este sitio.
      </footer>
    </main>
  );
}
