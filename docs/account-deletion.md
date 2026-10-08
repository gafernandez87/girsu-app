# Eliminación de cuenta

## Flujo implementado

La opción **Eliminar cuenta** del menú abre `/eliminar-cuenta`, también accesible en la web
sin sesión previa. Se explica qué se elimina, la irreversibilidad y la retención adicional.
El usuario confirma su intención e ingresa la contraseña actual. Sin sesión, ingresa también
su correo en esa misma página; las cuentas desactivadas no quedan excluidas del borrado.

La app llama a `delete-account` con el token del usuario, la contraseña y `confirmation: true`.
La función no admite identificadores ni correos como destino del borrado. Verifica el token
con Supabase Auth y vuelve a verificar la contraseña contra el correo de esa identidad.
Las claves privilegiadas permanecen en las variables de entorno del servidor. No se
registran cuerpos de solicitudes, contraseñas ni tokens en logs del código de la función.

Después de verificar la identidad, revoca globalmente las sesiones y elimina el usuario de
Auth con borrado definitivo (`deleteUser(id, false)`). Las claves foráneas existentes borran
por cascada perfil, perfil del ranking y resultados. Esto también aplica a la propia cuenta
de un administrador: la restricción de autoeliminación del backoffice no afecta esta vía.

La app limpia la sesión local y muestra éxito solo al recibir `{ ok: true }`. Si se corta la
conexión después del borrado, puede no llegar la confirmación: no se muestra éxito sin ella.
La operación puede volver a intentarse; si la cuenta ya fue borrada, no podrá autenticarse.

La migración `20261007174748_enforce_live_account_sessions.sql` agrega políticas restrictivas
sobre perfiles, perfiles de ranking y resultados. Verifica `auth.sessions` usando el usuario
y `session_id` del JWT, incluido `not_after` si existe. Impide seguir leyendo o escribiendo
esos datos con tokens todavía no vencidos después de cerrar sesiones o eliminar la cuenta.
La función auxiliar está en `app_private`, con búsqueda de esquema fija y permisos limitados.

## Activación en el proyecto real

1. Confirmar que el proyecto conectado es `xxzzzqkscyqyogbcpzci`. Comprobar que las migraciones
   anteriores estén aplicadas y que las referencias de Auth a perfiles y resultados conserven
   `ON DELETE CASCADE`. Revisar si hay datos asociados nuevos fuera del inventario local.
2. Aplicar la migración de sesiones, revisar los asesores de seguridad y probar un inicio de
   sesión y acceso normal antes de desplegar la interfaz. La comprobación supone que los
   JWTs incluyen `session_id`, como los tokens actuales de Supabase Auth.
3. Desplegar `supabase/functions/delete-account/index.ts` junto con `handler.ts`. El proyecto
   incluye la configuración de función con `verify_jwt = true`; además el código comprueba
   la identidad con `auth.getUser`. No desactivar la autenticación para resolver errores.
4. Usar las variables suministradas por Supabase: `SUPABASE_URL`, `SUPABASE_ANON_KEY` y
   `SUPABASE_SERVICE_ROLE_KEY`, o la clave secreta equivalente admitida por el código.
   No copiar claves secretas al frontend ni incluirlas en el repositorio.
5. Verificar el flujo completo con una cuenta descartable en el proyecto real. No usar
   cuentas reales de usuarios para una prueba de borrado. Confirmar eliminación en Auth,
   perfiles y resultados; tokens previos sin acceso; otros usuarios y catálogos intactos.
6. Publicar el frontend y el siguiente paquete iOS/Android. Verificar el acceso directo a la
   página web y su URL de Google Play sin necesitar tener instalada la aplicación.

El borrado no exige correo de soporte. La casilla de privacidad y los motivos/plazos de
retención adicional siguen requiriendo confirmación del responsable antes del lanzamiento.
El código no borra copias de seguridad ni configura los períodos de retención de proveedores.
Los contratos, backups, logs y comunicaciones previas deben verificarse y describirse en la
configuración compartida. No se promete borrado inmediato de esos soportes.

## Verificación sin servidores ni builds

- `npm run typecheck`.
- Diagnóstico de plantillas Angular y tipos de la Edge Function sin emitir archivos.
- `node --experimental-strip-types --test supabase/functions/delete-account/handler.test.mjs`
  (Node 22.18 o superior): métodos, autenticación, confirmación, intentos de elegir otra
  cuenta, contraseña incorrecta, orden de revocación, errores y respuesta de éxito.
- `tests/account-deletion.rls.test.mjs`: ejecuta todas las migraciones en PostgreSQL en memoria
  con PGlite. Prueba sesiones válidas, ajenas, ausentes, malformadas, vencidas y revocadas;
  acceso a ranking y perfiles; rechazo de escrituras; cascada y preservación de otros usuarios
  y catálogos. Instalar PGlite en un directorio temporal y definir `GIRSU_TEST_PGLITE_MODULE`
  con la ruta a su módulo `dist/index.js` para ejecutarlo sin agregar dependencias a la app.

Estas pruebas no sustituyen la prueba real del endpoint desplegado ni la revisión de la tienda.

## Requisitos consultados

- [Apple: eliminación de cuentas](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion).
- [Supabase: sesiones y JWT después del cierre de sesión](https://supabase.com/docs/guides/auth/sessions).
- [Supabase: eliminación definitiva de usuarios](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser).
- [Supabase: autenticación de funciones](https://supabase.com/docs/guides/functions/auth).
