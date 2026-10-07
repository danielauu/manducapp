import { describe, expect, it } from 'vitest';
import { collapseSpaces, decodeEntities, htmlToText, stripTags } from './text';

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
