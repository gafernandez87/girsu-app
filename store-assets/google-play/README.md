# Recursos para Google Play

Archivos preparados para los campos **App icon** y **Feature graphic** de la ficha principal de la tienda.

| Archivo | Medidas | Formato | Peso |
| --- | --- | --- | --- |
| `girsu-app-icon-512.png` | 512 × 512 | PNG de 32 bits, sRGB, alfa completamente opaco | 152.408 bytes |
| `girsu-feature-graphic-1024x500.png` | 1024 × 500 | PNG de 24 bits, sRGB, sin alfa | 1.211.029 bytes |

El ícono conserva el arte original de `public/assets/brand/girsu-logo.jpg`. Se redujo proporcionalmente a 448 × 448 y se centró en un lienzo blanco de 512 × 512, con 32 píxeles de margen adicional por lado. No lleva esquinas redondeadas ni sombra exterior. El archivo original de la app se conserva.

La gráfica destacada se creó con la habilidad **imagegen**, usando la herramienta integrada y los fondos reales de los juegos 2 y 3 como referencias. La exportación se ajustó a 1024 × 500 y se verificaron sus dimensiones, canales de color y peso.

Texto alternativo sugerido: «El Camino de los Residuos: reciclaje y compostaje entre cerros jujeños, con tachos de colores y una compostera».

## Prompt final de la gráfica destacada

Use case: compositing / ads-marketing. Asset type: Google Play feature graphic for the existing educational game 'El Camino de los Residuos'. Generate a wide horizontal 1024 x 500 composition (aspect ratio 2.048:1), full bleed, opaque. Input images 1 and 2 are supporting style/backdrop references from the actual game: the Jujuy recycling plant and the composting landscape. Adapt those visual environments into a polished illustrated store feature graphic. Art style: hand illustrated 2D game artwork with crisp ink outlines and warm terracotta, ochre and muted green colors matching the supplied game scenes. Scene: multicolored Jujuy mountains, cardon cacti, warm daylight, recycling and composting educational activities. Show a modest composting box with leaves and vegetable scraps, and blue plastic, yellow paper, red metal and green glass recycling bins with clear simple universal recycling symbols, consistent with the app. Do not invent fantasy characters, medals or mechanics. Make the composition clear and uncluttered at phone size. Main title exact Spanish text, large and legible, dark deep green on a warm pale cream open area: 'El Camino de los Residuos'. Use a tasteful bold rounded sans-serif typeface, two or three balanced lines, around central-left. Secondary exact text below, smaller but comfortably legible: 'Aprendé a separar, reciclar y compostar'. Main illustrated bin and compost grouping occupies central-right. Keep all essential text and prominent objects well inside the central safe area, at least 70 pixels away from every edge in the 1024x500 output. Background can extend to edges. No app icon duplication, no GIRSU logo, no extra words, no store badges, no 'gratis', no calls to install, no rankings, no stars, no watermarks, no phone/device frame, no UI buttons, no outer borders. It should look like promotional artwork for these actual games, not a screenshot. Deliver one final full image at 1024x500.

Referencias locales:

- `public/assets/game-2/backgrounds/fondo-juego-2.png`
- `public/assets/game-3/backgrounds/fondo-compostera.png`

## Especificaciones consultadas

- [Diseño de íconos de Google Play](https://developer.android.com/distribute/google-play/resources/icon-design-specifications)
- [Recursos gráficos de la ficha de la tienda](https://support.google.com/googleplay/android-developer/answer/9866151)
- [Política de metadatos](https://support.google.com/googleplay/android-developer/answer/9898842)

Los archivos están exportados para subir a la ficha de la tienda. Su preparación no los publica ni reemplaza los íconos de inicio de Android incluidos en el proyecto.
