import { describe, expect, it } from 'vitest';
import { exportFilename, meditationsToJson, meditationsToText } from './exporter';
import type { Meditation } from './journal';

const AT = new Date(2026, 9, 7, 12, 0).getTime(); // 7 de octubre de 2026, hora local

const FIRST: Meditation = {
  id: 'a',
  createdAt: AT,
  date: '2026-10-11',
  reference: 'Pr 1,1-3',
  lang: 'es',
  text: 'Primera meditación.',
};
const SECOND: Meditation = { id: 'b', createdAt: AT, reference: 'Mi propio texto', lang: 'en', text: 'Segunda.' };

describe('meditationsToText', () => {
  it('escribe referencia, día y texto, separando cada meditación', () => {
    const text = meditationsToText([FIRST, SECOND], 'es');
    const [one, two] = text.split('\n\n---\n\n');
    expect(one).toContain('## Pr 1,1-3 (');
    expect(one?.toLowerCase()).toContain('domingo');
    expect(one).toContain('Primera meditación.');
    expect(two).toContain('## Mi propio texto\n');
    expect(two).not.toContain('(');
    expect(two).toContain('Segunda.');
  });

  it('sin meditaciones queda vacío', () => {
    expect(meditationsToText([], 'es')).toBe('');
  });
});

describe('meditationsToJson', () => {
  it('guarda todos los datos con la versión y la fecha de la copia', () => {
    const parsed = JSON.parse(meditationsToJson([FIRST, SECOND], 123));
    expect(parsed).toEqual({ app: 'manducapp', version: 1, exportedAt: 123, meditations: [FIRST, SECOND] });
  });
});

describe('exportFilename', () => {
  it('lleva la fecha local y la extensión', () => {
    expect(exportFilename('txt', AT)).toBe('manducapp-meditaciones-2026-10-07.txt');
    expect(exportFilename('json', AT)).toBe('manducapp-meditaciones-2026-10-07.json');
  });
});
