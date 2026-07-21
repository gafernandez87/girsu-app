# Juego 1 - Separacion en origen

## Objetivo

Convertir la primera etapa en una escena mas cercana a un videojuego 2D, manteniendo la mecanica simple de arrastrar residuos al tacho correcto.

## Implementacion actual

La escena del juego 1 usa una clase Phaser especifica, `HomeSortingScene`, separada del fallback generico usado por los otros juegos.

La pantalla de juego se presenta en modo full screen: la barra superior de la app se oculta y el canvas ocupa todo el viewport. El puntaje, tiempo, progreso e instrucciones se dibujan dentro de Phaser para que la experiencia no se sienta como una web con un juego embebido.

Elementos visuales de la escena:

- Fondo externo de cocina jujeña cargado desde `public/assets/game-1/backgrounds/fondo juego 1.png`.
- Tres tachos externos con estados: normal, hover, abierto y error.
- Productos/residuos cargados como assets 2D externos: botella PET, frasco, carton, cascara, yerba y envoltorio.
- Efectos externos de scoring/error: starburst, confetti, moneda, medalla y error burst.
- HUD interno con puntaje, tiempo y progreso por residuos clasificados.
- Cola de residuos: se muestra un solo producto por vez para concentrar la interaccion en una decision clara.

Los productos, tachos y efectos originales llegaron sin alpha real. Se generaron copias transparentes en las carpetas `processed/`, que son las que carga Phaser.

Animaciones incluidas:

- Entrada con rebote para cada residuo.
- Movimiento idle suave en el producto activo.
- Escalado al tomar un residuo.
- Pulso de tachos durante drag.
- Rebote y retorno al equivocarse.
- Vuelo hacia el tacho, pop-up de puntos y chispas al acertar.
- Panel final con bonus de tiempo y precision.

## Proximo paso visual

Cuando se definan assets finales, los dibujos vectoriales actuales pueden reemplazarse por sprites PNG/WebP sin cambiar la logica de clasificacion, puntaje ni drag/drop.
