import {
  FeedError,
  LANGS,
  buildSession,
  estimateSessionSeconds,
  fetchEvangelizoGospel,
  nextSunday,
  segment,
  todayIso,
  wordCount,
  type Lang,
} from '@manducapp/core';
import { useState } from 'react';
import { copyText, describeEnvironment, sleep } from './env';
import { LANG_NAMES } from './samples';

interface Row {
  lang: Lang;
  ok: boolean;
  ms: number;
  detail: string;
  lines?: number;
  words?: number;
  sentences?: number;
  minutes?: number;
  reference?: string;
  credit?: string;
}

/** Espacio entre idiomas: Evangelizo limita las peticiones y devolvió 429 a una ráfaga. */
const GAP_MS = 500;

export function FeedSpike() {
  const [when, setWhen] = useState<'today' | 'sunday'>('sunday');
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const [date, setDate] = useState('');
  const [copied, setCopied] = useState('');

  const run = async () => {
    setRunning(true);
    setRows([]);
    setCopied('');
    const target = when === 'today' ? todayIso() : nextSunday(todayIso());
    setDate(target);

    for (const lang of LANGS) {
      const began = performance.now();
      try {
        const gospel = await fetchEvangelizoGospel((url) => fetch(url), target, lang);
        const sentences = segment(gospel.lines, lang);
        const minutes = estimateSessionSeconds(buildSession(sentences)) / 60;
        const row: Row = {
          lang,
          ok: true,
          ms: Math.round(performance.now() - began),
          detail: 'OK',
          lines: gospel.lines.length,
          words: wordCount(gospel.lines.join(' ')),
          sentences: sentences.length,
          minutes: Math.round(minutes * 10) / 10,
          reference: gospel.reference,
          credit: gospel.credit,
        };
        setRows((previous) => [...previous, row]);
      } catch (error) {
        const detail = error instanceof FeedError ? `${error.code}: ${error.message}` : String(error);
        setRows((previous) => [...previous, { lang, ok: false, ms: Math.round(performance.now() - began), detail }]);
      }
      await sleep(GAP_MS);
    }
    setRunning(false);
  };

  const copyReport = async () => {
    const lines = ['== Prueba del feed (issue #3) ==', ...describeEnvironment(), `Fecha consultada: ${date}`, ''];
    for (const row of rows) {
      lines.push(
        row.ok
          ? `${row.lang}: OK ${row.ms} ms | ${row.reference} | líneas=${row.lines} palabras=${row.words} oraciones=${row.sentences} ~${row.minutes} min (1 persona) | ${row.credit}`
          : `${row.lang}: FALLÓ ${row.ms} ms | ${row.detail}`,
      );
    }
    setCopied((await copyText(lines.join('\n'))) ? 'Informe copiado' : 'No se pudo copiar; selecciónelo a mano');
  };

  return (
    <section>
      <h2>2. Feed del evangelio desde este navegador</h2>
      <p className="hint">
        Responde a: ¿el navegador del teléfono puede pedir el evangelio directo a Evangelizo (CORS) en los 6 idiomas? Se
        muestran solo cifras, no el texto.
      </p>
      <div className="row">
        <label>
          Fecha
          <select value={when} onChange={(event) => setWhen(event.target.value as 'today' | 'sunday')}>
            <option value="sunday">Próximo domingo</option>
            <option value="today">Hoy</option>
          </select>
        </label>
        <button disabled={running} onClick={() => void run()}>
          {running ? 'Consultando…' : 'Probar los 6 idiomas'}
        </button>
      </div>

      {rows.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Idioma</th>
                <th>Resultado</th>
                <th>ms</th>
                <th>Referencia</th>
                <th>Líneas</th>
                <th>Palabras</th>
                <th>Oraciones</th>
                <th>Min. (1 pers.)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.lang} className={row.ok ? 'ok' : 'bad'}>
                  <td>{LANG_NAMES[row.lang]}</td>
                  <td>{row.ok ? 'OK' : row.detail}</td>
                  <td>{row.ms}</td>
                  <td>{row.reference ?? '-'}</td>
                  <td>{row.lines ?? '-'}</td>
                  <td>{row.words ?? '-'}</td>
                  <td>{row.sentences ?? '-'}</td>
                  <td>{row.minutes ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.some((row) => row.credit) && (
        <ul className="credits">
          {rows
            .filter((row) => row.credit)
            .map((row) => (
              <li key={row.lang}>
                <strong>{row.lang}</strong>: {row.credit}
              </li>
            ))}
        </ul>
      )}
      <div className="buttons">
        <button disabled={rows.length === 0} onClick={() => void copyReport()}>
          Copiar informe del feed
        </button>
        <span className="hint">{copied}</span>
      </div>
    </section>
  );
}
