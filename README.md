# Manducapp

Herramienta sin fines de lucro para rezar el evangelio por **manducación**: se toma un trozo del evangelio, se divide en oraciones retenibles, cada oración se repite tres veces (3×n si se reza en grupo de n personas), se van uniendo las oraciones, se recita el texto completo de memoria y se termina con una pausa de reflexión y una meditación escrita.

Funciona en iPhone y Android como PWA (después, también en las tiendas), en español, inglés, francés, italiano, alemán y polaco.

> Estado: **Fase 0** (arranque del repositorio). El plan completo está en [docs/plan-v1.md](docs/plan-v1.md).

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

## Textos bíblicos

Los textos son propiedad de sus titulares (USCCB, AELF, CEI, Pallottinum, staeko.net, entre otros) y se obtienen en tiempo real desde el feed de [Evangelizo](https://feed.evangelizo.org/v2/reader.php) y la API de [AELF](https://api.aelf.org). **No se incluyen en este repositorio ni se versionan.** La app muestra siempre la línea de crédito que entrega la fuente.

## Licencia

El código se publica bajo licencia [MIT](LICENSE). La licencia no cubre los textos bíblicos.
