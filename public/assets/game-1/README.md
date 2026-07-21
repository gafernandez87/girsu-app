# Assets - Juego 1

Colocar aca los assets del mini juego "Separacion en origen".

## Carpetas

- `backgrounds/`: fondo de cocina o capas de fondo.
- `bins/`: tachos de reciclables, no reciclables y compostables.
- `products/`: residuos/productos arrastrables.
- `effects/`: estrellas, chispas, confeti, acierto y error.
- `ui/`: botones, placas, badges, iconos de HUD o tutorial.

## Nombres sugeridos

### Tachos

- `bin-reciclables.png`
- `bin-no-reciclables.png`
- `bin-compostables.png`
- `bin-reciclables-open.png`
- `bin-no-reciclables-open.png`
- `bin-compostables-open.png`

El juego actualmente carga los tachos recortados desde `bins/processed/`:

- `reciclables-normal.png`, `reciclables-hover.png`, `reciclables-open.png`, `reciclables-error.png`
- `no-reciclables-normal.png`, `no-reciclables-hover.png`, `no-reciclables-open.png`, `no-reciclables-error.png`
- `compostables-normal.png`, `compostables-hover.png`, `compostables-open.png`, `compostables-error.png`

### Productos

- `botella-pet.png`
- `frasco-vidrio.png`
- `carton.png`
- `cascara-fruta.png`
- `yerba.png`
- `envoltorio.png`

Los productos activos del juego se cargan desde `products/processed/` con nombres seguros para URL:

- `botella.png`
- `tarro-vidrio.png`
- `caja-carton.png`
- `cascaras.png`
- `yerba.png`
- `envoltorio-dulce.png`

### Efectos

- `sparkle.png`
- `success-star.png`
- `error-icon.png`
- `combo-burst.png`

El juego actualmente carga efectos recortados desde `effects/processed/`:

- `starburst.png`
- `confetti.png`
- `green-ring.png`
- `coin.png`
- `medal.png`
- `error-x.png`
- `error-burst.png`
- `drag-hand.png`

## Formato recomendado

- PNG o WebP con fondo transparente.
- Exportar cada elemento como archivo separado.
- Mantener bordes/sombras consistentes para que se lean bien sobre el fondo.
- Para animaciones, usar varios frames con sufijo numerado, por ejemplo `bin-reciclables-open-01.png`.
