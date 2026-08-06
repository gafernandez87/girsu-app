# Juego 1 - Separacion en origen

## Objetivo

Convertir la primera etapa en una escena mas cercana a un videojuego 2D, manteniendo la mecanica simple de arrastrar residuos al tacho correcto.

## Implementacion actual

La escena del juego 1 esta implementada con HTML, SCSS y eventos de puntero dentro de `GameCanvasComponent`.

La pantalla de juego se presenta en modo full screen: la barra superior de la app se oculta y la escena ocupa todo el viewport. El puntaje, tiempo, progreso e instrucciones se dibujan como HUD propio para que la experiencia no se sienta como una web con un juego embebido.

Elementos visuales de la escena:

- Fondo externo de cocina jujeña cargado desde `public/assets/game-1/backgrounds/fondo juego 1.png`.
- Tres tachos externos con estados: normal, hover, abierto y error.
- Productos/residuos cargados como assets 2D externos desde:
  `public/assets/game-1/products/compostables/`,
  `public/assets/game-1/products/reciclables/` y
  `public/assets/game-1/products/no-reciclables/`.
- Efectos externos de scoring/error: starburst, confetti, moneda, medalla y error burst.
- HUD interno con puntaje y tiempo.
- Bandeja de residuos: se muestran 3 productos al azar al iniciar. Cuando el jugador tira un
  producto en un tacho, el producto desaparece y su slot se repone con otro producto del mazo
  mezclado si todavia quedan productos disponibles.

El juego 1 ya no carga sus productos desde `products/processed/`. Esa carpeta queda fuera de la
dinamica principal de separacion. Los tachos y efectos siguen usando sus versiones recortadas de
`bins/processed/` y `effects/processed/`.

Animaciones incluidas:

- Entrada con rebote para cada residuo.
- Movimiento idle suave en el producto activo.
- Escalado al tomar un residuo.
- Pulso de tachos durante drag.
- Retorno al soltar fuera de un tacho.
- Pop-up de puntos y chispas al acertar.
- Error visual y resta de puntos al tirar un producto en el tacho equivocado.
- Panel final con bonus de tiempo y precision.
