const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
  laquo: '«',
  raquo: '»',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
};

export function decodeEntities(input: string): string {
  return input.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity.startsWith('#')) {
      const isHex = entity[1] === 'x' || entity[1] === 'X';
      const codePoint = isHex ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return codePoint > 0 && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : match;
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

export function stripTags(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

/** Junta cualquier secuencia de espacios (incluido el espacio duro) en un solo espacio. */
export function collapseSpaces(input: string): string {
  return input.replace(/[\s\u00a0]+/g, ' ').trim();
}

/** Un token cuenta como palabra si tiene al menos una letra o un número (no `:`, `«`, `–`). */
export function isWord(token: string): boolean {
  return /[\p{L}\p{N}]/u.test(token);
}

export function wordCount(text: string): number {
  return text.split(/\s+/).filter(isWord).length;
}

/**
 * Parte un texto en frases: cierra en `. ! ? …` con comillas opcionales y exige un espacio o el fin
 * del texto después. No usa lookbehind: Safari anterior a 16.4 no compila el script entero si lo ve.
 */
export function splitSentences(text: string): string[] {
  const pieces = text.match(/.+?(?:[.!?…]+(?:\s?[»”’'"])*(?=\s|$)|$)/g) ?? [];
  return pieces.map(collapseSpaces).filter((piece) => piece.length > 0);
}

const SUPERSCRIPT_DIGITS = /[\u2070\u00b9\u00b2\u00b3\u2074-\u2079]+/g;

/**
 * Quita los números de versículo que suelen venir al copiar un pasaje de una página: cifras en
 * superíndice, `[26]` o `(26)`, un número al inicio de línea y un número pegado tras un punto
 * (`...del Señor.28 El ángel`). Es prudente: no toca números dentro de una frase (`5 panes`).
 */
export function stripVerseNumbers(text: string): string {
  return text
    .replace(SUPERSCRIPT_DIGITS, '')
    .replace(/\[\d{1,3}\]|\(\d{1,3}\)/g, '')
    .replace(/^[ \t]*\d{1,3}(?:[ \t]*[.)\]:][ \t]*|[ \t]+)(?=\S)/gm, '')
    .replace(/([.;:!?»”’"'])[ \t]?\d{1,3}[ \t]?(?=[A-ZÁÉÍÓÚÜÑÀÈÌÒÙÂÊÎÔÛÄÖŁŚŻŹĆŃ¿¡«“‘"])/g, '$1 ');
}

export function htmlToText(input: string): string {
  return collapseSpaces(decodeEntities(stripTags(input)));
}
