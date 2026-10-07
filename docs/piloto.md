# Guía del piloto con un grupo real de oración

Esta guía sirve para probar Manducapp con un grupo de verdad antes de publicarla más ampliamente. Lo más valioso que se puede sacar es **calibrar el ritmo**: hoy el tiempo de cada repetición es una estimación, y con un grupo real se puede ajustar.

La app está en https://danielauu.github.io/manducapp/ (en el teléfono se puede instalar en la pantalla de inicio).

## Qué se quiere aprender

1. **El ritmo real.** ¿Cuánto tarda de verdad el grupo en repetir cada oración? ¿El contador le da tiempo de sobra, justo o se queda corto?
2. **Si el tiempo alcanza.** Con el evangelio de un domingo, ¿cuántas oraciones logra memorizar el grupo en el tiempo que tiene?
3. **Las voces.** ¿Se entienden en cada idioma? ¿Cuál conviene elegir?
4. **Los turnos.** ¿«Turno de Ana · Sigue: Luis» alcanza para pasarse el teléfono sin confundirse?
5. **Lo que confunde o estorba**, aunque parezca un detalle.

## Antes de empezar

- Un solo dispositivo para todo el grupo (Android con Chrome, de preferencia). Cargado y con el volumen alto.
- Abrir la app e instalarla en la pantalla de inicio. Abrirla una vez con conexión para que quede guardada.
- En **Ajustes**: elegir el idioma de la aplicación y el del evangelio, y probar la voz con «Probar la voz». Si hay varias voces, elegir la que mejor se entienda.
- Un lugar tranquilo, y que la pantalla se vea desde donde se sientan todos.
- Una persona del grupo anota (puede ser quien sostiene el teléfono) usando la hoja de registro de abajo. Un reloj o cronómetro ayuda.

## Guion de la sesión

1. En el inicio, elegir **Evangelio del próximo domingo**.
2. En la vista previa, elegir cuántas **personas** hay y escribir los nombres. Dejar el **ritmo en Normal** y el tiempo disponible que realmente tengan (por ejemplo, 30 minutos). **Anotar** cuántas oraciones propone la app y la duración estimada.
3. Tocar **Comenzar** y rezar con normalidad: la voz lee la oración nueva, y cada persona la repite cuando le toca.
4. Mientras se hace, observar el **contador**. Anotar, para una oración cualquiera, si el grupo terminó de repetirla **antes** de que el contador acabara, **justo**, o **después**.
5. Si el contador va demasiado lento o demasiado rápido, cambiar el **ritmo** en los ajustes de la sesión y seguir. Anotar a qué ritmo se sintió cómodo.
6. Hacer el **recitado final** y el momento de silencio, y probar escribir una meditación.
7. Al terminar, anotar el **tiempo real total** (con un reloj) y hasta qué oración se llegó.

## Qué anotar

### Hoja de registro

| Dato | Anotación |
|---|---|
| Fecha y evangelio | |
| Personas en el grupo | |
| Dispositivo y navegador | |
| Idioma de la app / del evangelio | |
| Voz elegida | |
| Tiempo disponible elegido | |
| Oraciones que propuso la app / duración estimada | |
| Ritmo con el que empezó | |
| ¿El contador daba tiempo? (de sobra / justo / se quedaba corto) | |
| Ritmo con el que se sintió cómodo | |
| Oraciones que realmente se memorizaron | |
| Tiempo real total de la sesión | |
| ¿Se apagó la pantalla o se interrumpió algo? | |
| Lo que confundió o estorbó | |
| Lo que gustó | |

### Preguntas para después (5 minutos)

- ¿Se entendió qué hacer en cada paso sin que nadie lo explicara?
- ¿Los turnos estuvieron claros?
- ¿La voz ayudó o estorbó? ¿Preferirían que leyera en cada repetición?
- ¿Sirvió el recitado final con el texto oculto? ¿Mostraron el texto?
- ¿Qué cambiarían primero?

## Cómo se convierte esto en una calibración

El tiempo que se le da a quien reza en cada repetición es:

```
tiempo de repetición = (lo que tarda la voz en leerla) × factor + pausa
```

Los tres ritmos de hoy son una primera aproximación:

| Ritmo | Factor | Pausa |
|---|---|---|
| Más lento | 1,6 | 1,5 s |
| Normal | 1,2 | 1 s |
| Más rápido | 0,8 | 0,3 s |

- Si **la mayoría de los grupos se sienten cómodos en «Más rápido»**, el ritmo normal está siendo demasiado pesimista y hay que acercarlo a esos valores.
- Si **se quedan cortos incluso en «Normal»**, hay que subirlo.
- Anotar también cuántas personas había: el efecto de cada repetición extra pesa más en grupos grandes.

Con varias hojas de registro se ajustan los valores en `apps/web/src/services/pace.ts`, y de paso se decide si hace falta cambiar el tiempo por defecto (30 minutos).

## Si alguien usa lector de pantalla o teclado

La revisión automática de accesibilidad no encontró problemas, pero no reemplaza a una persona. Si alguien del grupo usa **TalkBack** (Android), vale la pena pedirle que recorra: inicio, vista previa, una sesión y la reflexión, y anotar dónde se pierde o qué no se lee bien. Lo mismo con un teclado.

## Privacidad

La app no recoge ninguna información: no hay cuentas ni análisis de uso. Todo (las meditaciones, los ajustes, los evangelios guardados) queda en el teléfono. Por eso los datos del piloto los reporta una persona a mano, con la hoja de registro. Las meditaciones que alguien escriba durante el piloto son suyas; no hace falta compartirlas.

## Cómo reportar

Enviar la hoja de registro (una por sesión) y las respuestas a quien coordina el proyecto, o abrir un issue en https://github.com/danielauu/manducapp/issues con el título «Piloto: …» y la hoja pegada.
