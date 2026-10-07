# Manducapp: decisiones de diseño y plan de desarrollo v1

## Contexto

Manducapp es una app sin fines de lucro para rezar el evangelio por "manducación": trozo del evangelio, división en oraciones, repetición 3×n, uniones acumulativas, recitado final y meditación escrita. Funciona en iPhone y Android, en 6 idiomas (es, en, fr, it, de, pl).

**Principio rector: costo de mantención mínimo.** Eso implica backend sin base de datos ni cuentas de usuario, sin APIs de pago, pocas dependencias y publicar primero donde no haya cuotas ni revisiones anuales.

**Frontend y backend viven en un solo repositorio de GitHub bajo la cuenta `danielauu`** (monorepo), con CI, despliegue y planificación (issues e hitos) dentro de GitHub.

El directorio `D:\Repositorios\Manducapp` está vacío y no es un repositorio git, así que se parte de cero. Respuestas ya dadas: traducción litúrgica vía feed, PWA primero con tiendas después, y experiencia web (JS/TS).

## Hallazgos verificados (probados con `curl` el 2026-10-06)

- **Evangelizo** (`https://feed.evangelizo.org/v2/reader.php`) cubre los 6 idiomas con un solo endpoint:
  - Parámetros: `date=YYYYMMDD` (máximo 30 días hacia adelante), `lang=AM|SP|FR|IT|DE|PL`, `type=reading|reading_lt|reading_st|liturgic_t|audio|xml`, `content=GSP`.
  - Devuelve `access-control-allow-origin: *`. Tiene límite de tasa (100 por segundo) y no exige API key.
  - El texto llega en líneas separadas por `<br />`, **sin números de versículo**.
  - Para el domingo 2026-10-11 (Mt 22,1-14) las 6 lenguas devuelven 14 líneas alineadas. El promedio es de 14 a 20 palabras por línea, el máximo es de 25 a 37, y el total ronda las 200 a 280 palabras.
  - Cada respuesta termina con su línea de crédito: EN USCCB (NABRE), ES *Libro del Pueblo de Dios* (versión argentina), FR AELF, IT CEI, DE Lektionar (staeko.net), PL Biblia Tysiąclecia (Pallottinum).
  - La documentación **no dice nada de licencia ni de atribución**.
- **AELF** (`https://api.aelf.org/v1/messes/YYYY-MM-DD/france`) entrega JSON con año y tiempo litúrgico y las lecturas. Incluye la forma larga y la corta del evangelio (`Mt 22,1-14` y `Mt 22,1-10`), con CORS abierto. Sirve de respaldo oficial para francés.
- **Biblia de Jerusalén**: ningún feed gratuito la ofrece y tiene copyright de Desclée de Brouwer (es) y Cerf (fr). Raspar sitios que la publiquen implica republicar texto protegido. Queda como mejora futura si se consigue permiso de las editoriales.
- **Apple**: la exención de la cuota (US$99/año) exige una entidad legal sin fines de lucro con número D-U-N-S, y no vender bienes digitales en la app. Una persona natural no califica. **Google Play**: US$25, pago único.
- **Entorno local**: `git` está instalado con identidad `danielauu <doacuna@uc.cl>`. **`gh` (GitHub CLI) no está instalado.** Node no está activo: `nvm` solo tiene v18.18.1, que ya no tiene soporte, y hace falta Node 22 LTS.

## Decisiones de diseño

