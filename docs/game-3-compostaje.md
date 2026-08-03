# Juego 3 - Compostaje domiciliario

## Objetivo

Introducir la economia circular biologica mediante una mecanica corta de compostaje hogareño. El aprendizaje central es que una compostera sana necesita alternar materiales verdes humedos, ricos en nitrogeno, con materiales marrones secos, ricos en carbono.

## Escena visual

La escena representa un patio jujeño luminoso con suelo arcilloso, cerros al fondo, cardones, suculentas y macetas regionales. La compostera ocupa el centro y se muestra en corte transversal para que las capas internas sean visibles durante la partida.

La escena usa como fondo principal `public/assets/game-3/backgrounds/fondo-compostera.png`, una ilustracion panoramica del patio jujeño con cerros, tierra arcillosa, vegetacion nativa y area central libre. La compostera interactiva se renderiza por encima del fondo para conservar el corte transversal, las capas animadas y el vidrio frontal como elementos jugables.

La compostera mantiene la segunda iteracion visual tomada como referencia de `Fondo Compostera 2.png`: una estructura ancha, con laterales de piedra, marco de madera y un frente vidriado grande. La tapa se retiro para que el foco quede en el vidrio frontal y en la evolucion del material interno.

El juego reutiliza assets del juego 1 para mantener continuidad visual:

- `public/assets/game-1/products/processed/cascaras.png` para restos vegetales.
- `public/assets/game-1/products/processed/yerba.png` para yerba.
- `public/assets/game-1/products/processed/caja-carton.png` para carton sin tinta.

Los materiales sin asset especifico, como hojas secas, ramas y saquito de te, se dibujan con CSS dentro del componente para evitar sumar imagenes temporales.

## Logica de juego

El jugador arrastra 10 materiales desde dos recipientes:

- Verdes humedos: restos de verdura, cascaras de fruta, hojas de lechuga, yerba y saquito de te.
- Marrones secos: hojas secas, ramas, cesped seco, carton limpio y carton trozado.

La compostera espera primero una base seca y luego alterna capas. Internamente se usa un balance simple de humedad:

- Cada capa verde suma `+1`.
- Cada capa marron suma `-1`.
- Valores entre `-1` y `1` se consideran balanceados.
- `+2` o mas deja la compostera en estado muy humedo.
- `-2` o menos deja la compostera en estado muy seco.

Todas las capas que el jugador suelta sobre la compostera se aceptan, incluso cuando rompen la alternancia o empeoran la humedad. Esos casos cuentan como error interno, restan puntaje y cortan la racha, pero no disparan sacudidas, carteles correctivos ni resaltados del contenedor recomendado. La animacion de recepcion es neutral para cualquier capa aceptada; la intencion es que el estudiante pueda equivocarse, observar el resultado y deducir el balance sin que el juego le indique la siguiente jugada.

Cada material aceptado dispara una lluvia breve de particulas dentro de la ventana de la compostera. Las particulas varian por categoria y residuo: verdes organicos, hojas/material seco, lechuga, cesped, ramitas, carton y saquito de te. La capa nueva entra con una animacion de caida y asentamiento, con altura, desplazamiento y rotacion sutilmente variables para evitar el efecto de franjas planas.

## Puntuacion

Cada capa correcta suma los puntos definidos en `GAME_STAGES` y agrega bonus de racha. Los errores restan puntos y cortan la racha. Al finalizar se suman:

- Bonus por tiempo restante: `remainingSeconds * 10`.
- Bonus de precision: `(correct - mistakes) * 22`, sin bajar de cero.

El panel final muestra "Abono desbloqueado" cuando se completan todas las capas sin errores. En cualquier otro cierre muestra "Compost en proceso".

## Implementacion tecnica

La etapa esta implementada sin motor externo en:

- `src/app/components/game-canvas/compost-game/compost-game.component.ts`.
- `src/app/components/game-canvas/compost-game/compost-game.component.html`.
- `src/app/components/game-canvas/compost-game/compost-game.skin.scss`.

El componente recibe un `GameStage`, emite `StageTick` para mantener actualizado el HUD compartido y emite `StageResult` al terminar. La interaccion usa eventos de puntero (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`) para funcionar igual con mouse y tactil.

La escena se integra desde `GameCanvasComponent`, igual que el juego industrial. El motor 2D externo fue retirado del flujo y de las dependencias del proyecto; los mini juegos actuales quedan resueltos con Angular, HTML, SCSS y TypeScript.

La animacion de llenado se apoya en dos estructuras reactivas:

- `layers`: conserva las capas ya agregadas, con tipo, altura, desplazamiento, leve inclinacion y fragmentos visibles persistentes.
- `particles`: conserva solo las particulas transitorias; se generan al aceptar un material y se eliminan automaticamente al terminar la animacion.
- `placedItemIds`: marca los recursos ya usados. En la interfaz, cada pila conserva siempre sus cinco filas y los recursos colocados quedan como espacios invisibles para evitar que los contenedores cambien de alto o que la pantalla salte durante la partida.

En mobile la interfaz usa una distribucion especifica para evitar superposiciones: el HUD se compacta, el progreso por puntos se oculta, el medidor de humedad queda como indicador lateral reducido y la compostera deja de estirarse a toda la altura disponible. Para lograr el efecto visual de bajar la caja sin depender de un `top` fijo en pixeles, la grilla reserva una primera fila mas alta y alinea la compostera al borde inferior de esa fila. La caja se achica respecto de desktop, suma una base de tierra en perspectiva tipo top-down y agrega planos decorativos de madera para insinuar el borde trasero y los laterales, de modo que no se lea como un frente completamente plano. Los contenedores inferiores quedan en dos columnas tactiles.

## Proximos ajustes posibles

- Reemplazar los dibujos CSS restantes de residuos por PNG/WebP finales si se aprueban assets especificos para cada material.
- Ajustar pesos de puntaje si se quiere castigar mas el exceso de verdes que la falta de humedad.
- Agregar una animacion final de uso del abono en las macetas cuando se defina el arte de plantas desbloqueadas.
