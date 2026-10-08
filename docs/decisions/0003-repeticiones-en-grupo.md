# ADR-0003: Repeticiones por oración en grupo

- Estado: aceptada
- Fecha: 2026-10-07
- Reemplaza: el punto 6 de [ADR-0001](0001-arquitectura-y-alcance-v1.md) (repeticiones 3×n)

## Contexto

La v1 hacía que, en grupo de n personas, cada oración se repitiera `3 × n` veces: tres vueltas al círculo. Tras probar la app, el usuario observó que eso es demasiado: con 5 personas son 15 repeticiones de cada oración, y un evangelio dominical no cabe en una sesión razonable (con el ritmo normal, 3 personas necesitaban cerca de una hora).

## Decisión

En grupo, **una pasada por cada persona**: cada oración nueva se repite `máx(3, personas)` veces.

| Personas | Repeticiones por oración |
|---|---|
| 1 | 3 |
| 2 | 3 (igual que solo; se pasa entre las dos) |
| 3 | 3 (una cada una) |
| 4 | 4 |
| 5 | 5 |

- Quien arranca cada oración sigue rotando, para repartir el turno de arranque.
- **Las uniones y los bloques se dicen una sola vez**, igual que solo, y quien los dice va rotando. Así, de a dos o de a tres el tiempo es el mismo que solo, y solo crece desde 4 personas, por las repeticiones extra de cada oración. (Una primera versión mantenía una recitación de cada unión por persona; con 2 personas la sesión pasaba de 22 a 33 minutos, y eso contradecía la idea de que de a dos sea lo mismo que solo.)
- El recitado final lo dice el grupo junto.
- El mínimo de 3 repeticiones se puede cambiar con la opción `minRepetitions` de `buildSession`, aunque la interfaz no lo expone.

## Consecuencias

- El tiempo de una sesión en grupo crece mucho menos: con 1, 2 o 3 personas es el mismo, y solo con 4 o 5 sube (algo más con 5).
- El hallazgo del PR de tiempos («en grupo no cabe en 30 minutos») queda superado; el ritmo se calibrará igual en el piloto.
- Cambian el texto del aviso de la vista previa (en los 6 idiomas), `docs/plan-v1.md` y el README.