| Tema | Decisión | Por qué |
|---|---|---|
| **Fuente de texto** | Feed de Evangelizo con AELF como adaptador de respaldo para francés, ambos detrás de una interfaz `GospelProvider` | Sin scraping frágil de HTML y un solo formato para los 6 idiomas. |
| **Backend** | **Cloudflare Worker sin estado** en el mismo repo (`apps/api`): normaliza las fuentes a un JSON único, con caché de borde corta. Sin base de datos, sin KV, sin cuentas | (1) Si el feed cambia, se corrige el Worker sin pasar por la revisión de las tiendas. (2) Una sola forma de datos para toda la app. (3) La caché de borde evita que cada usuario golpee a Evangelizo. (4) Plan gratuito de 100.000 solicitudes por día. Si el Worker cae, la app llama directo al feed con el mismo parser. |
| **Traducción** | La litúrgica de cada país vía feed | Es el texto que se escucha en misa, es legalmente más limpio y cubre los 6 idiomas. Biblia de Jerusalén queda en el backlog. |
| **Almacenamiento** | No se empaqueta ninguna Biblia. En el dispositivo solo se guarda en caché cada día consultado (unos KB) y se precarga hoy, el próximo domingo y 7 días | App liviana y funciona sin conexión para lo ya consultado. |
| **Audio** | TTS del propio dispositivo (Web Speech API en la PWA, plugin nativo después). Sin audio pregrabado ni IA en vivo | Costo cero y sin pipeline. Permite repetir una oración suelta y controlar pausas. El audio pregrabado exigiría generar, almacenar y servir un derivado de texto con copyright en 6 idiomas todos los días. La IA en vivo cuesta por uso. |
| **Plataforma** | **PWA primero** en GitHub Pages. Después, la misma app envuelta con Capacitor para Play Store y App Store | Costo $0 y sin revisión de tiendas para la v1. El mismo código sirve para todo. |
| **Stack** | TypeScript, React, Vite, `vite-plugin-pwa`, Zustand, IndexedDB (`idb-keyval`), i18next, Vitest, Playwright. Backend: Hono sobre Cloudflare Workers | Tecnología web estándar y con poco cambio, afín a la experiencia del usuario. |
| **Grupos (hasta 5)** | Modo presencial en **un solo dispositivo**: la app rota el turno y escala las repeticiones a 3×n. Sin sincronización | Es lo que describe la práctica (se pasa la oración de persona en persona). Un modo remoto en tiempo real exigiría estado de servidor y queda fuera. |
| **Meditaciones** | Guardado local (IndexedDB) y **exportar** como texto/JSON. Sin cuentas | Sin cuentas no hay datos personales en el servidor ni RGPD que gestionar. Exportar protege contra pérdida de datos si el navegador borra el almacenamiento. |
| **División en oraciones** | Algoritmo determinista en `packages/core`, sin IA | Gratis, predecible y testeable. Un paso opcional con LLM en tiempo de build queda para después si la calidad no alcanza. |
| **Recorte de texto largo** | Estimador de tiempo con presupuesto (30 min por defecto, configurable) y selección de rango con sugerencia de corte | Cubre el punto 2 del alcance. Si la fuente trae forma corta (AELF), se usa. |
| **Texto propio** | Pantalla para pegar cualquier pasaje y manducarlo | Barato, y desacopla la app del feed si este cae. |
| **Idiomas de la interfaz** | Cadenas en JSON por idioma. Arranca con es y en. Los otros 4 los traducen voluntarios o se revisan antes de publicar | Evita traducir 6 idiomas antes de validar la idea. |

## Repositorio y flujo de trabajo

- **Repo**: `danielauu/manducapp`, **público**, para tener CI gratis (incluidos runners macOS para compilar iOS más adelante, ya que el entorno es Windows). Licencia propuesta del código: MIT. Los textos bíblicos **nunca** se versionan en el repo.
- **Monorepo con npm workspaces**:
  ```
  apps/web        # PWA (React + Vite)
  apps/api        # Cloudflare Worker (Hono)
  packages/core   # TypeScript puro: tipos, parsers de feed, segment, timing, session, calendar
  docs/decisions  # ADR-0001 con la tabla de decisiones
  .github/        # workflows de CI/CD, dependabot.yml, plantillas de issue
  ```
- **Ramas y commits**: `main` estable, trabajo en ramas `feat/...` con PR, Conventional Commits. Los commits llevan el trailer de coautoría de Claude.
- **CI (GitHub Actions)** en cada PR: lint, typecheck, Vitest y build.
- **CD**: `apps/web` se publica en GitHub Pages desde `main`. `apps/api` se despliega con `wrangler-action` usando el secreto `CLOUDFLARE_API_TOKEN` del repo.
- **Dependabot** semanal con actualizaciones agrupadas para npm y Actions: es la mayor parte del mantenimiento recurrente y queda automatizada.
- **Planificación**: las Fases 0 a 6 de este plan se vuelven hitos de GitHub, con un issue por tarea.
- **Pasos que debe hacer el usuario** (credenciales y cuentas):
  1. Instalar GitHub CLI (`winget install GitHub.cli`) y ejecutar `gh auth login` con la cuenta `danielauu`.
  2. Instalar Node 22 (`nvm install 22` y `nvm use 22`).
  3. Crear una cuenta gratuita de Cloudflare y agregar el token como secreto del repo (puede hacerse al llegar a la Fase 1).

