import type { FetchLike, Gospel } from '@manducapp/core';
import { describe, expect, it } from 'vitest';
import { cacheKey, pruneGospelCache, readCachedGospel, writeCachedGospel } from './cache';
import { getGospel, prefetchGospels } from './gospel';
import { memoryStorage } from './storage';
import { estimateMinutes, gospelToView, ownTextToView } from './view';

// Textos inventados: los tests nunca incluyen evangelios reales.
const GOSPEL: Gospel = {
  date: '2026-10-11',
  lang: 'es',
  liturgicalTitle: 'Domingo de prueba',
  reference: 'Pr 1,1-3',
  lines: ['Primera línea de prueba con varias palabras.', 'Segunda línea de prueba con varias palabras.'],
  credit: 'Crédito de prueba.',
  source: 'evangelizo',
};

const DAY = 24 * 60 * 60 * 1000;

describe('caché de evangelios', () => {
  it('guarda y recupera un evangelio por fecha e idioma', () => {
    const storage = memoryStorage();
    writeCachedGospel(storage, GOSPEL, 1000);
    expect(readCachedGospel(storage, '2026-10-11', 'es')).toEqual(GOSPEL);
    expect(readCachedGospel(storage, '2026-10-11', 'en')).toBeUndefined();
    expect(readCachedGospel(storage, '2026-10-12', 'es')).toBeUndefined();
  });

  it('ignora entradas corruptas o con otra forma', () => {
    const storage = memoryStorage();
    storage.setItem(cacheKey('2026-10-11', 'es'), 'no es json');
    expect(readCachedGospel(storage, '2026-10-11', 'es')).toBeUndefined();
    storage.setItem(cacheKey('2026-10-11', 'es'), JSON.stringify({ savedAt: 1, gospel: { date: 'x' } }));
    expect(readCachedGospel(storage, '2026-10-11', 'es')).toBeUndefined();
    storage.setItem(cacheKey('2026-10-11', 'es'), JSON.stringify({ savedAt: 1, gospel: { ...GOSPEL, lines: [] } }));
    expect(readCachedGospel(storage, '2026-10-11', 'es')).toBeUndefined();
  });

  it('borra lo de más de 14 días y lo ilegible, y respeta las demás claves', () => {
    const storage = memoryStorage();
    const now = 100 * DAY;
    writeCachedGospel(storage, { ...GOSPEL, date: '2026-09-01' }, now - 20 * DAY);
    writeCachedGospel(storage, { ...GOSPEL, date: '2026-10-05' }, now - 5 * DAY);
    storage.setItem(cacheKey('2026-10-06', 'es'), '{roto');
    storage.setItem('manducapp:settings', '{"lang":"es"}');
    pruneGospelCache(storage, now);
    expect(storage.keys().sort()).toEqual(['manducapp:gospel:es:2026-10-05', 'manducapp:settings']);
  });
});

describe('getGospel', () => {
  const xml = `<?xml version="1.0"?><data-set><evangelizo>
    <litugic_t><![CDATA[Domingo de prueba]]></litugic_t>
    <reading_gospel_st><![CDATA[Pr 1,1.]]></reading_gospel_st>
    <reading_gospel><![CDATA[Una línea de prueba bastante normal.]]></reading_gospel>
  </evangelizo></data-set>`;

  function fakeFetch() {
    const calls: string[] = [];
    const fetchFn: FetchLike = (url) => {
      calls.push(url);
      const body = url.includes('type=xml') ? xml : 'x<br /><br />Crédito de prueba.';
      return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(body) });
    };
    return { fetchFn, calls };
  }

  it('la primera vez va a la fuente y guarda; la segunda sale de la caché sin red', async () => {
    const { fetchFn, calls } = fakeFetch();
    const storage = memoryStorage();
    const first = await getGospel('2026-10-11', 'es', { fetchFn, storage });
    expect(first.credit).toBe('Crédito de prueba.');
    const requests = calls.length;
    expect(requests).toBeGreaterThan(0);

    const second = await getGospel('2026-10-11', 'es', { fetchFn, storage });
    expect(second).toEqual(first);
    expect(calls).toHaveLength(requests);
  });

  it('no guarda nada si la fuente falla', async () => {
    const fetchFn: FetchLike = () => Promise.reject(new Error('sin red'));
    const storage = memoryStorage();
    await expect(getGospel('2026-10-11', 'es', { fetchFn, storage })).rejects.toMatchObject({ code: 'network' });
    expect(storage.keys()).toEqual([]);
  });
});

