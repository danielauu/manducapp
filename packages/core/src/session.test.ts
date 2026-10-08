import { describe, expect, it } from 'vitest';
import { buildSession, type SessionStep } from './session';

const sentences = (count: number) => Array.from({ length: count }, (_, index) => `s${index + 1}`);
const kinds = (steps: SessionStep[]) => steps.map((step) => step.kind);
const ranges = (steps: SessionStep[], kind: SessionStep['kind']) =>
  steps.filter((step) => step.kind === kind).map((step) => [step.from, step.to]);

describe('buildSession: una persona', () => {
  it('aprende cada oración 3 veces, une los pares y cierra con el recitado y la reflexión', () => {
    const steps = buildSession(sentences(4));
    // 4 × 3 aprender + 3 uniones + final + reflexión
    expect(steps).toHaveLength(17);
    expect(steps.filter((step) => step.kind === 'learn')).toHaveLength(12);
    expect(ranges(steps, 'link')).toEqual([[0, 1], [1, 2], [2, 3]]);
    expect(ranges(steps, 'final')).toEqual([[0, 3]]);
    expect(kinds(steps).at(-2)).toBe('final');
    expect(kinds(steps).at(-1)).toBe('reflection');
  });

  it('intercala cada unión justo después de aprender la oración nueva', () => {
    const steps = buildSession(sentences(3));
    expect(kinds(steps)).toEqual([
      'learn', 'learn', 'learn', // s1
      'learn', 'learn', 'learn', // s2
      'link', // s1+s2
      'learn', 'learn', 'learn', // s3
      'link', // s2+s3
      'final',
      'reflection',
    ]);
    expect(steps.find((step) => step.kind === 'link')?.text).toBe('s1 s2');
  });

  it('numera las repeticiones de cada serie', () => {
    const learn = buildSession(sentences(2)).filter((step) => step.kind === 'learn' && step.from === 0);
    expect(learn.map((step) => step.repetition)).toEqual([1, 2, 3]);
    expect(learn.every((step) => step.repetitions === 3 && step.speaker === 0)).toBe(true);
  });

  it('con una sola oración no hay uniones', () => {
    expect(kinds(buildSession(['única']))).toEqual(['learn', 'learn', 'learn', 'final', 'reflection']);
  });

  it('el texto de cada paso sale de las oraciones, y la reflexión no tiene texto', () => {
    const steps = buildSession(sentences(3));
    expect(steps.find((step) => step.kind === 'final')?.text).toBe('s1 s2 s3');
    expect(steps.at(-1)).toMatchObject({ kind: 'reflection', text: '', speaker: null });
  });

  it('sin oraciones no hay sesión', () => {
    expect(buildSession([])).toEqual([]);
  });
});

describe('buildSession: bloques', () => {
  it('al cerrar cada bloque recita el bloque y lo acumulado, sin repetir lo que cubre el final', () => {
    const steps = buildSession(sentences(10));
    expect(ranges(steps, 'block')).toEqual([[0, 3], [4, 7], [0, 7]]);
    expect(ranges(steps, 'final')).toEqual([[0, 9]]);
  });

  it('no repite el bloque cuando coincide con el texto completo', () => {
    expect(ranges(buildSession(sentences(4)), 'block')).toEqual([]);
  });

  it('respeta un blockSize distinto', () => {
    // el último bloque [6,8] también se recita; lo acumulado [0,8] lo cubre el final
    expect(ranges(buildSession(sentences(9), { blockSize: 3 }), 'block')).toEqual([
      [0, 2],
      [3, 5],
      [0, 5],
      [6, 8],
    ]);
  });
});

describe('buildSession: otras estrategias', () => {
  it('acumulativa: tras cada oración nueva recita todo lo aprendido', () => {
    const steps = buildSession(sentences(4), { strategy: 'cumulative' });
    expect([...ranges(steps, 'link'), ...ranges(steps, 'block')]).toEqual([[0, 1], [0, 2]]);
  });

  it('mínima: solo aprender, final y reflexión', () => {
    const steps = buildSession(sentences(5), { strategy: 'minimal' });
    expect(new Set(kinds(steps))).toEqual(new Set(['learn', 'final', 'reflection']));
    expect(steps).toHaveLength(5 * 3 + 2);
  });
});

