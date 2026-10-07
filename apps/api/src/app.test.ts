import type { FetchLike } from '@manducapp/core';
import { describe, expect, it } from 'vitest';
import { createApp, type EdgeCache } from './app';

// Textos inventados: los tests nunca incluyen evangelios reales.
const XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<data-set><evangelizo>
    <litugic_t><![CDATA[Domingo de prueba]]></litugic_t>
    <reading_gospel_st><![CDATA[Pr 1,1-3.]]></reading_gospel_st>
    <reading_gospel><![CDATA[Primera línea de prueba, dicha con calma:
Segunda línea de prueba.]]></reading_gospel>
</evangelizo></data-set>`;

const HTML = 'Primera línea de prueba.<br />\n<br /><br />\n<br />Crédito de prueba.\n<br />Promoción.';

const AELF = JSON.stringify({
  informations: { jour_liturgique_nom: 'Dimanche de test' },
  messes: [
    {
      lectures: [
        { type: 'evangile', ref: 'Pr 1, 1-3', contenu: '<p>Une phrase de test. Une autre phrase de test. Encore une.</p>' },
        { type: 'evangile', ref: 'Pr 1, 1-2', contenu: '<p>Une phrase de test.</p>' },
      ],
    },
  ],
});

const OUT_OF_RANGE = '<html><body><b>Error : wrong param &#171; date &#187; !! Must</b></body></html>';

interface Upstream {
  evangelizo?: (type: string) => { status?: number; body: string } | Error;
  aelf?: () => { status?: number; body: string } | Error;
}

/** `fetch` falso que responde según el servidor y cuenta las llamadas. */
function fakeFetch(upstream: Upstream = {}) {
  const calls: string[] = [];
  const fetchFn: FetchLike = (url) => {
    calls.push(url);
    const isAelf = url.includes('api.aelf.org');
    const type = /[?&]type=(\w+)/.exec(url)?.[1] ?? '';
    const result = isAelf
      ? (upstream.aelf?.() ?? { body: AELF })
      : (upstream.evangelizo?.(type) ?? { body: type === 'xml' ? XML : HTML });
    if (result instanceof Error) return Promise.reject(result);
    const status = result.status ?? 200;
    return Promise.resolve({ ok: status >= 200 && status < 300, status, text: () => Promise.resolve(result.body) });
  };
  return { fetchFn, calls };
}

function memoryCache(): EdgeCache & { size: () => number } {
  const store = new Map<string, Response>();
  const urlOf = (request: RequestInfo | URL) =>
    typeof request === 'string' ? request : request instanceof URL ? request.href : request.url;
  return {
    match: (request) => Promise.resolve(store.get(urlOf(request))?.clone()),
    put: (request, response) => {
      store.set(urlOf(request), response);
      return Promise.resolve();
    },
    size: () => store.size,
  };
}

describe('GET /v1/gospel', () => {
  it('devuelve el evangelio normalizado con CORS y caché', async () => {
    const { fetchFn } = fakeFetch();
    const response = await createApp({ fetchFn }).request('/v1/gospel?date=2026-10-11&lang=es');
    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(response.headers.get('cache-control')).toBe('public, max-age=300, s-maxage=3600');
    expect(response.headers.get('x-source')).toBe('evangelizo');
    expect(await response.json()).toEqual({
      date: '2026-10-11',
      lang: 'es',
      liturgicalTitle: 'Domingo de prueba',
      reference: 'Pr 1,1-3',
      lines: ['Primera línea de prueba, dicha con calma:', 'Segunda línea de prueba.'],
      credit: 'Crédito de prueba.',
      source: 'evangelizo',
    });
  });

  it('acepta el idioma en mayúsculas', async () => {
    const { fetchFn } = fakeFetch();
    const response = await createApp({ fetchFn }).request('/v1/gospel?date=2026-10-11&lang=ES');
    expect(response.status).toBe(200);
  });

  it.each([
    ['sin fecha', '/v1/gospel?lang=es'],
    ['fecha inexistente', '/v1/gospel?date=2026-02-30&lang=es'],
    ['formato de fecha inválido', '/v1/gospel?date=11-10-2026&lang=es'],
    ['sin idioma', '/v1/gospel?date=2026-10-11'],
    ['idioma desconocido', '/v1/gospel?date=2026-10-11&lang=xx'],
    ['fuente desconocida', '/v1/gospel?date=2026-10-11&lang=fr&source=otra'],
    ['aelf para un idioma que no es francés', '/v1/gospel?date=2026-10-11&lang=es&source=aelf'],
  ])('rechaza parámetros inválidos: %s', async (_name, path) => {
    const { fetchFn, calls } = fakeFetch();
    const response = await createApp({ fetchFn }).request(path);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: 'bad-request' } });
    expect(calls).toHaveLength(0);
  });

  it('con source=aelf entrega el francés con la forma breve', async () => {
    const { fetchFn } = fakeFetch();
    const response = await createApp({ fetchFn }).request('/v1/gospel?date=2026-10-11&lang=fr&source=aelf');
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      source: 'aelf',
      reference: 'Pr 1,1-3',
      shortReference: 'Pr 1,1-2',
      shortLines: ['Une phrase de test.'],
    });
  });

  it('el francés cae a AELF cuando Evangelizo falla', async () => {
    const { fetchFn } = fakeFetch({ evangelizo: () => ({ status: 500, body: '' }) });
    const response = await createApp({ fetchFn }).request('/v1/gospel?date=2026-10-11&lang=fr');
    expect(response.status).toBe(200);
    expect(response.headers.get('x-source')).toBe('aelf');
  });

  it('otros idiomas no tienen respaldo y devuelven el error de la fuente', async () => {
    const { fetchFn } = fakeFetch({ evangelizo: () => ({ status: 500, body: '' }) });
    const response = await createApp({ fetchFn }).request('/v1/gospel?date=2026-10-11&lang=es');
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ error: { code: 'bad-response' } });
  });

  it.each([
    ['fecha fuera de rango', { body: OUT_OF_RANGE }, 400, 'out-of-range'],
    ['límite de tasa de la fuente', { status: 429, body: '' }, 503, 'rate-limited'],
    ['respuesta sin XML', { body: '<html>otra cosa</html>' }, 502, 'bad-response'],
    ['evangelio vacío', { body: XML.replace(/<reading_gospel>[\s\S]*<\/reading_gospel>/, '') }, 404, 'not-found'],
  ])('traduce el error de la fuente: %s', async (_name, result, status, code) => {
    const { fetchFn } = fakeFetch({ evangelizo: (type) => (type === 'xml' ? result : { body: HTML }) });
    const response = await createApp({ fetchFn }).request('/v1/gospel?date=2026-12-25&lang=es');
    expect(response.status).toBe(status);
    expect(await response.json()).toMatchObject({ error: { code } });
    if (code === 'rate-limited') expect(response.headers.get('retry-after')).toBe('60');
  });

  it('un fallo de red se informa como 504', async () => {
    const { fetchFn } = fakeFetch({ evangelizo: () => new Error('sin red') });
    const response = await createApp({ fetchFn }).request('/v1/gospel?date=2026-10-11&lang=es');
    expect(response.status).toBe(504);
    expect(await response.json()).toMatchObject({ error: { code: 'network' } });
  });
});

describe('caché de borde', () => {
  it('la segunda petición igual sale de la caché y no vuelve a la fuente', async () => {
    const { fetchFn, calls } = fakeFetch();
    const cache = memoryCache();
    const app = createApp({ fetchFn, cache: () => cache });

    const first = await app.request('/v1/gospel?date=2026-10-11&lang=es');
    expect(first.headers.get('x-cache')).toBe('MISS');
    const upstreamCalls = calls.length;
    expect(upstreamCalls).toBeGreaterThan(0);

    const second = await app.request('/v1/gospel?lang=es&date=2026-10-11');
    expect(second.status).toBe(200);
    expect(second.headers.get('x-cache')).toBe('HIT');
    expect(await second.json()).toMatchObject({ date: '2026-10-11', lang: 'es' });
    expect(calls).toHaveLength(upstreamCalls);
  });

  it('distingue idiomas y fuentes, y no guarda los errores', async () => {
    const failing = fakeFetch({ evangelizo: () => ({ status: 500, body: '' }) });
    const cache = memoryCache();
    const app = createApp({ fetchFn: failing.fetchFn, cache: () => cache });
    expect((await app.request('/v1/gospel?date=2026-10-11&lang=es')).status).toBe(502);
    expect(cache.size()).toBe(0);

    const ok = fakeFetch();
    const okApp = createApp({ fetchFn: ok.fetchFn, cache: () => cache });
    await okApp.request('/v1/gospel?date=2026-10-11&lang=es');
    await okApp.request('/v1/gospel?date=2026-10-11&lang=fr');
    await okApp.request('/v1/gospel?date=2026-10-11&lang=fr&source=aelf');
    expect(cache.size()).toBe(3);
  });
});

describe('otras rutas', () => {
  it('responde un 404 en JSON para rutas desconocidas', async () => {
    const response = await createApp().request('/nada');
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ error: { code: 'not-found' } });
  });

  it('atiende el preflight de CORS', async () => {
    const response = await createApp().request('/v1/gospel', {
      method: 'OPTIONS',
      headers: { Origin: 'https://danielauu.github.io', 'Access-Control-Request-Method': 'GET' },
    });
    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
  });

  it('la raíz describe el servicio', async () => {
    const response = await createApp().request('/');
    expect(await response.json()).toMatchObject({ name: 'manducapp-api' });
  });
});
