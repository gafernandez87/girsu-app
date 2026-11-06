# Estado de publicacion de iOS

Revision de App Store Connect realizada el 2026-10-20.
App: El Camino de los Residuos. Apple ID: 6822346080.
Bundle ID: com.proyectojujuy.caminoresiduos. Idioma: Espanol (Mexico).

## Icono

Se actualizo el icono de la app con el logo solicitado.
Origen: `public/assets/brand/logo-camino.png` (1080 x 1080).
Destino: `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png`.
Exportacion: PNG de 1024 x 1024, sin canal alfa. El nombre del archivo se conserva
porque `Contents.json` ya lo referencia como icono universal de iOS.

En Xcode se configura en App > Assets > AppIcon. App Store Connect recibe el icono
incluido en el build; no alcanza con cambiarlo localmente para actualizar el build 1.
Hace falta un nuevo archive con un numero de compilacion disponible, por ejemplo 2.
El build 1 existente sigue disponible para pruebas y no fue reemplazado.

## TestFlight

- Version 1.0, compilacion 1: En pruebas, marcada como Internos.
- Grupo Pruebas internas: una compilacion y un tester.
- gastonf87@gmail.com: Invitado desde el 13 de octubre, sin instalaciones registradas.
- Distribucion de compilaciones: manual.
- No se enviaron nuevas invitaciones ni se envio la app a revision.
- Se guardo la descripcion de la app beta en Espanol (Mexico).
- Se guardaron el contacto privado de revision autorizado por Gaston y el correo
  para comentarios `educacion@ambientejujuy.gob.ar`.
- La cuenta demo para una futura revision externa sigue pendiente. El formulario
  beta exige ambas credenciales al activar "Es necesario iniciar sesion"; se
  conservo el valor previo desactivado y se explico en las notas que la app exige
  una cuenta. Corregir ese campo y cargar credenciales antes de pedir revision beta
  externa. No afecta al build interno ya disponible.

## Ficha publica

| Campo | Estado observado | Accion pendiente |
| --- | --- | --- |
| Nombre, bundle ID e idioma | Completos | Conservar |
| Subtitulo | Guardado | Aprende a separar y reciclar |
| Descripcion y palabras clave | Guardadas en Espanol (Mexico) | Revisar antes del lanzamiento |
| Texto promocional | Guardado | Revisar antes del lanzamiento |
| Capturas de iPhone e iPad | Sin cargar | Las cuatro imagenes entregadas son Android y no tienen el tamano requerido |
| URL de soporte | Vacia | Publicar el bloque de soporte en /politica-privacidad y verificar la pagina antes de cargarla |
| URL de marketing | Vacia, opcional | Confirmar el sitio publico definitivo |
| Copyright | Guardado | 2026 SECRETARIA DE INFORMATICA - MINISTERIO DE HACIENDA Y FINANZAS DE LA PROVINCIA DE JUJUY |
| Categoria principal | Educacion, guardada | Conservar |
| Clasificacion por edades | Cuestionario sin completar | Responder segun las funciones reales y el publico objetivo |
| Derechos sobre el contenido | Sin configurar | Confirmar autorizaciones sobre arte y contenido |
| URL de privacidad | Vacia | Completar y aprobar la politica antes de enlazarla |
| Declaracion de datos de privacidad | Sin comenzar | Declarar la recopilacion real de cuentas, perfiles y resultados |
| Precio y disponibilidad | Gratuita, solo Argentina | Configurado con confirmacion de Gaston; no disponible en los otros 174 paises |
| Contacto para revision | Guardado | Gaston Fernandez, con correo y telefono autorizados en el chat |
| Cuenta para revision | Credenciales vacias | Preparar acceso de prueba si se mantiene el inicio de sesion obligatorio |
| Compilacion para App Store | Sin seleccionar | Subir un build apto para App Store cuando corresponda publicar |

La compilacion actual es TestFlight Internal Only y no sirve para presentar esa
misma compilacion a App Review. No es un bloqueo para las pruebas internas.

Se cambio y guardo la opcion de publicacion de la version a manual. La version
sigue En preparacion para el envio; no se envio a revision ni se publico.

Los precios se guardaron con region base Argentina (USD) y precio $0.00.
La tabla de precios muestra equivalencias para todos los territorios, pero la
disponibilidad se configuro por separado: solo Argentina, al publicarse la app.
No se habilito la expansion automatica a nuevos paises.

