# Assets procesados - Juego 4

Los archivos originales quedan en `public/assets/game-4/`. Esta carpeta contiene recortes listos para usar en la UI del juego.

## Fondo

Ubicacion: `background/`

- `fondo-tetris.png`

Es una copia del fondo original con nombre sin espacios para usarlo desde CSS.

## Bolsas

Ubicacion: `bags/`

- `bolsa-azul.png`
- `bolsa-naranja.png`
- `bolsa-verde.png`
- `bolsa-roja.png`
- `bolsa-violeta.png`

Cada bolsa esta centrada en un lienzo transparente cuadrado de 512 x 512 px y fue reencuadrada con una escala visual pareja para que todas ocupen un tamano similar dentro de las celdas del Tetris.

## Botones

Ubicacion: `buttons/`

Acciones:

- `left`
- `right`
- `rotate`
- `down`

Estados exportados:

- `normal`
- `pressed`
- `disabled`
- `muted`

Formato de nombre: `<accion>-<estado>.png`, por ejemplo `left-normal.png`.

## Grua

Ubicacion: `crane/`

- `grua-estructura-completa.png`: estructura superior completa como referencia o version estatica.
- `grua-estructura-fija.png`: estructura superior sin el carro/cable principal, pensada para usar como capa fija.
- `grua-carro-cable-gancho.png`: carro, cable y gancho juntos, pensada para mover horizontalmente.
- `grua-cable-gancho.png`: cable y gancho sin la estructura principal, por si se dibuja el carro por separado.
