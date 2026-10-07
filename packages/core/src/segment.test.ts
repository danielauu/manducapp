import { describe, expect, it } from 'vitest';
import { segment } from './segment';

// Todos los textos son inventados: los tests no incluyen evangelios reales.

const words = (text: string) => text.split(' ').filter(Boolean).length;
const numbered = (count: number, prefix = 'w') =>
  Array.from({ length: count }, (_, index) => `${prefix}${index + 1}`);

describe('segment: unir líneas cortas', () => {
  it('une una línea corta con la siguiente', () => {
    expect(
      segment(['Les dijo:', 'Vayan al pueblo de enfrente y busquen un burro atado junto a su cría.'], 'es'),
    ).toEqual(['Les dijo: Vayan al pueblo de enfrente y busquen un burro atado junto a su cría.']);
  });

  it('une la última línea corta con la anterior', () => {
    expect(segment(['Esta es una frase de prueba bastante normal para el test.', 'Amén.'], 'es')).toEqual([
      'Esta es una frase de prueba bastante normal para el test. Amén.',
    ]);
  });

  it('deja intactas las líneas que ya tienen un largo razonable', () => {
    const lines = [
      'Primera línea de prueba con varias palabras.',
      'Segunda línea de prueba también con varias palabras.',
    ];
    expect(segment(lines, 'es')).toEqual(lines);
  });

  it('ignora líneas vacías y colapsa espacios', () => {
    expect(segment(['', '   ', 'Una  línea   con  espacios  de prueba normales.'], 'es')).toEqual([
      'Una línea con espacios de prueba normales.',
    ]);
    expect(segment([], 'es')).toEqual([]);
  });
});

describe('segment: dividir líneas largas', () => {
  it('prefiere el punto y coma cercano al centro', () => {
    const left = 'Uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce;';
    const right =
      'quince dieciséis diecisiete dieciocho diecinueve veinte veintiuno veintidós veintitrés veinticuatro veinticinco veintiséis veintisiete veintiocho.';
    expect(segment([`${left} ${right}`], 'es')).toEqual([left, right]);
  });

  it('respeta el mínimo de palabras a cada lado del corte', () => {
    const line = `Sí; ${numbered(24).join(' ')}.`;
    const result = segment([line], 'es');
    expect(result.length).toBeGreaterThan(1);
    expect(result).not.toContain('Sí;');
    for (const piece of result) {
      expect(words(piece)).toBeGreaterThanOrEqual(5);
      expect(words(piece)).toBeLessThanOrEqual(22);
    }
  });

  it('corta antes de una conjunción cuando no hay puntuación', () => {
    const before =
      'alfa bravo charlie delta echo foxtrot golf hotel india juliet kilo lima mike november';
    const after = 'y oscar papa quebec romeo sierra tango uniform victor whiskey xray yankee zulu uno dos tres';
    expect(segment([`${before} ${after}`], 'es')).toEqual([before, after]);
  });

  it('usa las conjunciones del idioma pedido', () => {
    const before = numbered(14, 'a').join(' ');
    const after = `and ${numbered(15, 'b').join(' ')}`;
    expect(segment([`${before} ${after}`], 'en')).toEqual([before, after]);
  });

  it('sin puntuación ni conjunciones corta cerca del centro', () => {
    const result = segment([numbered(40).join(' ')], 'es');
    expect(result.map(words)).toEqual([20, 20]);
  });

  it('divide recursivamente hasta que cada parte cabe', () => {
    const result = segment([numbered(100).join(' ')], 'es');
    for (const piece of result) expect(words(piece)).toBeLessThanOrEqual(22);
    expect(result.join(' ')).toBe(numbered(100).join(' '));
  });

  it('respeta un maxWords distinto', () => {
    const result = segment([numbered(30).join(' ')], 'es', { maxWords: 10 });
    for (const piece of result) {
      expect(words(piece)).toBeLessThanOrEqual(10);
      expect(words(piece)).toBeGreaterThanOrEqual(5);
    }
  });
});

describe('segment: citas', () => {
  it('no parte una cita corta y corta antes de ella', () => {
    const intro = 'El maestro dijo a los discípulos con voz firme y serena:';
    const quote =
      "'Vayan, anuncien la buena noticia, bauticen, enseñen y no tengan miedo jamás de nada porque yo estoy con ustedes.'";
    expect(segment([`${intro} ${quote}`], 'es')).toEqual([intro, quote]);
  });

  it('puede partir una cita más larga que una oración', () => {
    const intro = 'Dijo:';
    const first = "'uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece;";
    const second =
      "catorce quince dieciséis diecisiete dieciocho diecinueve veinte veintiuno veintidós veintitrés veinticuatro veinticinco.'";
    const result = segment([`${intro} ${first} ${second}`], 'es');
    expect(result).toEqual([`${intro} ${first}`, second]);
  });

  it('no deja un » o un : suelto al inicio de una oración (puntuación separada, como en francés)', () => {
    const closing = `${numbered(12, 'a').join(' ')} fin. » ${numbered(14, 'b').join(' ')}`;
    expect(segment([closing], 'fr')).toEqual([
      `${numbered(12, 'a').join(' ')} fin. »`,
      numbered(14, 'b').join(' '),
    ]);

    const colon = `${numbered(13, 'a').join(' ')} : ${numbered(14, 'b').join(' ')}`;
    const result = segment([colon], 'fr');
    expect(result).toEqual([`${numbered(13, 'a').join(' ')} :`, numbered(14, 'b').join(' ')]);
  });

  it('entiende las comillas angulares y las anidadas', () => {
    const intro = 'Il leur dit en paraboles :';
    const quote =
      '« Le royaume est comparable à un roi qui fit une noce ; ‘Voilà : tout est prêt, venez à la noce.’ »';
    const result = segment([`${intro} ${quote}`], 'fr');
    expect(result.join(' ')).toBe(`${intro} ${quote}`);
    for (const piece of result) expect(words(piece)).toBeLessThanOrEqual(22);
  });
});

describe('segment: invariantes', () => {
  it('conserva todo el texto, en orden, sin agregar ni perder palabras', () => {
    const lines = [
      'Corta.',
      numbered(45, 'x').join(' ') + ', fin; otra parte aquí.',
      'Una línea intermedia de largo normal para la prueba.',
      `'${numbered(12, 'q').join(' ')}.'`,
      'Final.',
    ];
    const result = segment(lines, 'es');
    expect(result.join(' ')).toBe(lines.join(' '));
    for (const piece of result) {
      expect(words(piece)).toBeLessThanOrEqual(22);
    }
  });
});
