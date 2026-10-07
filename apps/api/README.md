# @manducapp/api

Cloudflare Worker sin estado que entrega el evangelio del día en un JSON único. Sin base de datos, sin cuentas y sin almacenamiento propio: solo una caché de borde de 1 hora.

## Endpoint

```
GET /v1/gospel?date=YYYY-MM-DD&lang=es|en|fr|it|de|pl[&source=evangelizo|aelf]
```

- `source` es opcional. Por defecto se usa Evangelizo; en francés, si falla, se cae a AELF. `source=aelf` fuerza AELF (solo francés) y trae la forma breve del evangelio (`shortLines`, `shortReference`).
- Respuesta 200: el tipo `Gospel` de `@manducapp/core`, con la línea de crédito de la traducción, que debe mostrarse siempre junto al texto.
- Errores, siempre como `{ "error": { "code", "message" } }`:

| Código | HTTP | Causa |
|---|---|---|
| `bad-request` | 400 | Parámetros ausentes o inválidos |
| `out-of-range` | 400 | Evangelizo no entrega fechas a más de 30 días |
| `not-found` | 404 | La fuente no trae evangelio ese día, o ruta inexistente |
| `bad-response` | 502 | La fuente respondió algo inesperado |
| `rate-limited` | 503 | La fuente limitó las peticiones; trae `Retry-After: 60` |
| `network` | 504 | No se pudo conectar con la fuente |

## Desarrollo

```bash
npm test -w @manducapp/api        # tests con fetch y caché falsos, en Node
npx wrangler dev                  # en esta carpeta: sirve el Worker en local
npx wrangler deploy --dry-run     # solo empaqueta; no despliega ni necesita cuenta
```

El despliegue lo hace GitHub Actions con los secretos `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` (ver el issue de despliegue).
