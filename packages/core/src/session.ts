export const MAX_PEOPLE = 5;
export const DEFAULT_MIN_REPETITIONS = 3;
export const DEFAULT_BLOCK_SIZE = 4;

export type StepKind = 'learn' | 'link' | 'block' | 'final' | 'reflection';

/**
 * Cómo se van uniendo las oraciones a medida que se avanza:
 * - `pairs-and-blocks`: la unión de cada par y, al cerrar un bloque, el bloque y lo acumulado hasta ahí.
 * - `cumulative`: tras cada oración nueva, todo lo aprendido desde el inicio (solo para textos cortos).
 * - `minimal`: sin uniones intermedias; solo el recitado final.
 */
export type LinkStrategy = 'pairs-and-blocks' | 'cumulative' | 'minimal';

export interface SessionOptions {
  /** Personas que rezan juntas, de 1 a 5. */
  people?: number;
  /**
   * Cada oración nueva se repite `max(minRepetitions, people)` veces: una pasada por cada persona
   * y, como mínimo, las 3 de siempre. Con una o dos personas son 3; con 4 son 4; con 5 son 5.
   */
  minRepetitions?: number;
  blockSize?: number;
  strategy?: LinkStrategy;
}

export interface SessionStep {
  kind: StepKind;
  /** Índices, ambos inclusive, de las oraciones que se recitan en este paso. */
  from: number;
  to: number;
  /** Texto a recitar; vacío en la reflexión. */
  text: string;
  /** Persona que recita (0 a people-1), o `null` si recita el grupo junto o no recita nadie. */
  speaker: number | null;
  /** Repetición actual dentro de la serie y total de la serie. */
  repetition: number;
  repetitions: number;
}

function assertInteger(name: string, value: number, min: number, max = Infinity): void {
  if (!Number.isInteger(value) || value < min || value > max) {
    const range = max === Infinity ? `≥ ${min}` : `entre ${min} y ${max}`;
    throw new RangeError(`${name} debe ser un entero ${range} (se recibió ${value})`);
  }
}

/**
 * Convierte las oraciones en la lista ordenada de pasos de una manducación:
 * aprender cada oración (3 veces, o una por persona si son más de 3), ir uniéndolas (cada unión se dice una
 * vez), recitar todo y reflexionar.
 */
export function buildSession(sentences: readonly string[], options: SessionOptions = {}): SessionStep[] {
  const people = options.people ?? 1;
  const minRepetitions = options.minRepetitions ?? DEFAULT_MIN_REPETITIONS;
  const blockSize = options.blockSize ?? DEFAULT_BLOCK_SIZE;
  const strategy = options.strategy ?? 'pairs-and-blocks';
  assertInteger('people', people, 1, MAX_PEOPLE);
  assertInteger('minRepetitions', minRepetitions, 1);
  assertInteger('blockSize', blockSize, 2);

  const last = sentences.length - 1;
  if (last < 0) return [];

  const steps: SessionStep[] = [];
  let reviewTurn = 0;
  const textOf = (from: number, to: number) => sentences.slice(from, to + 1).join(' ');
  // Lo que cubre todo el texto lo recita el paso final, así que no se repite antes.
  const coversAll = (from: number, to: number) => from === 0 && to === last;

  // Una unión se dice una sola vez, también en grupo: quien la dice va rotando. Así de a dos tarda lo
  // mismo que solo, y el tiempo solo crece por las repeticiones de cada oración (desde 4 personas).
  const review = (from: number, to: number) => {
    steps.push({
      kind: to - from + 1 <= 2 ? 'link' : 'block',
      from,
      to,
      text: textOf(from, to),
      speaker: reviewTurn++ % people,
      repetition: 1,
      repetitions: 1,
    });
  };

  const repetitions = Math.max(minRepetitions, people);
  for (let i = 0; i <= last; i++) {
    // El primero en repetir cada oración va rotando para repartir el turno de arranque.
    for (let rep = 0; rep < repetitions; rep++) {
      steps.push({
        kind: 'learn',
        from: i,
        to: i,
        text: sentences[i] ?? '',
        speaker: (i + rep) % people,
        repetition: rep + 1,
        repetitions,
      });
    }

    if (strategy === 'cumulative') {
      if (i >= 1 && !coversAll(0, i)) review(0, i);
    } else if (strategy === 'pairs-and-blocks') {
      if (i >= 1 && !coversAll(i - 1, i)) review(i - 1, i);
      const blockStart = i - (i % blockSize);
      const blockEnd = Math.min(blockStart + blockSize - 1, last);
      if (i === blockEnd) {
        if (blockEnd - blockStart + 1 > 2 && !coversAll(blockStart, blockEnd)) review(blockStart, blockEnd);
        if (blockStart > 0 && !coversAll(0, blockEnd)) review(0, blockEnd);
      }
    }
  }

  steps.push({
    kind: 'final',
    from: 0,
    to: last,
    text: textOf(0, last),
    speaker: null,
    repetition: 1,
    repetitions: 1,
  });
  steps.push({ kind: 'reflection', from: 0, to: last, text: '', speaker: null, repetition: 1, repetitions: 1 });
  return steps;
}
