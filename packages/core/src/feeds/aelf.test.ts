import { describe, expect, it } from 'vitest';
import { AELF_CREDIT, aelfUrl, fetchAelfGospel, parseAelfGospel } from './aelf';
import type { FetchLike } from './http';

// Estructura real de AELF, con texto inventado.
const LONG_HTML =
  '<p>En ce temps-là,<br />\n\u00a0\u00a0 \u00a0Jésus dit une chose de test<br />\nà ceux qui écoutent\u00a0:<br />\n\u00a0\u00a0 \u00a0«\u00a0Première phrase de test.\u00a0»</p>\n\n' +
  '<p>\u00a0\u00a0\u00a0 Deuxième paragraphe de test,<br />\navec une seconde ligne.<br />\nTroisième phrase du même paragraphe\u00a0!</p>\n\n' +
  '<p>\u00a0\u00a0\u00a0 – Acclamons la Parole de Dieu.</p>\n\n<p>\u00a0</p>\n\n<p>OU LECTURE BREVE</p>';

const SHORT_HTML =
  '<p>En ce temps-là,<br />\n\u00a0\u00a0 \u00a0Jésus dit une chose de test.</p>\n\n' +
  '<p>\u00a0\u00a0\u00a0 – Acclamons la Parole de Dieu.</p>';

const payload = (lectures: unknown[]) => ({
  informations: { date: '2026-10-11', jour_liturgique_nom: 'Dimanche de test (semaine IV du Psautier)' },
  messes: [{ nom: 'Messe du jour', lectures }],
});

const GOSPEL_LONG = { type: 'evangile', ref: 'Pr 1,\u00a01-3', contenu: LONG_HTML };
const GOSPEL_SHORT = { type: 'evangile', ref: 'Pr 1,\u00a01-2', contenu: SHORT_HTML };

describe('parseAelfGospel', () => {
  it('parte los párrafos en frases y descarta las fórmulas litúrgicas', () => {
    const gospel = parseAelfGospel(
      payload([{ type: 'lecture_1', ref: 'X 1', contenu: '<p>otra</p>' }, GOSPEL_LONG]),
      '2026-10-11',
    );
    expect(gospel.lines).toEqual([
      'En ce temps-là, Jésus dit une chose de test à ceux qui écoutent : « Première phrase de test. »',
      'Deuxième paragraphe de test, avec une seconde ligne.',
      'Troisième phrase du même paragraphe !',
    ]);
    expect(gospel).toMatchObject({
      date: '2026-10-11',
      lang: 'fr',
      reference: 'Pr 1,1-3',
      liturgicalTitle: 'Dimanche de test (semaine IV du Psautier)',
      credit: AELF_CREDIT,
      source: 'aelf',
    });
    expect(gospel.shortLines).toBeUndefined();
  });

  it('ofrece la forma breve cuando AELF la lista y es más corta', () => {
    const gospel = parseAelfGospel(payload([GOSPEL_LONG, GOSPEL_SHORT]), '2026-10-11');
    expect(gospel.shortLines).toEqual(['En ce temps-là, Jésus dit une chose de test.']);
    expect(gospel.shortReference).toBe('Pr 1,1-2');
  });

  it('ignora una segunda lectura que no es más corta que la primera', () => {
    const gospel = parseAelfGospel(payload([GOSPEL_SHORT, GOSPEL_LONG]), '2026-10-11');
    expect(gospel.shortLines).toBeUndefined();
  });

  it('falla con not-found si no hay evangelio y con bad-response si la forma es inesperada', () => {
    expect(() => parseAelfGospel(payload([{ type: 'psaume', contenu: '<p>x</p>' }]), '2026-10-11')).toThrowError(
      expect.objectContaining({ code: 'not-found' }),
    );
    expect(() => parseAelfGospel({ foo: 1 }, '2026-10-11')).toThrowError(
      expect.objectContaining({ code: 'bad-response' }),
    );
  });
});

describe('fetchAelfGospel', () => {
  it('pide la URL de AELF y parsea el JSON', async () => {
    let requested = '';
    const fetchFn: FetchLike = (url) => {
      requested = url;
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(payload([GOSPEL_LONG]))),
      });
    };
    const gospel = await fetchAelfGospel(fetchFn, '2026-10-11');
    expect(requested).toBe(aelfUrl('2026-10-11'));
    expect(gospel.lines).toHaveLength(3);
  });

  it('falla con bad-response si la respuesta no es JSON', async () => {
    const fetchFn: FetchLike = () =>
      Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve('<html>') });
    await expect(fetchAelfGospel(fetchFn, '2026-10-11')).rejects.toMatchObject({
      code: 'bad-response',
    });
  });
});
