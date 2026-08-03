# El Camino de los Residuos

Aplicacion movil educativa para estudiantes y docentes de Jujuy, basada en mini juegos sobre la gestion integral de residuos solidos urbanos.

## Stack

- Angular para shell, pantallas, estado y mini juegos HTML/JS.
- Capacitor para Android/iOS.

## Estructura del proyecto

- `docs/`: documentacion funcional y tecnica del producto.
- `src/app/core`: modelos, datos mock y progreso local.
- `src/app/pages`: pantallas principales.
- `src/app/components`: componentes reutilizables y escenas interactivas de los mini juegos.

Documentos especificos de mini juegos:

- `docs/game-1-separacion.md`.
- `docs/game-3-compostaje.md`.

## Scripts utiles

- `npm run typecheck`: validacion TypeScript sin generar build.
- `npm run cap`: acceso a comandos de Capacitor.

## Estado inicial

La primera version del front trabaja con datos hardcodeados y deja preparada la base para conectar API, autenticacion real, ranking provincial y persistencia mas adelante.

Los scripts `start` y `build` quedan disponibles para etapas posteriores, pero no se ejecutaron durante esta implementacion.
