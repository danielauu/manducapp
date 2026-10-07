import { describe, expect, it } from 'vitest';
import { planSession } from './plan';

const sentences = (count: number) =>
  Array.from({ length: count }, () => Array.from({ length: 15 }, (_, index) => `p${index}`).join(' '));

describe('planSession', () => {
  it('si todo cabe, propone todo y avisa que cabe', () => {
    const plan = planSession(sentences(5), 60, 'pairs-and-blocks', null);
    expect(plan).toMatchObject({ total: 5, suggested: 5, count: 5, fits: true });
    expect(plan.minutes).toBeGreaterThan(0);
  });

  it('si no cabe, sugiere menos oraciones y lo sugerido sí cabe', () => {
    const plan = planSession(sentences(20), 10, 'pairs-and-blocks', null);
    expect(plan.suggested).toBeLessThan(20);
    expect(plan.count).toBe(plan.suggested);
    expect(plan.fits).toBe(true);
    expect(plan.seconds).toBeLessThanOrEqual(10 * 60);
  });

  it('respeta lo que eligió el usuario aunque supere el tiempo, y lo avisa', () => {
    const plan = planSession(sentences(20), 10, 'pairs-and-blocks', 20);
    expect(plan.count).toBe(20);
    expect(plan.fits).toBe(false);
    expect(plan.suggested).toBeLessThan(20);
  });

  it('acota lo elegido entre 1 y el total', () => {
    expect(planSession(sentences(5), 60, 'minimal', 99).count).toBe(5);
    expect(planSession(sentences(5), 60, 'minimal', 0).count).toBe(1);
  });

  it('sin uniones caben más oraciones que con uniones acumulativas', () => {
    const minimal = planSession(sentences(30), 15, 'minimal', null).suggested;
    const cumulative = planSession(sentences(30), 15, 'cumulative', null).suggested;
    expect(minimal).toBeGreaterThan(cumulative);
  });

  it('con más tiempo caben más oraciones', () => {
    const short = planSession(sentences(30), 10, 'pairs-and-blocks', null).suggested;
    const long = planSession(sentences(30), 45, 'pairs-and-blocks', null).suggested;
    expect(long).toBeGreaterThan(short);
  });

  it('sin oraciones no hay nada que memorizar', () => {
    expect(planSession([], 30, 'pairs-and-blocks', null)).toMatchObject({ total: 0, count: 0, suggested: 0 });
  });

  it('si ni una oración cabe, propone una y avisa que no cabe', () => {
    const plan = planSession(sentences(3), 0, 'pairs-and-blocks', null);
    expect(plan).toMatchObject({ count: 1, fits: false });
  });
});
