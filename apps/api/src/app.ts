import {
  FeedError,
  compactDate,
  fetchAelfGospel,
  fetchEvangelizoGospel,
  isLang,
  type FeedErrorCode,
  type FetchLike,
  type Gospel,
  type Lang,
} from '@manducapp/core';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

/** Caché del borde de Cloudflare (`caches.default`); en los tests se reemplaza por una en memoria. */
export type EdgeCache = Pick<Cache, 'match' | 'put'>;

export interface AppOptions {
  fetchFn?: FetchLike;
  cache?: () => EdgeCache | undefined;
}

/** El texto de un día no cambia; se guarda poco tiempo para ser un relé transparente y no un archivo. */
const EDGE_TTL_SECONDS = 3600;
const BROWSER_TTL_SECONDS = 300;
const UPSTREAM_TIMEOUT_MS = 8000;
const RETRY_AFTER_SECONDS = 60;

const USER_AGENT = 'manducapp-api (+https://github.com/danielauu/manducapp)';

const STATUS_BY_CODE: Record<FeedErrorCode, 400 | 404 | 502 | 503 | 504> = {
  'out-of-range': 400,
  'not-found': 404,
  'bad-response': 502,
  'rate-limited': 503,
  network: 504,
};

const defaultFetch: FetchLike = (url) =>
  fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });

type Source = 'evangelizo' | 'aelf';

function errorBody(code: string, message: string) {
  return { error: { code, message } };
}

async function loadGospel(
  fetchFn: FetchLike,
  date: string,
  lang: Lang,
  source: Source | undefined,
): Promise<Gospel> {
  if (source === 'aelf') return fetchAelfGospel(fetchFn, date);
  try {
    return await fetchEvangelizoGospel(fetchFn, date, lang);
  } catch (error) {
    // AELF es la fuente oficial del francés y no limita la fecha: sirve de respaldo.
    if (lang === 'fr' && source === undefined && error instanceof FeedError) {
      return fetchAelfGospel(fetchFn, date);
    }
    throw error;
  }
}

export function createApp(options: AppOptions = {}) {
  const fetchFn = options.fetchFn ?? defaultFetch;
  const app = new Hono();

  app.use('/v1/*', cors({ origin: '*', allowMethods: ['GET', 'OPTIONS'], maxAge: 86_400 }));

  app.get('/', (c) => c.json({ name: 'manducapp-api', endpoints: ['/v1/gospel?date=YYYY-MM-DD&lang=es'] }));

  app.get('/v1/gospel', async (c) => {
    const date = c.req.query('date') ?? '';
    const lang = (c.req.query('lang') ?? '').toLowerCase();
    const sourceParam = c.req.query('source');

    try {
      compactDate(date);
    } catch {
      return c.json(errorBody('bad-request', 'El parámetro "date" debe ser una fecha válida YYYY-MM-DD'), 400);
    }
    if (!isLang(lang)) {
      return c.json(errorBody('bad-request', 'El parámetro "lang" debe ser es, en, fr, it, de o pl'), 400);
    }
    if (sourceParam !== undefined && sourceParam !== 'evangelizo' && sourceParam !== 'aelf') {
      return c.json(errorBody('bad-request', 'El parámetro "source" debe ser evangelizo o aelf'), 400);
    }
    if (sourceParam === 'aelf' && lang !== 'fr') {
      return c.json(errorBody('bad-request', 'La fuente "aelf" solo ofrece francés'), 400);
    }
    const source = sourceParam;

    const cache = options.cache?.();
    const query = `date=${date}&lang=${lang}${source ? `&source=${source}` : ''}`;
    const cacheKey = new Request(`https://manducapp-api.invalid/v1/gospel?${query}`);
    const cached = await cache?.match(cacheKey);
    if (cached) {
      const hit = new Response(cached.body, cached);
      hit.headers.set('X-Cache', 'HIT');
      return hit;
    }

    try {
      const gospel = await loadGospel(fetchFn, date, lang, source);
      const response = c.json(gospel, 200, {
        'Cache-Control': `public, max-age=${BROWSER_TTL_SECONDS}, s-maxage=${EDGE_TTL_SECONDS}`,
        'X-Cache': 'MISS',
        'X-Source': gospel.source,
      });
      if (cache) {
        const store = cache.put(cacheKey, response.clone());
        try {
          c.executionCtx.waitUntil(store);
        } catch {
          await store;
        }
      }
      return response;
    } catch (error) {
      if (error instanceof FeedError) {
        const status = STATUS_BY_CODE[error.code];
        const headers: Record<string, string> =
          error.code === 'rate-limited' ? { 'Retry-After': String(RETRY_AFTER_SECONDS) } : {};
        return c.json(errorBody(error.code, error.message), status, headers);
      }
      throw error;
    }
  });

  app.notFound((c) => c.json(errorBody('not-found', 'Ruta inexistente'), 404));
  app.onError((_error, c) => c.json(errorBody('internal', 'Error interno'), 500));

  return app;
}
