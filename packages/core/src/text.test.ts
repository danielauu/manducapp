import { describe, expect, it } from 'vitest';
import { collapseSpaces, decodeEntities, htmlToText, splitSentences, stripTags, stripVerseNumbers } from './text';

describe('decodeEntities', () => {
  it('decodifica entidades numéricas, hexadecimales y con nombre', () => {
    expect(decodeEntities('l&#039;été &#x41; &amp; &laquo;x&raquo;')).toBe("l'été A & «x»");
  });

  it('deja intactas las entidades desconocidas o inválidas', () => {
    expect(decodeEntities('&foo; &#99999999;')).toBe('&foo; &#99999999;');
  });
});

describe('stripTags y collapseSpaces', () => {
  it('quita etiquetas y junta espacios, incluido el espacio duro', () => {
    expect(stripTags('Mt <font dir="ltr">22,1-14.</font>')).toBe('Mt 22,1-14.');
    expect(collapseSpaces('  a \u00a0\u00a0 b\n c ')).toBe('a b c');
    expect(htmlToText('<p>Ps&nbsp;22,\u00a01</p>')).toBe('Ps 22, 1');
  });
});

describe('splitSentences', () => {
  it('parte en cada cierre de frase y conserva las comillas de cierre', () => {
    expect(splitSentences('Una frase. Otra frase? ¡Y otra más! Fin…')).toEqual([
      'Una frase.',
      'Otra frase?',
      '¡Y otra más!',
      'Fin…',
    ]);
    expect(splitSentences('Dijo: « Vamos. » Y se fue.')).toEqual(['Dijo: « Vamos. »', 'Y se fue.']);
  });

  it('no parte en puntos sin espacio después (números, referencias)', () => {
    expect(splitSentences('Mt 22,1-14.5 es una referencia.')).toEqual(['Mt 22,1-14.5 es una referencia.']);
  });

  it('una frase sin punto final queda entera, y el vacío no genera nada', () => {
    expect(splitSentences('sin punto final')).toEqual(['sin punto final']);
    expect(splitSentences('   ')).toEqual([]);
  });
});

describe('stripVerseNumbers', () => {
  it('quita los números al inicio de línea, con punto, paréntesis o solo con espacio', () => {
    expect(stripVerseNumbers('26 En aquel tiempo.\n27. Y dijo.\n28) Otra línea.\n29: Fin.')).toBe(
      'En aquel tiempo.\nY dijo.\nOtra línea.\nFin.',
    );
  });

  it('quita superíndices, corchetes y paréntesis con números', () => {
    expect(stripVerseNumbers('²⁶En el sexto mes [27] fue enviado (28) el ángel.')).toBe('En el sexto mes  fue enviado  el ángel.');
  });

  it('quita el número pegado tras un punto cuando empieza otra frase', () => {
    expect(stripVerseNumbers('Hágase en mí.38 Y el ángel se fue.')).toBe('Hágase en mí. Y el ángel se fue.');
    expect(stripVerseNumbers('Dijo así. 12 «Vengan».')).toBe('Dijo así. «Vengan».');
  });

  it('no toca los números que son parte de la frase', () => {
    const text = 'Tenían 5 panes y 2 peces. En el año 15 del reinado, 3 hombres llegaron.';
    expect(stripVerseNumbers(text)).toBe(text);
    expect(stripVerseNumbers('Cuarenta días y 40 noches.')).toBe('Cuarenta días y 40 noches.');
  });

  it('un texto sin números queda igual', () => {
    expect(stripVerseNumbers('Una frase normal.\nOtra frase.')).toBe('Una frase normal.\nOtra frase.');
  });
});
