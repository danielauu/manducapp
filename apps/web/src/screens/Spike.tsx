import { useMemo } from 'react';
import { Layout } from '../components/Layout';
import { FeedSpike } from '../spike/FeedSpike';
import { TtsSpike } from '../spike/TtsSpike';
import { describeEnvironment } from '../spike/env';

/** Página de pruebas técnicas de la Fase 0 (voz y feed); se retirará cuando ya no haga falta. */
export function Spike() {
  const environment = useMemo(describeEnvironment, []);

  return (
    <Layout back>
      <h1>Pruebas técnicas</h1>
      <p className="lead">
        Sirven para comprobar, en un teléfono real, la voz del dispositivo y el acceso al evangelio. Haga las pruebas, toque
        «Copiar informe» y péguelo en el chat.
      </p>

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
    </Layout>
  );
}
