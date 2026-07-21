# El Camino de los Residuos

Aplicacion movil educativa para estudiantes y docentes de Jujuy, basada en mini juegos sobre la gestion integral de residuos solidos urbanos.

## Stack

- Angular para shell, pantallas y estado.
- Capacitor para Android/iOS.
- Phaser para mini juegos 2D en Canvas/WebGL.

## Estructura del proyecto

- `docs/`: documentacion funcional y tecnica del producto.
- `src/app/core`: modelos, datos mock y progreso local.
- `src/app/pages`: pantallas principales.
- `src/app/components`: componentes reutilizables y canvas Phaser.

Documento especifico del primer mini juego: `docs/game-1-separacion.md`.

## Scripts utiles

- `npm run typecheck`: validacion TypeScript sin generar build.
- `npm run cap`: acceso a comandos de Capacitor.

## Estado inicial

La primera version del front trabaja con datos hardcodeados y deja preparada la base para conectar API, autenticacion real, ranking provincial y persistencia mas adelante.

Los scripts `start` y `build` quedan disponibles para etapas posteriores, pero no se ejecutaron durante esta implementacion.
