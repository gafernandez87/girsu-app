# Privacidad y publicación en tiendas

La política se sirve en `/politica-privacidad`, sin guard de autenticación, con acceso desde
el menú, login, registro y eliminación de cuenta. El registro informa qué datos se muestran
a otros participantes. Este aviso no implementa ni acredita consentimiento.

URL prevista, una vez desplegada y verificada:
`https://girsu-app.vercel.app/politica-privacidad`.
No se ha realizado un despliegue como parte de este cambio.

## Completar el borrador

`src/app/core/privacy-policy.config.ts` contiene la fecha y la información del responsable:

- `controllerName`: razón social o entidad responsable, coherente con las fichas de las tiendas.
- `controllerAddress`: domicilio del responsable.
- `contactEmail`: casilla monitoreada para consultas y ejercicio de derechos; si queda vacía,
  se usa el correo de `accountDeletionConfig`.
- `processingBasisNotice`: base que autoriza cada finalidad y cómo se obtiene y retira el consentimiento cuando corresponda.
- `hostingNotice`: proveedores reales de alojamiento y correo, datos que reciben, finalidad y enlaces a sus condiciones.
- `internationalTransfersNotice`: países o regiones efectivos de almacenamiento y tratamiento,
  subencargados y garantías contractuales aplicables. Confirmar en el proyecto Supabase y con los demás proveedores.
- `minorsNotice`: edades admitidas y procedimiento real de autorización y ejercicio de derechos de representantes legales.

`src/app/core/account-deletion.config.ts` sigue siendo la fuente compartida para:

- `email`: contacto de privacidad alternativo. No es requisito ni canal obligatorio para eliminar cuentas.
- `retentionNotice`: datos conservados después de eliminar la cuenta
  (incluidos backups, logs y correos), motivos y plazos de expiración. Verificar el plan de
  Supabase, alojamiento, correo y copias propias; no inventar plazos ni declarar eliminación
  inmediata si no se puede garantizar.

Mientras falta alguno de esos datos, la página muestra que es un borrador. Completar campos
solo retira esa indicación: no verifica el funcionamiento ni certifica cumplimiento.
Actualizar `lastUpdated` al aprobar o modificar el contenido.

## Pendientes funcionales antes del lanzamiento

1. **Activación de la eliminación.** Se reemplazó el correo obligatorio por una operación
   directa desde la app y la web, con confirmación y contraseña actual. El servidor determina
   la cuenta desde el token verificado, revoca las sesiones y elimina Auth y los datos
   asociados por cascada. Aplicar la migración de sesiones y desplegar `delete-account` antes
   de publicar la interfaz. Verificar en el proyecto real con una cuenta descartable.
   Ver `account-deletion.md` para activación y pruebas. El código preparado no equivale
   a un despliegue ni certifica aprobación de la tienda.
2. **Menores y consentimiento.** La audiencia documentada incluye primaria y secundaria.
   El registro actual solo rechaza fechas futuras: no comprueba una edad mínima ni obtiene
   autorización verificable de representantes. Definir edades y mercados, implementar los
   requisitos aplicables y registrar las autorizaciones que correspondan antes de recopilar
   datos. Una casilla de “leí la política” no sustituye esas autorizaciones. Confirmar que los
   contratos de proveedores brindan las garantías exigidas por las tiendas.
3. **Minimización y ranking.** Justificar la necesidad de fecha exacta de nacimiento, nombre
   completo, localidad, escuela y preguntas sobre hábitos, actualmente obligatorios. La fecha
   se almacena pero no hay control de edad implementado. Revisar seudónimos y visibilidad
   escolar para menores. Según las migraciones, usuarios autenticados pueden leer todos los
   resultados (`game_results`, política SELECT `using (true)`), aunque la pantalla muestra
   principalmente el ranking. Confirmar permisos desplegados y limitar esa exposición si
   no es necesaria; la política describe esa visibilidad actual.
4. **Derechos y operación.** Habilitar el contacto, la rectificación y supresión, y un proceso
   interno con responsables y plazos. Validar con el responsable los usos reales de los datos,
   bases de tratamiento, retención, terceros y transferencias antes de aprobar la política.
5. **URL pública.** Desplegar en HTTPS con soporte para acceso directo y recarga de rutas
   Angular. Verificar sin sesión y sin restricciones geográficas `/politica-privacidad` y
   `/eliminar-cuenta`. Registrar la URL pública definitiva en Play Console y App Store Connect.
   No enviar un borrador incompleto como política definitiva.

## Inventario para las declaraciones de las tiendas

Las categorías siguientes son un punto de partida, no respuestas listas para enviar.
Confirmar la implementación final, configuración desplegada y prácticas de todos los SDKs
y proveedores. Los datos de cuenta/perfil y juego están vinculados al usuario.

| Datos observados | Finalidad observada | Destinatarios o visibilidad |
| --- | --- | --- |
| Nombre y apellido, correo, contraseña, ID de usuario | Cuenta, autenticación e identificación | Supabase; administradores ven perfil y correo, no contraseña; nombre visible a participantes |
| Fecha de nacimiento, provincia y localidad declaradas | Ficha de participación; revisar necesidad de cada dato | Supabase y administradores |
| Escuela, pertenencia, curso o rol escolar | Perfil y participación en ranking | Supabase, administradores y participantes autenticados según dato |
| Respuestas sobre residuos y compostaje | Contexto ambiental declarado en el perfil | Supabase y administradores |
| Puntajes, desglose, aciertos, errores, tiempo y fechas | Progreso y ranking | Supabase, administradores y participantes autenticados |
| Sesión persistente, preferencia de sonido | Mantener acceso y preferencia local | Dispositivo; autenticación procesa tokens de sesión |
| IP, navegador/dispositivo y logs posibles | Entrega y seguridad del servicio | Confirmar registros, proveedores y retención reales |
| Correos de consultas o solicitudes | Atención y ejercicio de derechos | Equipo responsable y proveedor de correo por confirmar |

No se observan SDKs publicitarios ni analítica de terceros en el código revisado, y los
manifiestos actuales no solicitan permisos de cámara, micrófono, contactos, fotos o GPS.
Esto no permite declarar que la app no recopila datos. Distinguir recolección, tratamiento
por proveedores, compartición y seguimiento según las definiciones de cada tienda.

## Fuentes oficiales revisadas

- [Google Play: datos de usuario, política y eliminación](https://support.google.com/googleplay/android-developer/answer/10144311?hl=es).
- [Google Play: políticas de Familias](https://support.google.com/googleplay/android-developer/answer/9893335?hl=es).
- [Apple: App Review Guidelines, 5.1](https://developer.apple.com/app-store/review/guidelines/#privacy).
- [Apple: eliminación de cuentas, incluida la restricción de flujos por correo](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion).
- [AAIP: derechos, consentimiento y solicitudes](https://www.argentina.gob.ar/aaip/datospersonales/derechos).
- [Supabase: privacidad](https://supabase.com/privacy), [DPA](https://supabase.com/legal/dpa) y [backups](https://supabase.com/docs/guides/platform/backups).
