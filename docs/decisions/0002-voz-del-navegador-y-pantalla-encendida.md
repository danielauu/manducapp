# ADR-0002: Voz del navegador y sesión con la pantalla encendida

- Estado: aceptada, con una prueba pendiente (iPhone)
- Fecha: 2026-10-07

## Contexto

La v1 se publica como PWA y la voz es la del propio dispositivo (ADR-0001). El riesgo era que la síntesis de voz del navegador no sirviera para encadenar repeticiones. La página de prueba técnica de la Fase 0 (`apps/web/src/spike`) lo midió en un Android real.

## Evidencia (Android, Chrome 154, navegador normal, 2026-10-07)

- **Voces en los 6 idiomas, todas locales** (funcionan sin conexión): es 2, en 5, fr 2, it 1, de 1, pl 1. Android las reporta como `es_ES` (con guion bajo).
- **El evento de fin de frase llegó siempre**: frases de 3 a 4 s, una frase de 23 s sin cortarse, y una secuencia de 3 repeticiones completa (3/3).
- **No hay eventos de palabra** (0 límites de palabra).
- **Velocidad de la voz**: entre 2,6 y 3,0 palabras por segundo, frente a los 2,5 del modelo de tiempos, que queda como está (es algo conservador).
- **A oído, las voces de los 6 idiomas se entienden bien** (valoración del usuario).
- **Feed**: Evangelizo responde en los 6 idiomas desde el navegador del teléfono (CORS), en unos 500 ms por consulta.

## Decisión

1. La v1 usa la **Web Speech API** del navegador, detrás de la interfaz `TtsPort`. Capacitor con TTS nativo queda como plan B.
2. **La sesión asume que la pantalla permanece encendida.** Una manducación es un uso activo: se mira el texto y se repite en voz alta. No se soporta la lectura con la pantalla bloqueada, y por eso no se hizo la prueba del maratón con bloqueo.
3. Al iniciar una sesión se pide el **Wake Lock** (`navigator.wakeLock`). Si no está disponible, se avisa al usuario de que mantenga la pantalla encendida.
4. Si la página pasa a segundo plano durante una sesión, **la sesión se pausa** y se avisa al volver, en vez de seguir hablando o perder el lugar.
5. **No se resalta palabra por palabra**: el reproductor resalta por oración, que es la unidad de la manducación.
6. Se mantiene el modelo de tiempos (2,5 palabras por segundo). La velocidad real de quien repite se calibrará en el piloto de la Fase 5.

## Sin probar todavía

- **iPhone** (Safari y PWA instalada): voces, eventos de fin y Wake Lock. Es la única prueba pendiente de la Fase 0. Si falla, se adelanta el envoltorio Capacitor con TTS nativo.
- Android con la PWA instalada desde el ícono.
- Calidad de las voces en distintos dispositivos: Android las trae por idioma y el usuario puede tener menos que las probadas.

## Consecuencias

- El reproductor de la Fase 2 debe manejar el cambio de visibilidad de la página y la ausencia de Wake Lock.
- El botón del maratón de la página de prueba deja de ser necesario y se puede quitar cuando se reemplace por la app real.
