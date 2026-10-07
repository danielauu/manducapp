import { describe, expect, it } from 'vitest';
import { FeedError } from '../errors';
import {
  EVANGELIZO_LANG,
  FALLBACK_CREDITS,
  evangelizoUrl,
  fetchEvangelizoGospel,
  parseEvangelizoCredit,
  parseEvangelizoGospel,
} from './evangelizo';
import type { FetchLike } from './http';

// Texto inventado: los tests nunca incluyen evangelios reales.
const XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<data-set xml:lang="fr" lang="fr">
<evangelizo>
    <saint><![CDATA[Santo de prueba]]></saint>
    <litugic_t><![CDATA[Domingo de prueba]]></litugic_t>
    <reading_gospel_lt><![CDATA[Evangelio según San Prueba 1,1-3.]]></reading_gospel_lt>
    <reading_gospel_st><![CDATA[Pr <font dir="ltr">1,1-3.</font>]]></reading_gospel_st>
    <reading_gospel><![CDATA[Primera línea de prueba, dicha con calma:
  Segunda línea de prueba.

Tercera línea de prueba.]]></reading_gospel>
    <comment_t><![CDATA[Comentario]]></comment_t>
</evangelizo>
</data-set>`;

const HTML = `Primera línea de prueba.<br />
Segunda línea de prueba.
<br /><br />
<br />Extraído de la Biblia de prueba &#039;uno&#039;.
<br />Para recibir cada mañana el Evangelio por correo electrónico, registrarse: <a href="https://x.org">x.org</a>`;

/** Lee un parámetro de la query sin depender de `URL` (el núcleo no usa tipos de DOM ni de Node). */
function param(url: string, name: string): string | undefined {
  const query = url.split('?')[1] ?? '';
  const pair = query.split('&').find((entry) => entry.startsWith(`${name}=`));
  return pair?.slice(name.length + 1);
}

describe('evangelizoUrl', () => {
  it('arma la URL con el código de idioma de Evangelizo y la fecha compacta', () => {
    const url = evangelizoUrl('2026-10-11', 'es', 'xml');
    expect(url.split('?')[0]).toBe('https://feed.evangelizo.org/v2/reader.php');
    expect(param(url, 'date')).toBe('20261011');
    expect(param(url, 'lang')).toBe('SP');
    expect(param(url, 'type')).toBe('xml');
    expect(param(url, 'content')).toBe('GSP');
  });

  it('mapea los 6 idiomas', () => {
    expect(EVANGELIZO_LANG).toEqual({ es: 'SP', en: 'AM', fr: 'FR', it: 'IT', de: 'DE', pl: 'PL' });
  });
});

describe('parseEvangelizoGospel', () => {
  it('normaliza líneas, referencia y título litúrgico', () => {
    const gospel = parseEvangelizoGospel(XML, '2026-10-11', 'es', 'Crédito de prueba');
    expect(gospel).toEqual({
      date: '2026-10-11',
      lang: 'es',
      liturgicalTitle: 'Domingo de prueba',
      reference: 'Pr 1,1-3',
      lines: [
        'Primera línea de prueba, dicha con calma:',
        'Segunda línea de prueba.',
        'Tercera línea de prueba.',
      ],
      credit: 'Crédito de prueba',
      source: 'evangelizo',
    });
  });

  it('usa el crédito de respaldo si no se entrega uno', () => {
    expect(parseEvangelizoGospel(XML, '2026-10-11', 'pl').credit).toBe(FALLBACK_CREDITS.pl);
  });

  it('distingue la fecha fuera de rango de otras respuestas inválidas', () => {
    const outOfRange = '<html><body><b>Error : wrong param &#171; date &#187; !! Must</b></body></html>';
    expect(() => parseEvangelizoGospel(outOfRange, '2026-12-01', 'es')).toThrowError(
      expect.objectContaining({ code: 'out-of-range' }),
    );
    expect(() => parseEvangelizoGospel('<html>otra cosa</html>', '2026-10-11', 'es')).toThrowError(
      expect.objectContaining({ code: 'bad-response' }),
    );
  });

  it('falla con not-found si el evangelio viene vacío', () => {
    const empty = XML.replace(/<reading_gospel><!\[CDATA\[[\s\S]*?\]\]><\/reading_gospel>/, '');
    expect(() => parseEvangelizoGospel(empty, '2026-10-11', 'es')).toThrowError(
      expect.objectContaining({ code: 'not-found' }),
    );
  });
});

describe('parseEvangelizoCredit', () => {
  it('toma la primera línea después del doble salto y decodifica entidades', () => {
    expect(parseEvangelizoCredit(HTML)).toBe("Extraído de la Biblia de prueba 'uno'.");
  });

  it('devuelve undefined si no hay doble salto', () => {
    expect(parseEvangelizoCredit('solo una línea<br />otra')).toBeUndefined();
  });
});

describe('fetchEvangelizoGospel', () => {
  const respond = (body: string, ok = true, status = 200) => ({
    ok,
    status,
    text: () => Promise.resolve(body),
  });

  it('combina el XML con el crédito de la versión HTML', async () => {
    const fetchFn: FetchLike = (url) => Promise.resolve(respond(param(url, 'type') === 'xml' ? XML : HTML));
    const gospel = await fetchEvangelizoGospel(fetchFn, '2026-10-11', 'es');
    expect(gospel.credit).toBe("Extraído de la Biblia de prueba 'uno'.");
    expect(gospel.lines).toHaveLength(3);
  });

  it('usa el crédito de respaldo si la versión HTML falla', async () => {
    const fetchFn: FetchLike = (url) =>
      param(url, 'type') === 'xml'
        ? Promise.resolve(respond(XML))
        : Promise.reject(new Error('sin red'));
    const gospel = await fetchEvangelizoGospel(fetchFn, '2026-10-11', 'it');
    expect(gospel.credit).toBe(FALLBACK_CREDITS.it);
  });

  it('propaga un error de red como FeedError network', async () => {
    const fetchFn: FetchLike = () => Promise.reject(new Error('sin red'));
    const failure = await fetchEvangelizoGospel(fetchFn, '2026-10-11', 'es').catch((e: unknown) => e);
    expect(failure).toBeInstanceOf(FeedError);
    expect(failure).toMatchObject({ code: 'network' });
  });

  it('propaga un HTTP no exitoso como FeedError bad-response', async () => {
    const fetchFn: FetchLike = () => Promise.resolve(respond('', false, 503));
    await expect(fetchEvangelizoGospel(fetchFn, '2026-10-11', 'es')).rejects.toMatchObject({
      code: 'bad-response',
    });
  });
});
