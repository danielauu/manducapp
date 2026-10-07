import { describe, expect, it } from 'vitest';
import { addMeditation, listMeditations, newMeditationId } from './journal';
import { memoryStorage } from './storage';

const INPUT = { date: '2026-10-11', reference: 'Pr 1,1-3', lang: 'es' as const, text: '  Una meditación de prueba.  ' };

describe('diario de meditaciones', () => {
  it('guarda una meditación con su id y su fecha, sin espacios sobrantes', () => {
    const storage = memoryStorage();
    const saved = addMeditation(storage, INPUT, 1000, 'a');
    expect(saved).toEqual({ ...INPUT, text: 'Una meditación de prueba.', id: 'a', createdAt: 1000 });
    expect(listMeditations(storage)).toEqual([saved]);
  });

  it('las lista de la más reciente a la más antigua', () => {
    const storage = memoryStorage();
    addMeditation(storage, { ...INPUT, text: 'primera' }, 1000, 'a');
    addMeditation(storage, { ...INPUT, text: 'segunda' }, 3000, 'b');
    addMeditation(storage, { ...INPUT, text: 'tercera' }, 2000, 'c');
    expect(listMeditations(storage).map((entry) => entry.text)).toEqual(['segunda', 'tercera', 'primera']);
  });

  it('un texto propio se guarda sin fecha', () => {
    const storage = memoryStorage();
    const saved = addMeditation(storage, { reference: 'Mi propio texto', lang: 'en', text: 'x' }, 1, 'a');
    expect(saved.date).toBeUndefined();
    expect(listMeditations(storage)[0]?.reference).toBe('Mi propio texto');
  });

  it('ignora lo corrupto y conserva lo válido al agregar', () => {
    const storage = memoryStorage();
    storage.setItem('manducapp:meditations', 'no es json');
    expect(listMeditations(storage)).toEqual([]);
    storage.setItem('manducapp:meditations', JSON.stringify([{ id: 1 }, 'x', null]));
    expect(listMeditations(storage)).toEqual([]);

    const valid = addMeditation(memoryStorage(), INPUT, 5, 'ok');
    const mixed = memoryStorage();
    mixed.setItem('manducapp:meditations', JSON.stringify([valid, { roto: true }]));
    addMeditation(mixed, INPUT, 6, 'ok2');
    expect(listMeditations(mixed).map((entry) => entry.id)).toEqual(['ok2', 'ok']);
  });

  it('newMeditationId genera ids distintos', () => {
    expect(newMeditationId(1)).not.toBe(newMeditationId(1));
  });
});
