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

## Politica de privacidad

La ruta publica `/politica-privacidad` se puede consultar sin iniciar sesion y esta enlazada
desde el menu, login, registro y la pagina de eliminacion de cuenta.
La URL prevista para las tiendas es `https://girsu-app.vercel.app/politica-privacidad`, una vez desplegada y verificada.

Completar `src/app/core/privacy-policy.config.ts` y los datos compartidos de
`src/app/core/account-deletion.config.ts` con informacion confirmada por el responsable.
Mientras falten datos, la pagina se identifica como borrador.
Ver `docs/privacy-store-readiness.md` para el inventario de datos y los pendientes de
publicacion, especialmente eliminacion de cuenta para iOS, menores y consentimiento.

## Eliminacion de cuenta

La ruta publica `/eliminar-cuenta` permite eliminar la cuenta desde la app o la web.
Quien ya inicio sesion confirma la operacion e ingresa su contrasena actual; quien entra
sin sesion se identifica en esa misma pagina con su correo y contrasena.
No se exige un correo a soporte ni intervencion de un administrador.
La URL prevista para Play Console es `https://girsu-app.vercel.app/eliminar-cuenta`, una vez desplegada.

La Edge Function `delete-account` verifica la identidad y la contrasena en el servidor,
cierra todas las sesiones y elimina la cuenta de Supabase Auth. Las claves foraneas
`ON DELETE CASCADE` eliminan perfil, perfil de ranking y resultados. La pagina muestra
confirmacion solo cuando el servidor informa el exito. Los usuarios administradores
pueden eliminar su propia cuenta por esta via; la restriccion del backoffice para
borrarse a si mismos solo aplica a la funcion administrativa.

La migracion `enforce_live_account_sessions` agrega restricciones para bloquear lectura
y escritura de datos personales con sesiones revocadas, incluso si su JWT no vencio.
Los catalogos de escuelas y localidades se mantienen.

Antes de publicar:

- Aplicar la migracion y desplegar `supabase/functions/delete-account` en el proyecto correcto.
- Mantener autenticacion de la funcion: verificar el bearer con `auth.getUser` dentro del
  servidor; las claves privilegiadas permanecen en las variables del backend.
- Confirmar los plazos y motivos de retencion adicional en `account-deletion.config.ts`.
- Completar responsable y contacto de privacidad; no son necesarios para iniciar el borrado.
- Verificar en el entorno desplegado el flujo completo con una cuenta de prueba, el acceso
  externo sin sesion y la revocacion del acceso con tokens anteriores.
- Publicar la web con soporte para rutas Angular y registrar la URL HTTPS en Play Console.
- Incorporar esta version en las proximas versiones Android e iOS.

Detalle de activacion y pruebas: `docs/account-deletion.md`.
