# Documento funcional - El Camino de los Residuos

Fuente: Google Doc "Producto 2.5 - Aplicacion Movil - Documento tecnico de presentacion", pestaña "Presentacion del juego".

## Vision general

La app es una experiencia movil educativa 2D para estudiantes y docentes de nivel primario y secundario de la provincia de Jujuy. Su objetivo es explicar de forma ludica el ciclo completo de la gestion integral de residuos solidos urbanos, desde la separacion en el hogar hasta la valorizacion, el compostaje y la disposicion final.

La propuesta combina contenidos pedagogicos, mini juegos, desafios, puntajes y ranking provincial para promover habitos ambientales sostenibles.

## Alcance definido

- App movil interactiva de libre acceso con login para estudiantes y docentes.
- Contenidos sobre separacion correcta de residuos.
- Trivias, juegos interactivos y desafios.
- Sistema de puntos y ranking de posiciones.
- Diseño accesible, adaptable a Android e iOS.
- Hosting, base de datos y repositorio de imagenes/videos previstos para una etapa posterior.
- Alta en Google Console mediante una cuenta Gmail exclusiva de la aplicacion.

## Estructura pedagogica

La experiencia se organiza como un recorrido secuencial de cuatro etapas, llamado "el camino de los residuos". Cada etapa enseña una parte del proceso GIRSU mediante una mecanica simple y directa.

## Mini juego 1 - Separacion en origen en el hogar

Objetivo pedagogico: promover el habito primario de separar residuos en el hogar.

Entorno: cocina familiar contemporanea con rasgos del norte argentino, tonos calidos, luz natural y referencia visual a paisajes andinos.

Mecanica:

- El usuario ve residuos domesticos limpios sobre una mesada.
- Debe arrastrar cada residuo al contenedor correcto.
- Contenedores: reciclables, no reciclables y compostables.
- Se premia la clasificacion correcta y la velocidad.

Ejemplos de residuos: botellas plasticas, frascos de vidrio, restos de frutas y verduras, yerba, envoltorios, latas y carton.

## Mini juego 2 - Valorizacion industrial en centro de reciclaje

Objetivo pedagogico: revalorizar el trabajo de recuperadores urbanos y mostrar la clasificacion por material en una planta ambiental.

Entorno: planta urbana de separacion inspirada en Jujuy, limpia, luminosa, techada, con cinta transportadora y cerros al fondo.

Mecanica:

- El jugador colabora con un recuperador urbano.
- Los residuos avanzan en una cinta transportadora horizontal.
- Debe clasificar materiales reciclables antes de que lleguen al final.
- Contenedores tecnicos: plastico, papel/carton, vidrio y metal.
- Los residuos no reciclables deben desviarse a una compuerta de descarte.

## Mini juego 3 - Compostaje domiciliario

Objetivo pedagogico: introducir economia circular biologica mediante compostaje hogareño y balance de nutrientes.

Entorno: patio o jardin jujeño, vegetacion regional, suelo de tierra arcillosa, plantas en macetas y compostera central en corte transversal.

Mecanica:

- El jugador debe alimentar la compostera con equilibrio entre materiales verdes y marrones.
- Verdes: residuos humedos/nitrogenados como cascaras, verduras, yerba y saquitos de te.
- Marrones: residuos secos/carbonados como hojas secas, ramas, cesped seco y carton sin tinta.
- Un medidor de humedad advierte cuando hay exceso de verdes.
- La puntuacion maxima se obtiene alternando capas correctamente dentro del tiempo.

## Mini juego 4 - Relleno sanitario de disposicion final

Objetivo pedagogico: desmitificar la idea de basural y mostrar la complejidad de la ingenieria sanitaria.

Entorno: centro de disposicion final inspirado en la infraestructura ambiental de Jujuy, con fosa impermeabilizada mediante geomembrana, grua hidraulica y fondo de cerros al atardecer.

Mecanica:

- Dinamica inspirada en Tetris.
- Caen bolsas de residuos con diferentes tamaños, formas y colores.
- El jugador debe interceptarlas, rotarlas y ubicarlas en la fosa de forma compacta.
- Se deben evitar huecos vacios y acumulacion desordenada.
- La bonificacion depende de cuanto tiempo se mantiene util la fosa sin colapsar.

## Requerimientos transversales

- La app debe sentirse como una experiencia movil, no como una pagina informativa.
- Debe priorizar interacciones tactiles simples: arrastrar, soltar, tocar, rotar y seleccionar.
- Los mini juegos deben poder funcionar con datos locales al inicio y conectarse luego a una API.
- El ranking y los puntajes deben diseñarse desde el front como contrato futuro con backend.
- La estetica debe ser amigable, educativa, regional y clara para estudiantes.

## Decision tecnica inicial

Se adopta Angular + Capacitor porque los mini juegos se implementaran con JavaScript/Canvas/WebGL. Phaser queda como motor 2D principal para los juegos, encapsulado dentro de componentes Angular. Esta arquitectura permite reutilizar el mismo codigo para web, Android e iOS.

