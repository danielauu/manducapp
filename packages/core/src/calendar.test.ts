import { describe, expect, it } from 'vitest';
import {
  addDays,
  compactDate,
  dayOfWeek,
  daysBetween,
  isWithinFeedWindow,
  nextSunday,
  todayIso,
} from './calendar';

describe('todayIso', () => {
  it('usa la fecha local y no la de UTC', () => {
    expect(todayIso(new Date(2026, 9, 6, 23, 59))).toBe('2026-10-06');
    expect(todayIso(new Date(2026, 0, 1, 0, 0))).toBe('2026-01-01');
  });
});

describe('nextSunday', () => {
  it('devuelve el domingo siguiente desde un día de semana', () => {
    expect(nextSunday('2026-10-07')).toBe('2026-10-11');
  });

  it('devuelve el mismo día si ya es domingo', () => {
    expect(nextSunday('2026-10-11')).toBe('2026-10-11');
  });

  it('desde el sábado devuelve el día siguiente', () => {
    expect(nextSunday('2026-10-10')).toBe('2026-10-11');
  });

  it('desde el lunes devuelve seis días después', () => {
    expect(nextSunday('2026-10-12')).toBe('2026-10-18');
  });

  it('cruza fin de mes y de año', () => {
    expect(nextSunday('2026-12-30')).toBe('2027-01-03');
    expect(nextSunday('2026-10-27')).toBe('2026-11-01');
  });

  it('siempre cae a 6 días o menos, dentro de la ventana del feed', () => {
    for (let offset = 0; offset < 366; offset++) {
      const from = addDays('2026-01-01', offset);
      const sunday = nextSunday(from);
      expect(dayOfWeek(sunday)).toBe(0);
      expect(daysBetween(from, sunday)).toBeLessThanOrEqual(6);
      expect(isWithinFeedWindow(sunday, from)).toBe(true);
    }
  });
});

describe('addDays y daysBetween', () => {
  it('suma y resta días respetando el año bisiesto', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('cuenta días entre fechas', () => {
    expect(daysBetween('2026-10-06', '2026-11-05')).toBe(30);
    expect(daysBetween('2026-10-06', '2026-10-06')).toBe(0);
    expect(daysBetween('2026-10-06', '2026-10-01')).toBe(-5);
  });
});

describe('isWithinFeedWindow', () => {
  it('acepta de hoy hasta 30 días y rechaza el pasado y lo posterior', () => {
    expect(isWithinFeedWindow('2026-10-06', '2026-10-06')).toBe(true);
    expect(isWithinFeedWindow('2026-11-05', '2026-10-06')).toBe(true);
    expect(isWithinFeedWindow('2026-11-06', '2026-10-06')).toBe(false);
    expect(isWithinFeedWindow('2026-10-05', '2026-10-06')).toBe(false);
  });
});

describe('validación de fechas', () => {
  it('rechaza formatos inválidos y fechas inexistentes', () => {
    expect(() => nextSunday('11/10/2026')).toThrow(RangeError);
    expect(() => nextSunday('2026-02-30')).toThrow(RangeError);
    expect(() => compactDate('2026-13-01')).toThrow(RangeError);
  });

  it('compactDate quita los guiones', () => {
    expect(compactDate('2026-10-11')).toBe('20261011');
  });
});
