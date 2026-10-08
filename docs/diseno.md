# Contexto para evaluar el diseño gráfico de Manducapp

> Estado: este documento fue el punto de partida de la revisión. El resultado (diagnóstico, decisiones y mediciones) está en [ADR-0004](decisions/0004-identidad-visual.md).

Este documento es el punto de partida para quien evalúe o rediseñe la parte visual de la app (una persona, o un agente). Dice qué se quiere conservar, qué se percibe como genérico, qué restricciones técnicas hay y qué se espera como resultado.

## Qué es la app

Una herramienta para rezar el evangelio por **manducación**: se toma un trozo del evangelio, se divide en oraciones cortas, cada una se repite y se van uniendo hasta recitar todo de memoria, solo o en grupo (hasta 5 personas con un solo teléfono), y se termina con un momento de silencio y una meditación escrita. Funciona en español, inglés, francés, italiano, alemán y polaco.

El uso es **reposado y devocional**: el teléfono está sobre una mesa o en la mano de quien guía, con la pantalla encendida, y se mira el texto mientras se reza en voz alta. Lo más importante visualmente es **el texto de la oración**: debe poder leerse a un metro de distancia y sin esfuerzo.

La app es la herramienta de un proyecto sin fines de lucro. Puede tener carácter, pero no debe parecer una app de consumo ni de productividad.

## Lo que se quiere conservar

- **El azul.** Es la decisión de identidad: `#1f3a5f` en modo claro y `#6d9eda` en modo oscuro como color de acento. Se puede ajustar el resto de la paleta (fondos, neutros, estados) si hace falta, pero el azul se queda.
- El modo claro y el oscuro automático (según el sistema).
- La estructura de pantallas y el comportamiento: este trabajo es **visual**, no cambia cómo funciona la app.

## Lo que se percibe como genérico (el motivo de esta revisión)

El usuario que la probó dijo que, aunque le gusta el azul, **la tipografía de los encabezados, botones, tarjetas, etc. está muy encasillada en el estilo que producen las herramientas de IA**. Lo que hoy hay, para tener presente:

- **Tipografía**: solo la del sistema (`system-ui`, `-apple-system`, `Segoe UI`, `Roboto`), con una jerarquía de tamaños muy previsible (títulos de 1,7 rem en negrita, subtítulos de 1,1 a 1,15 rem).
- **Tarjetas y botones**: cajas con borde de 1 px y esquinas redondeadas parejas (10 a 14 px), fondo plano, sin textura ni ritmo; todos los botones primarios iguales, en bloque azul.
- **Pantalla de inicio**: tres tarjetas anchas apiladas con título y subtítulo. Es la composición más típica de todas.
- **El texto de la oración** (la pieza central) está en una tarjeta con un filete azul a la izquierda: correcto, pero sin carácter propio.

La pregunta de fondo: **¿qué haría que se sintiera hecha a mano para esto y no generada?** Por ejemplo, una tipografía con personalidad para los encabezados y para el texto del evangelio (una serifa de lectura, algo de caligrafía litúrgica, versales con espaciado), otra forma de jerarquizar que no sea «tarjeta con borde», más aire, otro ritmo.

## Restricciones técnicas

- **Sin conexión y sin rastreo.** La app es una PWA que funciona sin conexión y no hace llamadas a terceros más que para pedir el evangelio. Por eso, **nada de Google Fonts ni CDNs**: las tipografías, si se agregan, deben ir **empaquetadas en el proyecto** (formato `woff2`, solo los pesos y subconjuntos necesarios) y con licencia abierta (por ejemplo, SIL OFL). Hay que tener en cuenta su peso: hoy todo el JavaScript pesa unos 100 KB comprimidos.
- **Seis idiomas, escritura latina**: la tipografía debe cubrir bien los diacríticos del polaco (ą ć ę ł ń ó ś ź ż), del alemán (ä ö ü ß), del francés y del italiano, y comillas tipográficas (« » „ " ’). Los textos alemanes son los más largos: ningún botón ni título puede romperse.
- **Accesibilidad como piso**, no como meta: hoy la app tiene **Lighthouse móvil 100 en accesibilidad** y **cero violaciones de axe-core** en cada pantalla, en modo claro y oscuro. Cualquier cambio debe mantenerlo: contraste suficiente, foco visible, objetivos táctiles de al menos 44 px, y el tamaño del texto del reproductor ya es configurable (normal, grande y muy grande).
- **Rendimiento**: Lighthouse móvil 98 en rendimiento y sin desplazamientos de diseño; los avisos (versión nueva, instalar) flotan abajo para no empujar el contenido.
- **Móvil primero**: se usa en teléfonos de 360 a 412 px de ancho. En escritorio se centra en una columna de 760 px.
- Los estilos viven en un solo archivo, `apps/web/src/styles.css`, con variables CSS. No hay librería de componentes ni de estilos, y conviene no agregar una.

## Dónde mirar

Pantallas, en `apps/web/src/screens/`: inicio, ajustes, texto propio, vista previa, **sesión** (el corazón de la app), reflexión, diario. Los componentes comunes están en `apps/web/src/components/`. Se puede ver todo corriendo la app (`npm run dev -w @manducapp/web`, en http://localhost:5173) o en https://danielauu.github.io/manducapp/.

Para evaluar en serio hay que mirar, a ancho de teléfono (375 px) y en claro y oscuro: el inicio, la vista previa con el panel de ajustes, la sesión en cada fase (escuchando, turno, recitado final con el texto oculto), el modo grupo (con el indicador de turno), la reflexión y el diario.

## Qué se espera como resultado

1. **Un diagnóstico concreto**: qué cosas hacen que hoy se vea genérica (con capturas) y qué cosas están bien y conviene dejar.
2. **Una propuesta con criterio**: tipografías (con nombre, licencia y peso), escala de tamaños, uso del azul y de los neutros, forma de tarjetas, botones y encabezados, y el tratamiento del texto de la oración. Justificada para un uso devocional y de lectura, no por moda.
3. **Los cambios aplicados**, en `styles.css` y en lo mínimo del marcado, en un PR pequeño y revisable, sin cambiar el comportamiento.
4. **La comprobación de que no se rompió nada**: `npm run lint`, `npm run typecheck`, `npm test` y `npm run build`; la auditoría de accesibilidad (axe-core) sin violaciones; y Lighthouse móvil sin bajar de 95 en rendimiento ni de 100 en accesibilidad.
5. **Las tipografías, si las hay, empaquetadas** y con su licencia anotada en el repositorio.

## Fuera de alcance

Logo e identidad de marca completa, ilustraciones, animaciones elaboradas, y cualquier cambio de funcionalidad. El ícono de la app (una cruz blanca sobre azul) es provisorio y sí se puede mejorar, pero es un entregable aparte.
