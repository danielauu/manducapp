# Manducapp

App sin fines de lucro para rezar el evangelio por manducación. Plan y decisiones: `docs/plan-v1.md` y `docs/decisions/`.

## Convenciones

- Documentación, textos de interfaz por defecto y mensajes de commit en español. Código e identificadores técnicos en inglés cuando sea lo natural, y los términos del dominio (`manducación`, `oración`) tal como aparecen en el plan.
- Commits con Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`). Trabajo en ramas `feat/...` y PR a `main`.
- **Nunca versionar textos bíblicos** (ni como fixtures completos). Los tests usan texto sintético o fragmentos muy cortos.
- Principio rector: costo de mantención mínimo. Antes de agregar una dependencia, un servicio o un paso manual recurrente, justificarlo.
- Node 22 (`.nvmrc`). Monorepo con npm workspaces: `apps/web`, `apps/api`, `packages/core`.
- `packages/core` es TypeScript puro, sin DOM ni red. Es la parte que más se testea (Vitest).

## Comandos

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
```