describe('vistas', () => {
  it('gospelToView divide el texto en oraciones y conserva el crédito', () => {
    const view = gospelToView(GOSPEL, 'sunday');
    expect(view).toMatchObject({
      kind: 'sunday',
      lang: 'es',
      date: '2026-10-11',
      title: 'Domingo de prueba',
      reference: 'Pr 1,1-3',
      credit: 'Crédito de prueba.',
    });
    expect(view.sentences).toEqual(GOSPEL.lines);
  });

  it('ownTextToView toma cada renglón como una línea y no inventa crédito', () => {
    const view = ownTextToView('  Uno dos tres cuatro cinco seis siete.\n\n  Ocho nueve diez once doce trece.  ', 'es', 'Mi propio texto');
    expect(view).toMatchObject({ kind: 'own', reference: 'Mi propio texto', title: '' });
    expect(view.credit).toBeUndefined();
    expect(view.sentences).toEqual(['Uno dos tres cuatro cinco seis siete.', 'Ocho nueve diez once doce trece.']);
  });

  it('ownTextToView separa por fin de frase un párrafo con varias frases', () => {
    const view = ownTextToView(
      'Primera frase corta de prueba aquí. Segunda frase de prueba que también aparece. Tercera frase de prueba que cierra todo.',
      'es',
      'x',
    );
    expect(view.sentences).toEqual([
      'Primera frase corta de prueba aquí.',
      'Segunda frase de prueba que también aparece.',
      'Tercera frase de prueba que cierra todo.',
    ]);
  });

  it('ownTextToView une las frases demasiado cortas con la siguiente', () => {
    const view = ownTextToView('Sí. Primera frase de prueba que ya tiene largo suficiente.', 'es', 'x');
    expect(view.sentences).toEqual(['Sí. Primera frase de prueba que ya tiene largo suficiente.']);
  });

  it('ownTextToView divide un texto corrido y largo', () => {
    const long = Array.from({ length: 50 }, (_, index) => `w${index}`).join(' ');
    expect(ownTextToView(long, 'es', 'x').sentences.length).toBeGreaterThan(1);
  });

  it('estimateMinutes nunca baja de un minuto y crece con el texto', () => {
    expect(estimateMinutes(['una oración corta de prueba'])).toBe(1);
    const sentences = Array.from({ length: 14 }, () => Array.from({ length: 19 }, (_, index) => `p${index}`).join(' '));
    expect(estimateMinutes(sentences)).toBeGreaterThan(10);
  });
});

describe('prefetchGospels', () => {
  const xml = `<?xml version="1.0"?><data-set><evangelizo>
    <litugic_t><![CDATA[Día de prueba]]></litugic_t>
    <reading_gospel_st><![CDATA[Pr 1,1.]]></reading_gospel_st>
    <reading_gospel><![CDATA[Una línea de prueba bastante normal.]]></reading_gospel>
  </evangelizo></data-set>`;

  function countingFetch(fail = false) {
    const urls: string[] = [];
    const fetchFn: FetchLike = (url) => {
      urls.push(url);
      if (fail) return Promise.reject(new Error('sin red'));
      const body = url.includes('type=xml') ? xml : 'x<br /><br />Crédito de prueba.';
      return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(body) });
    };
    return { fetchFn, urls };
  }

  it('guarda hoy y el próximo domingo, y la segunda vez no pide nada', async () => {
    const storage = memoryStorage();
    const first = countingFetch();
    await prefetchGospels('es', { fetchFn: first.fetchFn, storage }, '2026-10-07'); // miércoles
    expect(readCachedGospel(storage, '2026-10-07', 'es')).toBeDefined();
    expect(readCachedGospel(storage, '2026-10-11', 'es')).toBeDefined();
    expect(first.urls.length).toBeGreaterThan(0);

    const second = countingFetch();
    await prefetchGospels('es', { fetchFn: second.fetchFn, storage }, '2026-10-07');
    expect(second.urls).toHaveLength(0);
  });

  it('si hoy es domingo pide un solo día', async () => {
    const storage = memoryStorage();
    await prefetchGospels('es', { fetchFn: countingFetch().fetchFn, storage }, '2026-10-11');
    expect(storage.keys().filter((key) => key.startsWith('manducapp:gospel:'))).toHaveLength(1);
  });

  it('un fallo de red no rompe nada ni guarda nada', async () => {
    const storage = memoryStorage();
    await expect(
      prefetchGospels('es', { fetchFn: countingFetch(true).fetchFn, storage }, '2026-10-07'),
    ).resolves.toBeUndefined();
    expect(storage.keys()).toEqual([]);
  });
});