## Arquitectura

```
cliente (PWA)  --GET /v1/gospel?date=2026-10-11&lang=es-->  Worker  --> Evangelizo  (AELF para fr)
     |                                                          \--> caché de borde (horas, sin persistencia)
     \--(si el Worker no responde)--> Evangelizo directo, con el mismo parser de packages/core
```

- **Contrato de la API**: `GET /v1/gospel?date=YYYY-MM-DD&lang=es|en|fr|it|de|pl` devuelve `{date, lang, liturgicalTitle, reference, lines[], shortLines?, shortReference?, credit, source}`.
- **Puertos intercambiables (`GospelProvider`, `TtsPort`)** aíslan los dos riesgos externos: que el feed cambie y que el TTS del navegador se porte mal en iOS.
- **Atribución obligatoria** en pantalla con la línea de crédito de la respuesta.
- **Fallback**: caché local, luego Evangelizo directo, luego AELF (solo francés), luego "pegar texto".
- El cliente calcula localmente "hoy" y "próximo domingo" con el reloj del dispositivo, lo que siempre cae dentro del límite de 30 días del feed.

### Núcleo 1: `segment.ts`

1. Entrada: las líneas del feed, que ya están casi a nivel de versículo.
2. Unir líneas de menos de 6 palabras con la siguiente. Una línea que termina en `:` siempre se une.
3. Dividir las líneas de más de `MAX` palabras (22 por defecto, ajustable por idioma). Prioridad de corte: `;` y `:`, luego `.`, `?` o `!` dentro de citas, luego `,` cerca del centro y por último una conjunción (y, e, pero, porque, et, mais, car, ma, und, aber, i, że...). Mínimo de 5 palabras a cada lado y sin cortar dentro de una cita corta.
4. Pruebas con casos sintéticos y excerpts cortos. No se versionan evangelios completos con copyright como fixtures.

### Núcleo 2: `session.ts` (`buildSession(oraciones, { personas, repsNuevas, estrategia })`)

Devuelve una lista de pasos: `{tipo, rango, hablante, repeticion, texto}`.

- **`aprender(i)`**: la oración i se repite `3 × n` veces (n = personas), con rotación de hablante.
- **`unir(i-1, i)`**: una repetición por persona de la unión de pares.
- **`bloque(a..b)`**: tras cada 4 oraciones, se recita el bloque acumulado.
- **`final`**: recitado completo, con opción de ocultar el texto y mostrarlo al tocar.
- **`reflexion`**: pausa silenciosa y pantalla de meditación.
- Estrategias: *pares y bloques* (por defecto), *acumulativa* (1..i, solo textos cortos) y *mínima* (solo el final).

### Núcleo 3: `timing.ts`

- Tiempo estimado = Σ (palabras / ~2,5 por segundo + pausa de repetición del usuario) sobre todos los pasos. Escala con n.
- Referencia: un evangelio dominical de ~265 palabras, solo con 3 repeticiones por oración, son unos 5 minutos de voz. Con uniones, pausas y bloques ronda los 15 a 20 minutos. Si se pasa del presupuesto, la app propone el último corte de oración que cabe y muestra qué parte queda sin memorizar.

## Fases

**Fase 0: Arranque del repo y spike de riesgos (2 a 3 días)**
- `git init`, crear `danielauu/manducapp` con `gh`, README, LICENSE, workspaces vacíos, CI mínimo, Dependabot e hitos.
- Verificar `fetch` a Evangelizo desde el navegador en los 6 idiomas.
- **Spike de TTS en un iPhone real instalado como PWA y en Chrome Android**: voces disponibles en los 6 idiomas, fiabilidad del evento de fin de frase, comportamiento con pantalla bloqueada y Wake Lock.
- *Compuerta de decisión*: si el TTS en iPhone PWA falla, se adelanta el envoltorio Capacitor con plugin nativo.

**Fase 1: Núcleo y backend con tests**
`packages/core` (calendar, parsers, segment, timing, session) y `apps/api` (endpoint `/v1/gospel` con caché de borde y fallback AELF para francés). Todo con Vitest. Despliegue del Worker.

**Fase 2: MVP solo (n=1)**
Inicio (hoy, próximo domingo, texto propio), vista previa con recorte, reproductor de sesión (texto grande, contador, play/pausa, avance automático o manual, voz TTS), recitado final y pantalla de reflexión.

