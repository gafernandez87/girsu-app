# El Camino de los Residuos

Aplicacion movil educativa para estudiantes y docentes de Jujuy, basada en mini juegos sobre la gestion integral de residuos solidos urbanos.

## Stack

- Angular para shell, pantallas, estado y mini juegos HTML/JS.
- Capacitor para Android/iOS.

## Estructura del proyecto

- `docs/`: documentacion funcional y tecnica del producto.
- `supabase/migrations`: esquema de base de datos, RLS y ranking.
- `src/app/core`: modelos, Supabase, autenticacion, progreso y servicios compartidos.
- `src/app/pages`: pantallas principales.
- `src/app/components`: componentes reutilizables y escenas interactivas de los mini juegos.

Documentos especificos de mini juegos:

- `docs/game-1-separacion.md`.
- `docs/game-3-compostaje.md`.
- `docs/backend-architecture.md`.

## Scripts utiles

- `npm run typecheck`: validacion TypeScript sin generar build.
- `npm run cap`: acceso a comandos de Capacitor.

## Backend

La app usa Supabase para autenticacion, perfiles, resultados de juegos, ranking y backoffice.

Los scripts `start` y `build` quedan disponibles para etapas posteriores, pero no deben ejecutarse en este flujo de trabajo.
