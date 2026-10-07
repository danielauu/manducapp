import { describe, expect, it } from 'vitest';
import { formatDay } from './format';

describe('formatDay', () => {
  it('escribe el día de la semana y la fecha en el idioma pedido', () => {
    expect(formatDay('2026-10-11', 'es').toLowerCase()).toContain('domingo');
    expect(formatDay('2026-10-11', 'es').toLowerCase()).toContain('octubre');
    expect(formatDay('2026-10-11', 'en')).toContain('Sunday');
    expect(formatDay('2026-10-11', 'en')).toContain('October');
  });

  it('no se corre un día por la zona horaria', () => {
    expect(formatDay('2026-01-01', 'en')).toContain('January 1');
    expect(formatDay('2026-12-31', 'en')).toContain('December 31');
  });
});
