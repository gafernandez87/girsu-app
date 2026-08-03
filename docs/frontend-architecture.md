# Arquitectura front inicial

## Stack

- Angular 21 para shell, navegacion, estado de UI y pantallas.
- Capacitor 8 para empaquetado movil Android/iOS.
- Mini juegos implementados como componentes Angular con HTML, SCSS y eventos de puntero.
- Datos hardcodeados en la primera etapa, con servicios preparados para reemplazar por API.

## Carpetas principales

- `src/app/core/`: modelos, datos mock y estado compartido.
- `src/app/pages/`: pantallas principales.
- `src/app/components/`: componentes reutilizables y escenas interactivas de cada mini juego.

## Flujo inicial

1. Inicio con perfil mock de estudiante/docente.
2. Recorrido con las cuatro etapas del camino de los residuos.
3. Pantalla de juego por etapa.
4. Componente de mini juego recibe datos de la etapa y emite ticks de HUD y resultado final.
5. Servicio de progreso guarda el mejor puntaje localmente.
6. Ranking mock combina progreso local con participantes ficticios.

## Contratos previstos para API futura

- Usuario actual: nombre, rol, escuela, curso, avatar.
- Etapas: configuracion pedagogica, categorias, residuos, reglas y duracion.
- Resultados: etapa, puntaje, aciertos, errores, tiempo restante.
- Ranking: posicion, usuario, escuela, puntaje total.

## Notas de implementacion

- La primera version usa un motor de arrastrar y soltar reutilizable para validar UX y estructura.
- La etapa de relleno sanitario queda modelada en datos y muestra una placa temporal; su mecanica final requerira una escena dedicada tipo puzzle/encastre.
- Las imagenes del Google Doc se consideran referencia visual; los assets finales deben prepararse como PNG/WebP optimizados para mobile cuando no convenga resolverlos con HTML/CSS.
