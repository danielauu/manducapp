# Tipografías

Empaquetadas en el proyecto para que la app funcione sin conexión y sin pedir nada a terceros (ni Google Fonts ni CDNs).

| Familia | Uso | Archivos | Licencia |
|---|---|---|---|
| [Alegreya](https://github.com/huertatipografica/Alegreya) (Huerta Tipográfica) | Texto del evangelio, títulos, botones | 400, 400 cursiva y 500 | SIL OFL 1.1: [OFL-Alegreya.txt](OFL-Alegreya.txt) |
| [Alegreya Sans](https://github.com/huertatipografica/Alegreya-Sans) | Etiquetas en versalitas, avisos y notas | 400 y 700 | SIL OFL 1.1: [OFL-Alegreya-Sans.txt](OFL-Alegreya-Sans.txt) |

Cada alfabeto va en su propio `woff2` (`latin` y `latin-ext`): el navegador solo descarga el que usan los caracteres de la pantalla. El español, el inglés, el francés, el italiano y el alemán se cubren con `latin`; el polaco agrega `latin-ext` (ą ć ę ł ń ś ź ż). Los `@font-face` y sus rangos de Unicode están en `src/styles.css`.

Los archivos vienen de los paquetes `@fontsource/alegreya` y `@fontsource/alegreya-sans` (versión 5.3.0), que redistribuyen las fuentes originales sin modificarlas. Para cambiar un peso o agregar uno, copiar el `woff2` correspondiente a esta carpeta, declarar su `@font-face` y confirmar que el patrón `woff2` de `vite.config.ts` lo incluye en el precaché.
