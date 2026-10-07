# ADR-0001: Arquitectura y alcance de la v1

- Estado: aceptada
- Fecha: 2026-10-06

## Contexto

Manducapp es un proyecto sin fines de lucro. El criterio que ordena todas las decisiones es **minimizar el costo de mantención**: dinero, tiempo de revisión de tiendas y piezas que se puedan romper solas.

## Decisiones

1. **Fuente del texto:** feed de Evangelizo (es, en, fr, it, de, pl) con la API de AELF como respaldo para francés, detrás de una interfaz `GospelProvider`. Se usa la traducción litúrgica de cada país. La Biblia de Jerusalén queda fuera de la v1 por copyright de sus editoriales.
2. **Backend:** un Cloudflare Worker sin estado (`apps/api`), sin base de datos ni cuentas. Normaliza las fuentes a un JSON único y usa una caché de borde de pocas horas. Si cae, el cliente llama directo al feed con el mismo parser (`packages/core`).
3. **Audio:** TTS del dispositivo. Sin audio pregrabado ni IA en vivo.
4. **Plataforma:** PWA en GitHub Pages primero. Luego la misma app envuelta con Capacitor para Play Store y App Store.
5. **Almacenamiento:** no se empaqueta ninguna Biblia. Solo caché local de los días consultados.
6. **Grupos:** modo presencial en un solo dispositivo (hasta 5 personas), con repeticiones 3×n. Sin sincronización entre dispositivos.
7. **Meditaciones:** guardado local y exportación. Sin cuentas.
8. **Segmentación y recorte:** algoritmo determinista sin IA, con estimador de tiempo y presupuesto configurable (30 min por defecto).
9. **Repositorio:** monorepo público `danielauu/manducapp` con npm workspaces. Los textos bíblicos nunca se versionan.

## Consecuencias

- Costo total de la v1: $0. Las tiendas suman US$25 una vez (Google) y US$99 al año (Apple, exentos si hay entidad sin fines de lucro con D-U-N-S).
- Dependencia de un feed externo sin licencia explícita. Se mitiga con el Worker, el respaldo AELF, la caché y la opción de pegar texto propio. Pendiente: confirmar por escrito con Evangelizo el uso en una app sin fines de lucro, incluyendo el relé por el Worker.
- La versión en español es la del feed (*Libro del Pueblo de Dios*). Pendiente confirmar que sirve a los usuarios objetivo.

El detalle, los hallazgos verificados y las fases están en [docs/plan-v1.md](../plan-v1.md).
