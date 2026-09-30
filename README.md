# El Camino de los Residuos

Aplicacion movil educativa para estudiantes y docentes de Jujuy, basada en mini juegos sobre la gestion integral de residuos solidos urbanos.

## Stack

- Angular para shell, pantallas, estado y mini juegos HTML/JS.
- Capacitor para Android/iOS.

## Estructura del proyecto

- `docs/`: documentacion funcional y tecnica del producto.
- `supabase/migrations`: esquema de base de datos, RLS y ranking.
- `src/app/core`: modelos, Supabase, autenticacion, progreso y servicios compartidos.
- `src/app/pages`: pantallas principales.
- `src/app/components`: componentes reutilizables y escenas interactivas de los mini juegos.

Documentos especificos de mini juegos:

- `docs/game-1-separacion.md`.
- `docs/game-3-compostaje.md`.
- `docs/backend-architecture.md`.

## Scripts utiles

- `npm run typecheck`: validacion TypeScript sin generar build.
- `npm run cap`: acceso a comandos de Capacitor.

## Backend

La app usa Supabase para autenticacion, perfiles, resultados de juegos, ranking y backoffice.

Los scripts `start` y `build` quedan disponibles para etapas posteriores, pero no deben ejecutarse en este flujo de trabajo.

## Solicitudes de eliminacion de cuenta

La ruta publica `/eliminar-cuenta` se abre sin iniciar sesion y tambien esta disponible en el menu de la app.
Prepara un correo de solicitud; no elimina automaticamente la cuenta ni envia el correo por el usuario.
La URL prevista para Play Console es `https://girsu-app.vercel.app/eliminar-cuenta`, una vez desplegada y configurada la pagina.

Antes de publicar:

- Completar `src/app/core/account-deletion.config.ts` con un correo monitoreado del cliente.
- Confirmar y completar `retentionNotice`: indicar los datos conservados (incluidos backups, logs y correos de solicitudes), los motivos y los plazos adicionales; si no se conserva ninguno, declararlo solo tras verificarlo.
- Publicar la web con soporte para rutas Angular y verificar `/eliminar-cuenta` sin iniciar sesion. Usar su URL HTTPS completa en Play Console.
- Incorporar esta version al siguiente paquete Android para incluir el acceso desde la app.

El equipo debe verificar la titularidad desde el correo registrado y procesar las solicitudes desde Backoffice > Usuarios > Editar > Eliminar usuario.
La funcion existente `admin-users` elimina al usuario de Auth; las claves foraneas `ON DELETE CASCADE` eliminan el perfil, el perfil publico y los resultados asociados.
Verificar el resultado en el entorno desplegado y confirmar la eliminacion al solicitante; no pedir contrasenas.
Los administradores no pueden eliminar su propia cuenta desde el backoffice: otro administrador debe procesar esa solicitud.
