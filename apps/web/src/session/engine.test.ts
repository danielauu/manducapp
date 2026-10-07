import { buildSession } from '@manducapp/core';
import { describe, expect, it } from 'vitest';
import {
  initialPlayerState,
  progressOf,
  reducePlayer,
  type PlayerAction,
  type PlayerConfig,
  type PlayerState,
} from './engine';

const sentences = ['uno dos tres cuatro', 'cinco seis siete ocho', 'nueve diez once doce'];

function config(overrides: Partial<PlayerConfig> = {}): PlayerConfig {
  return { steps: buildSession(sentences), voiceEveryRepetition: false, voiceAvailable: true, ...overrides };
}

function run(cfg: PlayerConfig, actions: PlayerAction[], from = initialPlayerState(cfg)): PlayerState {
  return actions.reduce((state, action) => reducePlayer(state, action, cfg), from);
}

describe('inicio', () => {
  it('empieza por el primer paso, con la voz leyendo la oración nueva', () => {
    const cfg = config();
    expect(initialPlayerState(cfg)).toMatchObject({ index: 0, phase: 'voice', paused: false });
  });

  it('sin voz en el dispositivo empieza directo en el turno de quien reza', () => {
    expect(initialPlayerState(config({ voiceAvailable: false })).phase).toBe('turn');
  });

  it('sin pasos queda terminada', () => {
    expect(initialPlayerState(config({ steps: [] })).phase).toBe('done');
  });
});

describe('avance', () => {
  it('cuando la voz termina le toca a quien reza', () => {
    const cfg = config();
    expect(run(cfg, [{ type: 'voiceEnded' }]).phase).toBe('turn');
  });

  it('solo la primera repetición de cada oración tiene voz', () => {
    const cfg = config();
    const second = run(cfg, [{ type: 'next' }]);
    const third = run(cfg, [{ type: 'next' }], second);
    const fourth = run(cfg, [{ type: 'next' }], third); // primera repetición de la oración 2
    expect([second.phase, third.phase, fourth.phase]).toEqual(['turn', 'turn', 'voice']);
  });

  it('con la voz en cada repetición todas tienen voz', () => {
    const cfg = config({ voiceEveryRepetition: true });
    expect(run(cfg, [{ type: 'next' }]).phase).toBe('voice');
    expect(run(cfg, [{ type: 'next' }, { type: 'next' }]).phase).toBe('voice');
  });

  it('los pasos de unión y el recitado final no tienen voz', () => {
    const cfg = config({ voiceEveryRepetition: true });
    const joinIndex = cfg.steps.findIndex((step) => step.kind === 'link');
    const finalIndex = cfg.steps.findIndex((step) => step.kind === 'final');
    const toIndex = (target: number) => run(cfg, Array.from({ length: target }, () => ({ type: 'next' as const })));
    expect(toIndex(joinIndex).phase).toBe('turn');
    expect(toIndex(finalIndex).phase).toBe('turn');
  });

  it('recorrer todos los pasos termina en la reflexión y ahí ya no avanza', () => {
    const cfg = config();
    const last = cfg.steps.length - 1;
    const end = run(cfg, Array.from({ length: last }, () => ({ type: 'next' as const })));
    expect(end).toMatchObject({ index: last, phase: 'done' });
    expect(run(cfg, [{ type: 'next' }], end)).toBe(end);
  });
});

describe('retroceso y repetición', () => {
  it('atrás vuelve un paso y no pasa del primero', () => {
    const cfg = config();
    const second = run(cfg, [{ type: 'next' }]);
    expect(run(cfg, [{ type: 'previous' }], second).index).toBe(0);
    expect(run(cfg, [{ type: 'previous' }]).index).toBe(0);
  });

  it('desde el final, atrás vuelve al último paso real', () => {
    const cfg = config();
    const last = cfg.steps.length - 1;
    const end = run(cfg, Array.from({ length: last }, () => ({ type: 'next' as const })));
    const back = run(cfg, [{ type: 'previous' }], end);
    expect(back.index).toBe(last - 1);
    expect(back.phase).not.toBe('done');
  });

  it('escuchar de nuevo vuelve a la voz y reinicia la fase', () => {
    const cfg = config();
    const turn = run(cfg, [{ type: 'next' }]); // paso 2: sin voz
    expect(turn.phase).toBe('turn');
    const replay = run(cfg, [{ type: 'replay' }], turn);
    expect(replay.phase).toBe('voice');
    expect(replay.nonce).toBeGreaterThan(turn.nonce);
  });

  it('escuchar de nuevo no hace nada sin voz o al terminar', () => {
    const cfg = config({ voiceAvailable: false });
    const start = initialPlayerState(cfg);
    expect(run(cfg, [{ type: 'replay' }], start)).toBe(start);
  });
});

describe('pausa', () => {
  it('pausar y seguir conservan el lugar y reinician la fase', () => {
    const cfg = config();
    const paused = run(cfg, [{ type: 'pause' }]);
    expect(paused).toMatchObject({ paused: true, index: 0, phase: 'voice' });
    const resumed = run(cfg, [{ type: 'resume' }], paused);
    expect(resumed.paused).toBe(false);
    expect(resumed.nonce).toBeGreaterThan(paused.nonce);
  });

  it('pausar dos veces o seguir sin pausa no cambia nada', () => {
    const cfg = config();
    const paused = run(cfg, [{ type: 'pause' }]);
    expect(run(cfg, [{ type: 'pause' }], paused)).toBe(paused);
    const start = initialPlayerState(cfg);
    expect(run(cfg, [{ type: 'resume' }], start)).toBe(start);
  });

  it('se puede avanzar con la sesión en pausa y sigue en pausa', () => {
    const cfg = config();
    const next = run(cfg, [{ type: 'pause' }, { type: 'next' }]);
    expect(next).toMatchObject({ paused: true, index: 1 });
  });
});

describe('progreso', () => {
  it('va de 0 a 1', () => {
    const cfg = config();
    const last = cfg.steps.length - 1;
    expect(progressOf(initialPlayerState(cfg), cfg)).toBe(0);
    const end = run(cfg, Array.from({ length: last }, () => ({ type: 'next' as const })));
    expect(progressOf(end, cfg)).toBe(1);
    expect(progressOf(initialPlayerState(config({ steps: [] })), config({ steps: [] }))).toBe(1);
  });
});