## Capturas recibidas

Se revisaron las cuatro imagenes originales sin modificarlas:
`/Users/gastonfernandez/Downloads/girsu app 1.jpeg` hasta `girsu app 4.jpeg`.
Las cuatro miden 596 x 1278 y muestran las barras de estado y navegacion de
Android. No se cargaron como capturas de iOS ni se estiraron para simular otro
dispositivo. Pendiente obtener capturas originales de iPhone y, si se mantiene
la compatibilidad con iPad, de iPad en las medidas que pide App Store Connect.
Esto no bloquea las pruebas internas de la compilacion ya disponible.

## Datos del responsable que faltan en el proyecto

`src/app/core/privacy-policy.config.ts` tiene vacios el responsable, domicilio,
contacto, bases de tratamiento, proveedores, transferencias y tratamiento de menores.
`src/app/core/account-deletion.config.ts` tiene vacios el contacto alternativo y
la informacion de retencion. No usar la politica incompleta como texto definitivo.
Ver `docs/privacy-store-readiness.md` y `docs/account-deletion.md` para los pendientes
de activacion y verificacion que ya estaban documentados; esta revision no los valida.

## Textos guardados en la ficha

Se guardaron en App Store Connect, sin enviar a revision:

- Subtitulo: Aprende a separar y reciclar
- Palabras clave: reciclaje,residuos,compostaje,educacion,ambiente,jujuy,separacion
- Texto promocional: Aprende sobre separacion de residuos, reciclaje, compostaje
  y relleno sanitario con cuatro minijuegos inspirados en Jujuy.
- Descripcion: texto de 1025 caracteres sobre los cuatro minijuegos (separacion
  en origen, valorizacion industrial, compostaje domiciliario y relleno sanitario),
  puntajes y ranking provincial. Se aclara que se necesita una cuenta para guardar
  el progreso y participar en el ranking. Tambien se guardo como descripcion beta
  de TestFlight. En la web de Apple se cargaron las tildes correspondientes.

## Soporte publico

Gaston confirmo `educacion@ambientejujuy.gob.ar` como correo publico de soporte.
Propuso reutilizar `https://girsu-app.vercel.app/politica-privacidad`. Al abrir esa
URL en Chrome se verifico que la politica publicada aun muestra el aviso de
borrador, el responsable y domicilio pendientes y el canal de consultas no
habilitado. No es adecuada todavia como URL de soporte ni como politica definitiva.
Se agrego en el codigo de esa misma pagina un bloque "Soporte de la app", con el
correo y un enlace mailto para consultas y errores. Se retiro la pagina separada
de soporte preparada durante esta tarea para reutilizar la URL que prefiere Gaston.
Esto no completa ni certifica las condiciones legales de la politica. No se publico
en el hosting ni se cargo una URL sin el contacto de soporte en Apple. Se comprobo
con `npm run typecheck`, sin build ni servidor local; la verificacion visual de la
pagina actualizada queda pendiente.

El titular de copyright confirmado es la Secretaria de Informatica. Se cargo el
nombre completo en mayusculas que indico Gaston y el anio 2026.
El contacto privado de revision se cargo con autorizacion expresa de Gaston, tanto
en la ficha de App Store como en TestFlight. El telefono privado no se copia a este
documento ni se utiliza como contacto publico.

## Pendientes antes de publicar

- Capturas reales de iOS y nueva compilacion para incorporar el logo.
- Publicar y verificar el bloque de soporte de la pagina de privacidad. La politica
  requiere sus propias confirmaciones antes de presentarla como definitiva.
- Cuenta demo para revision, derechos sobre el arte y contenido, politica y
  declaraciones de privacidad, y cuestionario de edades. La categoria Educacion
  no determina por si sola la clasificacion por edades ni implica pertenecer a la
  categoria infantil. Las imagenes de colillas y el ranking requieren evaluar las
  preguntas sobre referencias a tabaco y concursos segun las definiciones de Apple.

## Referencias

- [Apple: agregar un icono](https://developer.apple.com/help/app-store-connect/manage-app-information/add-an-app-icon/).
- [Apple: pruebas internas](https://developer.apple.com/help/app-store-connect/test-a-beta-version/add-internal-testers/).
