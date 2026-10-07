import { describe, expect, it } from 'vitest';
import { buildSession } from './session';
import { estimateSessionSeconds, fitToBudget, hasVoice, recitationSeconds, speechSeconds, stepSeconds } from './timing';
import { wordCount } from './text';

const words = (count: number) => Array.from({ length: count }, (_, index) => `w${index}`).join(' ');

describe('wordCount', () => {
  it('no cuenta los signos sueltos', () => {
    expect(wordCount('dit : « Le royaume » – oui')).toBe(4);
    expect(wordCount('')).toBe(0);
  });
});

describe('stepSeconds y estimateSessionSeconds', () => {
  it('una oración de 10 palabras para una persona', () => {
    // voz 4 s al inicio, y por repetición 4 × 1,2 + 1 = 5,8 s; final: 5,8 s
    const steps = buildSession([words(10)]);
    expect(estimateSessionSeconds(steps)).toBeCloseTo(4 + 3 * 5.8 + 5.8, 5);
  });

  it('la reflexión no suma tiempo', () => {
    const reflection = buildSession(['uno dos tres']).at(-1);
    expect(reflection && stepSeconds(reflection)).toBe(0);
  });

  it('crece con el número de personas', () => {
    const text = [words(12), words(15), words(9)];
    const solo = estimateSessionSeconds(buildSession(text, { people: 1 }));
    const trio = estimateSessionSeconds(buildSession(text, { people: 3 }));
    const five = estimateSessionSeconds(buildSession(text, { people: 5 }));
    expect(trio).toBeGreaterThan(solo);
    expect(five).toBeGreaterThan(trio);
  });

  it('la voz en cada repetición alarga la sesión', () => {
    const steps = buildSession([words(10)]);
    expect(estimateSessionSeconds(steps, { voiceOnEveryRepetition: true })).toBeGreaterThan(
      estimateSessionSeconds(steps),
    );
  });

  it('un evangelio dominical típico cabe holgado en 30 minutos para una persona', () => {
    const gospel = Array.from({ length: 14 }, () => words(19));
    const minutes = estimateSessionSeconds(buildSession(gospel)) / 60;
    expect(minutes).toBeGreaterThan(10);
    expect(minutes).toBeLessThan(30);
  });
});

describe('fitToBudget', () => {
  const gospel = Array.from({ length: 20 }, () => words(15));

  it('si todo cabe, no recorta', () => {
    const result = fitToBudget(gospel, 10 * 3600);
    expect(result).toMatchObject({ count: 20, fits: true });
    expect(result.seconds).toBe(result.totalSeconds);
  });

  it('recorta al último prefijo que cabe en el presupuesto', () => {
    const budget = 15 * 60;
    const result = fitToBudget(gospel, budget);
    expect(result.count).toBeLessThan(20);
    expect(result.seconds).toBeLessThanOrEqual(budget);
    expect(result.totalSeconds).toBeGreaterThan(budget);
    // con una oración más ya no cabría
    expect(estimateSessionSeconds(buildSession(gospel.slice(0, result.count + 1)))).toBeGreaterThan(budget);
  });

  it('prefiere terminar en un punto final cercano', () => {
    const sentences = Array.from({ length: 12 }, (_, index) => `${words(15)}${index % 4 === 3 ? '.' : ';'}`);
    const seconds7 = estimateSessionSeconds(buildSession(sentences.slice(0, 7)));
    const seconds8 = estimateSessionSeconds(buildSession(sentences.slice(0, 8)));
    const result = fitToBudget(sentences, (seconds7 + seconds8) / 2);
    expect(result.count).toBe(4);
  });

  it('con más personas recorta más', () => {
    const solo = fitToBudget(gospel, 20 * 60, { people: 1 });
    const five = fitToBudget(gospel, 20 * 60, { people: 5 });
    expect(five.count).toBeLessThan(solo.count);
  });

  it('si ni una oración cabe, propone una y avisa que no cabe', () => {
    expect(fitToBudget(gospel, 1)).toMatchObject({ count: 1, fits: false });
  });

  it('sin oraciones no hay nada que recortar', () => {
    expect(fitToBudget([])).toMatchObject({ count: 0, seconds: 0, fits: true });
  });
});

describe('piezas del tiempo de un paso', () => {
  it('voz y recitado salen de las palabras y de los parámetros', () => {
    expect(speechSeconds(words(10))).toBeCloseTo(4, 5);
    expect(recitationSeconds(words(10))).toBeCloseTo(4 * 1.2 + 1, 5);
    expect(recitationSeconds(words(10), { recitationFactor: 2, gapSeconds: 0 })).toBeCloseTo(8, 5);
  });

  it('la voz lee solo la primera repetición de cada oración, salvo que se pida en todas', () => {
    const learn = buildSession([words(10)]).filter((step) => step.kind === 'learn');
    expect(learn.map((step) => hasVoice(step))).toEqual([true, false, false]);
    expect(learn.map((step) => hasVoice(step, { voiceOnEveryRepetition: true }))).toEqual([true, true, true]);
    const review = buildSession([words(10), words(10), words(10)]).find((step) => step.kind === 'link');
    expect(review).toBeDefined();
    expect(review && hasVoice(review, { voiceOnEveryRepetition: true })).toBe(false);
  });

  it('stepSeconds es la suma de ambas piezas', () => {
    const [first, second] = buildSession([words(10)]);
    expect(first && stepSeconds(first)).toBeCloseTo(speechSeconds(words(10)) + recitationSeconds(words(10)), 5);
    expect(second && stepSeconds(second)).toBeCloseTo(recitationSeconds(words(10)), 5);
  });
});
