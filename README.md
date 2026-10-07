# Manducapp

Herramienta sin fines de lucro para rezar el evangelio por **manducación**: se toma un trozo del evangelio, se divide en oraciones retenibles, cada oración se repite tres veces (3×n si se reza en grupo de n personas), se van uniendo las oraciones, se recita el texto completo de memoria y se termina con una pausa de reflexión y una meditación escrita.

Funciona en iPhone y Android como PWA (después, también en las tiendas), en español, inglés, francés, italiano, alemán y polaco.

## Probarla

La app está publicada en **https://danielauu.github.io/manducapp/**. En el teléfono se puede instalar en la pantalla de inicio (Android: Chrome, menú ⋮, «Instalar aplicación»).

## Estado

El plan completo está en [docs/plan-v1.md](docs/plan-v1.md) y el avance, en los [hitos](https://github.com/danielauu/manducapp/milestones) del repositorio.

| Fase | Estado |
|---|---|
| 0. Arranque y pruebas de riesgo | Hecha. Falta solo la prueba en iPhone, que se pospuso a propósito |
| 1. Núcleo y backend | Núcleo y Worker listos; falta desplegar el Worker (necesita cuenta de Cloudflare) |
| 2. MVP para una persona | Hecha: evangelio de hoy, del domingo o texto propio, recorte por tiempo, voz, repeticiones, uniones, recitado final y reflexión |
| 3. Modo grupo (1 a 5 personas) | Hecha |
| 4. Diario de meditaciones, los 6 idiomas de la interfaz y elección de voz | Hecha. Las traducciones al francés, italiano, alemán y polaco esperan la revisión de hablantes nativos |
| 5. PWA endurecida y piloto | Hecha la parte técnica: ritmo ajustable, modo sin conexión, aviso de instalación y accesibilidad (Lighthouse móvil: rendimiento 98, accesibilidad 100, buenas prácticas 100, SEO 100). Falta el piloto con un grupo real, que describe [docs/piloto.md](docs/piloto.md) |
| 6. Tiendas | Pendiente |

## Principio rector

**Costo de mantención mínimo.** Sin base de datos, sin cuentas de usuario, sin APIs de pago y con pocas dependencias. La voz es la del propio dispositivo (TTS), y el texto del evangelio se pide en tiempo real a una fuente externa.

## Estructura

```
apps/web        PWA (React + Vite)
apps/api        Cloudflare Worker sin estado que normaliza el evangelio del día
packages/core   TypeScript puro: tipos, parsers, segmentación, tiempos y motor de sesión
docs/           plan y decisiones de arquitectura (ADR)
```

## Desarrollo

Requisitos: Node 22 (`nvm use`) y npm.

```bash
npm install
npm test
```

Los scripts se ejecutan en todos los workspaces que los definan (`lint`, `typecheck`, `test`, `build`).

```bash
npm run dev -w @manducapp/web     # PWA en http://localhost:5173
```

La Fase 0 incluye una página de prueba técnica (voz del dispositivo y acceso al feed) que se publica en GitHub Pages: https://danielauu.github.io/manducapp/

## Textos bíblicos

Los textos son propiedad de sus titulares (USCCB, AELF, CEI, Pallottinum, staeko.net, entre otros) y se obtienen en tiempo real desde el feed de [Evangelizo](https://feed.evangelizo.org/v2/reader.php) y la API de [AELF](https://api.aelf.org). **No se incluyen en este repositorio ni se versionan.** La app muestra siempre la línea de crédito que entrega la fuente.

## Licencia

El código se publica bajo licencia [MIT](LICENSE). La licencia no cubre los textos bíblicos.