**Fase 3: Modo grupo (2 a 5 personas)**
Selector de personas, nombres opcionales, indicador de turno, repeticiones 3×n y tiempo estimado.

**Fase 4: Meditaciones y multilenguaje**
Diario local con lista, edición y exportación. Cadenas de interfaz en los 6 idiomas. Ajustes de idioma de lectura y de voz.

**Fase 5: Endurecimiento y despliegue de la PWA**
Modo sin conexión, instalación, íconos, accesibilidad, Lighthouse, publicación en GitHub Pages y **piloto con un grupo real de oración**.

**Fase 6: Tiendas** (cuando haya presupuesto o exención de Apple)
Envoltorio Capacitor, TTS nativo, recordatorio diario local, Play Store (US$25) y luego App Store.

**Backlog:** Biblia de Jerusalén con permiso editorial, audio pregrabado opcional, grupos remotos, ocultamiento progresivo de palabras, forma corta del evangelio vía AELF en todos los idiomas.

## Costos

| Ítem | Costo |
|---|---|
| GitHub (repo público, Actions, Pages) | $0 |
| Cloudflare Workers (plan gratuito) | $0 |
| Base de datos, TTS | $0 (no hay) |
| Dominio propio (opcional; se puede usar `danielauu.github.io` y `*.workers.dev`) | ~US$10/año |
| Google Play | US$25 una vez |
| Apple Developer | US$99/año, o $0 con exención si hay entidad sin fines de lucro con D-U-N-S |
| **Total v1 (PWA)** | **$0** |

## Riesgos y mitigaciones

1. **El feed de Evangelizo cambia o cae.** No hay SLA ni licencia explícita. Mitigaciones: el Worker (corrección sin pasar por las tiendas), `GospelProvider`, caché local, respaldo AELF y "pegar texto".
2. **El Worker retransmite texto con copyright.** Es una zona gris legal aunque no persista nada: solo caché de borde de pocas horas y sin almacenamiento. **Acción: escribir a Evangelizo para confirmar el uso en una app sin fines de lucro, incluyendo el relé por el Worker, y dejarlo por escrito.** Si dicen que no, el Worker se reduce a un parser en el cliente y no se pierde nada del diseño.
3. **TTS en iPhone PWA poco fiable.** Se resuelve en el spike de la Fase 0. Plan B: Capacitor con TTS nativo.
4. **Calidad y variedad de voces según el dispositivo.** Selector de voz y aviso para instalar voces mejoradas.
5. **App Store (guideline 4.2, funcionalidad mínima) puede rechazar un mero envoltorio web.** Mitigar con TTS nativo, recordatorios locales y compartir.
6. **El navegador puede borrar IndexedDB.** La exportación de meditaciones es parte de la v1.
7. **La versión en español es la argentina (*Libro del Pueblo de Dios*).** Hay que confirmar si sirve a los usuarios objetivo.
8. **GitHub Pages sirve bajo `/manducapp/`.** Vite necesita `base` configurado, y un dominio propio lo evitaría.

## Verificación de punta a punta

- **Repo**: `gh repo view danielauu/manducapp` y que la CI quede en verde en el primer PR.
- **Núcleo:** `npm test` (Vitest) con casos de segmentación (líneas largas y cortas, citas, `:`), de `buildSession` (n=1 y n=5, cada estrategia, conteo de pasos y repeticiones) y de `timing` (el recorte respeta el presupuesto).
- **Backend:** `wrangler dev` y `curl` a `/v1/gospel` en los 6 idiomas, hoy y el próximo domingo. Fecha fuera de rango y fuente caída deben devolver errores controlados.
- **Navegador:** `npm run dev` y recorrido manual: abrir, elegir el domingo, ver el recorte, correr una sesión con TTS, hacer el recitado final y guardar una meditación. Una prueba de humo con Playwright.
- **Dispositivos reales:** instalar como PWA en un iPhone y un Android. Probar con pantalla bloqueada, sin conexión después de la primera carga y con 1 y 5 personas.
- **Piloto:** una manducación completa con un grupo real de 3 a 5 personas.

## Fuentes

- [Evangelizo Reader (documentación en línea)](https://feed.evangelizo.org/v2/reader.php)
- [AELF API](https://api.aelf.org/v1/messes/2026-10-11/france)
- [Apple Developer fee waiver](https://developer.apple.com/support/fee-waiver)
- [Expo Speech](https://docs.expo.dev/versions/latest/sdk/speech.md)
