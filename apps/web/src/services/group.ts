import { MAX_PEOPLE } from '@manducapp/core';

export { MAX_PEOPLE };

const MAX_NAME_LENGTH = 30;

/** Opciones del selector: de 1 (solo) a 5 personas. */
export const PEOPLE_OPTIONS: readonly number[] = Array.from({ length: MAX_PEOPLE }, (_, index) => index + 1);

/** Siempre cinco nombres, vacíos o recortados; lo guardado pudo escribirlo otra versión. */
export function normalizeNames(value: unknown): string[] {
  const list = Array.isArray(value) ? value : [];
  return Array.from({ length: MAX_PEOPLE }, (_, index) => {
    const item: unknown = list[index];
    return typeof item === 'string' ? item.trim().slice(0, MAX_NAME_LENGTH) : '';
  });
}

/** El nombre que se muestra: el escrito, o «Persona N» si se dejó en blanco. */
export function displayName(names: readonly string[], index: number, fallback: (number: number) => string): string {
  return names[index]?.trim() || fallback(index + 1);
}
