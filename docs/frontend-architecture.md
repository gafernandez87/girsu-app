# Arquitectura front inicial

## Stack

- Angular 21 para shell, navegacion, estado de UI y pantallas.
- Capacitor 8 para empaquetado movil Android/iOS.
- Phaser 4 para mini juegos 2D sobre Canvas/WebGL.
- Datos hardcodeados en la primera etapa, con servicios preparados para reemplazar por API.

## Carpetas principales

- `src/app/core/`: modelos, datos mock y estado compartido.
- `src/app/pages/`: pantallas principales.
- `src/app/components/`: componentes reutilizables, incluido el canvas Phaser.

## Flujo inicial

1. Inicio con perfil mock de estudiante/docente.
2. Recorrido con las cuatro etapas del camino de los residuos.
3. Pantalla de juego por etapa.
4. Componente Phaser recibe datos de la etapa y emite resultado.
5. Servicio de progreso guarda el mejor puntaje localmente.
6. Ranking mock combina progreso local con participantes ficticios.

## Contratos previstos para API futura

- Usuario actual: nombre, rol, escuela, curso, avatar.
- Etapas: configuracion pedagogica, categorias, residuos, reglas y duracion.
- Resultados: etapa, puntaje, aciertos, errores, tiempo restante.
- Ranking: posicion, usuario, escuela, puntaje total.

## Notas de implementacion

- La primera version usa un motor de arrastrar y soltar reutilizable para validar UX y estructura.
- La etapa de relleno sanitario queda modelada en datos, pero su mecanica final requerira una escena dedicada tipo puzzle/encastre.
- Las imagenes del Google Doc se consideran referencia visual; los assets finales deben prepararse como sprites optimizados para mobile.