describe('buildSession: grupo', () => {
  it('con 3 personas la oración se repite 3 veces: una pasada, cada persona una vez', () => {
    const steps = buildSession(sentences(2), { people: 3 });
    const first = steps.filter((step) => step.kind === 'learn' && step.from === 0);
    expect(first).toHaveLength(3);
    expect(first.every((step) => step.repetitions === 3)).toBe(true);
    expect(first.map((step) => step.speaker)).toEqual([0, 1, 2]);
  });

  it('de a dos es lo mismo que solo: 3 repeticiones, pasando entre las dos personas', () => {
    const solo = buildSession(sentences(2), { people: 1 }).filter((step) => step.kind === 'learn');
    const pair = buildSession(sentences(2), { people: 2 }).filter((step) => step.kind === 'learn');
    expect(pair).toHaveLength(solo.length);
    expect(pair.filter((step) => step.from === 0).map((step) => step.speaker)).toEqual([0, 1, 0]);
    expect(pair.filter((step) => step.from === 1).map((step) => step.speaker)).toEqual([1, 0, 1]);
  });

  it('el número de repeticiones es máx(3, personas): entre 3 y 5', () => {
    const repetitions = (people: number) =>
      buildSession(['una oración'], { people }).filter((step) => step.kind === 'learn').length;
    expect([1, 2, 3, 4, 5].map(repetitions)).toEqual([3, 3, 3, 4, 5]);
  });

  it('con 4 y 5 personas cada una dice la oración al menos una vez por oración', () => {
    for (const people of [4, 5]) {
      const learn = buildSession(['una oración'], { people }).filter((step) => step.kind === 'learn');
      expect(new Set(learn.map((step) => step.speaker)).size).toBe(people);
    }
  });

  it('se puede subir el mínimo de repeticiones', () => {
    const learn = buildSession(['una oración'], { people: 2, minRepetitions: 5 }).filter((step) => step.kind === 'learn');
    expect(learn).toHaveLength(5);
  });

  it('cada oración la empieza una persona distinta, rotando', () => {
    const steps = buildSession(sentences(4), { people: 3 });
    const starters = [0, 1, 2, 3].map(
      (index) => steps.find((step) => step.kind === 'learn' && step.from === index)?.speaker,
    );
    expect(starters).toEqual([0, 1, 2, 0]);
  });

  it('cada unión se dice una sola vez y quien la dice va rotando', () => {
    const steps = buildSession(sentences(4), { people: 3 });
    const links = steps.filter((step) => step.kind === 'link');
    expect(links.map((step) => [step.from, step.to])).toEqual([[0, 1], [1, 2], [2, 3]]);
    expect(links.every((step) => step.repetitions === 1)).toBe(true);
    expect(links.map((step) => step.speaker)).toEqual([0, 1, 2]);
  });

  it('de a dos y de a tres hay los mismos pasos que solo, salvo quién habla', () => {
    const shape = (people: number) =>
      buildSession(sentences(6), { people }).map((step) => `${step.kind}:${step.from}-${step.to}`);
    expect(shape(2)).toEqual(shape(1));
    expect(shape(3)).toEqual(shape(1));
  });

  it('solo desde 4 personas hay más pasos que solo, y son las repeticiones de cada oración', () => {
    const count = (people: number) => buildSession(sentences(6), { people }).length;
    expect(count(4)).toBe(count(1) + 6);
    expect(count(5)).toBe(count(1) + 12);
  });

  it('el recitado final lo dice el grupo junto', () => {
    expect(buildSession(sentences(3), { people: 4 }).find((step) => step.kind === 'final')?.speaker).toBeNull();
  });
});

describe('buildSession: validación', () => {
  it('rechaza más de 5 personas, cero y valores no enteros', () => {
    expect(() => buildSession(sentences(2), { people: 6 })).toThrow(RangeError);
    expect(() => buildSession(sentences(2), { people: 0 })).toThrow(RangeError);
    expect(() => buildSession(sentences(2), { people: 2.5 })).toThrow(RangeError);
    expect(() => buildSession(sentences(2), { minRepetitions: 0 })).toThrow(RangeError);
    expect(() => buildSession(sentences(2), { blockSize: 1 })).toThrow(RangeError);
  });
});
