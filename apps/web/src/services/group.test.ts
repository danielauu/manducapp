import { describe, expect, it } from 'vitest';
import { MAX_PEOPLE, PEOPLE_OPTIONS, displayName, normalizeNames } from './group';

describe('grupo', () => {
  it('ofrece de 1 a 5 personas', () => {
    expect(MAX_PEOPLE).toBe(5);
    expect(PEOPLE_OPTIONS).toEqual([1, 2, 3, 4, 5]);
  });

  it('normalizeNames siempre devuelve cinco nombres, recortados y sin basura', () => {
    expect(normalizeNames(undefined)).toEqual(['', '', '', '', '']);
    expect(normalizeNames(['  Ana ', 'Luis'])).toEqual(['Ana', 'Luis', '', '', '']);
    expect(normalizeNames(['a', 2, null, {}, 'e', 'sobra'])).toEqual(['a', '', '', '', 'e']);
    expect(normalizeNames(['x'.repeat(50)])[0]).toHaveLength(30);
    expect(normalizeNames('no es lista')).toEqual(['', '', '', '', '']);
  });

  it('displayName usa el nombre escrito o «Persona N»', () => {
    const fallback = (number: number) => `Persona ${number}`;
    expect(displayName(['Ana', '', '  '], 0, fallback)).toBe('Ana');
    expect(displayName(['Ana', '', '  '], 1, fallback)).toBe('Persona 2');
    expect(displayName(['Ana', '', '  '], 2, fallback)).toBe('Persona 3');
    expect(displayName([], 4, fallback)).toBe('Persona 5');
  });
});
