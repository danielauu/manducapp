# ADR-0004: Identidad visual de la app

- Estado: aceptada
- Fecha: 2026-10-07
- Contexto de entrada: [docs/diseno.md](../diseno.md)

## Contexto

Tras probar la app, el usuario dijo que el azul le gusta pero que la tipografía de encabezados, botones y tarjetas «está muy encasillada en el estilo generado por IA». El diagnóstico concreto de la v1:

- **Solo `system-ui`**, con una jerarquía previsible (títulos en negrita de 1,7 rem).
- **Todo era una caja con borde de 1 px y esquinas de 10 a 14 px**: tarjetas, entradas del diario, panel de ajustes, el texto de la oración.
- **Inicio con tres tarjetas anchas iguales** apiladas, y botones primarios todos iguales.
- **El texto de la oración**, la pieza central, en una tarjeta con un filete azul: correcto pero sin carácter.
- Una cosa que sí estaba bien: la estructura, el tamaño del texto del reproductor y el contraste. Se conserva.

## Decisión

La idea es un **libro de oración impreso**: papel cálido, tinta azul y un ocre de manuscrito, con la jerarquía hecha por la tipografía y por líneas finas, no por cajas.

- **Tipografías** (empaquetadas, licencia SIL OFL 1.1, ver [`apps/web/src/fonts/`](../../apps/web/src/fonts/README.md)):
  - **Alegreya** (400, 400 cursiva, 500) para el texto del evangelio, los títulos, los botones y las notas. Es una serifa caligráfica pensada para leer texto largo, con diacríticos completos para los seis idiomas.
  - **Alegreya Sans** (400, 700) para las etiquetas en versalitas espaciadas (a la manera de las rúbricas de un misal), los avisos y el texto corrido corto. Es de la misma familia: comparten ritmo y trazo.
- **Color**: el azul (`#1f3a5f` y `#6d9eda`) sigue siendo el único color de acción. Se agrega un **ocre** (`--gold`, `#7a5c18` en claro y `#cfaa5e` en oscuro) solo para adornos y números, nunca como único portador de significado. El papel pasa de `#f7f5f0` a `#f5efe2` y el modo oscuro, a un azul negro más profundo.
- **Formas**: esquinas casi rectas (2 px), sin tarjetas. Los grupos se separan con **filetes de 1 px** y los bloques de ajustes con una **doble línea** de imprenta.
- **Inicio**: la lectura de hoy es una tarjeta azul con marco interior fino (la única «caja»); el resto son renglones de índice con flecha.
- **El texto de la oración** va sobre el papel, sin caja, entre dos líneas finas, con un **rombo ocre** que corta la superior. Mide 1,9 rem (2,3 y 2,8 en los otros tamaños) y se parte con guiones según el idioma.
- **Repeticiones** como puntos (con el texto «Repetición 1 de 3» al lado, que se conserva) y **turno** como una línea en cursiva.

## Piso técnico (medido)

- axe-core sin violaciones en 15 pantallas y estados, en claro y oscuro (se encontró y corrigió una: el texto fuera del tiempo elegido en la vista previa usaba opacidad y perdía contraste; ahora usa el color tenue y cursiva).
- Lighthouse móvil: rendimiento 95 a 97, accesibilidad 100, buenas prácticas 100, SEO 100; CLS 0.
- Peso: cada pantalla baja unos 115 KB de tipografías en español, inglés, francés, italiano y alemán (el polaco suma hasta unos 100 KB más de `latin-ext`). Las cinco de la primera pantalla se piden con `preload` junto con el código. El precaché sin conexión pasa de unos 340 a unos 560 KB.

## Alternativas descartadas

- **Google Fonts o CDN**: rompe «sin conexión y sin rastreo».
- **Fuentes variables** (Alegreya `wght`, 43 KB por alfabeto): un archivo en vez de tres, pero casi el doble de peso por el mismo uso.
- **Serifa del sistema** (Georgia, Iowan Old Style): no pesa nada, pero se ve distinta en cada dispositivo y no cubre bien el polaco en todos.
- **Texturas, ilustraciones y adornos grandes**: fuera de alcance y contra el rendimiento.

## Consecuencias

- Los avisos de la app (versión nueva, instalar) muestran uno solo a la vez: apilar uno nuevo bajo uno ya visible lo empujaba hacia arriba y contaba como desplazamiento de diseño (CLS 0,07).
- Agregar o cambiar un peso exige copiar el `woff2`, declarar su `@font-face` y confirmar que el precaché lo incluye.
- El ícono de la app (cruz blanca sobre azul) sigue siendo provisorio; es un entregable aparte.
