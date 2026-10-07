import { describe, expect, it } from 'vitest';
import { FeedError } from '../errors';
import type { FetchLike } from './http';
import { loadGospel } from './load';

// Textos inventados: los tests nunca incluyen evangelios reales.
const XML = `<?xml version="1.0" encoding="UTF-8"?>
<data-set><evangelizo>
  <litugic_t><![CDATA[Domingo de prueba]]></litugic_t>
  <reading_gospel_st><![CDATA[Pr 1,1.]]></reading_gospel_st>
  <reading_gospel><![CDATA[Una línea de prueba.]]></reading_gospel>
</evangelizo></data-set>`;

const AELF = JSON.stringify({
  informations: { jour_liturgique_nom: 'Dimanche de test' },
  messes: [{ lectures: [{ type: 'evangile', ref: 'Pr 1, 1', contenu: '<p>Une phrase de test.</p>' }] }],
});

function fakeFetch(evangelizoStatus = 200) {
  const calls: string[] = [];
  const fetchFn: FetchLike = (url) => {
    calls.push(url);
    const isAelf = url.includes('api.aelf.org');
    const status = isAelf ? 200 : evangelizoStatus;
    const body = isAelf ? AELF : url.includes('type=xml') ? XML : 'x<br /><br />Crédito.';
    return Promise.resolve({ ok: status === 200, status, text: () => Promise.resolve(body) });
  };
  return { fetchFn, calls };
}

describe('loadGospel', () => {
  it('usa Evangelizo por defecto', async () => {
    const { fetchFn } = fakeFetch();
    expect((await loadGospel(fetchFn, '2026-10-11', 'es')).source).toBe('evangelizo');
  });

  it('en francés cae a AELF si Evangelizo falla', async () => {
    const { fetchFn } = fakeFetch(500);
    expect((await loadGospel(fetchFn, '2026-10-11', 'fr')).source).toBe('aelf');
  });

  it('en otros idiomas devuelve el error de la fuente', async () => {
    const { fetchFn } = fakeFetch(500);
    await expect(loadGospel(fetchFn, '2026-10-11', 'es')).rejects.toBeInstanceOf(FeedError);
  });

  it('source=aelf va directo a AELF, sin consultar Evangelizo', async () => {
    const { fetchFn, calls } = fakeFetch();
    expect((await loadGospel(fetchFn, '2026-10-11', 'fr', 'aelf')).source).toBe('aelf');
    expect(calls.every((url) => url.includes('api.aelf.org'))).toBe(true);
  });

  it('source=evangelizo en francés no cae a AELF', async () => {
    const { fetchFn } = fakeFetch(500);
    await expect(loadGospel(fetchFn, '2026-10-11', 'fr', 'evangelizo')).rejects.toBeInstanceOf(FeedError);
  });
});
