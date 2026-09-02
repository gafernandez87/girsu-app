# Mafia Web --- Especificación Funcional v0.1

## 1. Visión del producto

Mafia Web es un juego web multijugador de deducción social inspirado en
Mafia. Los jugadores crean una sala privada, comparten un código con sus
amigos y juegan sin necesidad de un moderador humano.

El sistema actúa como Game Master: asigna roles secretos, administra las
fases de día y noche, habilita las acciones correspondientes, resuelve
ataques y habilidades, administra votaciones y determina la victoria.

El diferencial respecto del Mafia tradicional es una capa adicional de
**vida, economía, inventario e información privada**, diseñada para
aumentar la agencia de todos los participantes, especialmente del
Ciudadano.

## 2. Principios de diseño

1.  **Mafia sigue siendo el núcleo.** La conversación, mentira,
    acusación, deducción y votación siguen decidiendo la partida.
2.  **Todos deben tener decisiones relevantes.** Los roles especiales
    tienen habilidades; el Ciudadano recibe una ventaja económica.
3.  **La información es un recurso.** Salud, inventario, dinero, voto y
    otras variables pueden ser privadas y parcialmente investigables.
4.  **El dinero genera interacción social.** Puede gastarse,
    transferirse y utilizarse para financiar a otros jugadores.
5.  **Las mecánicas agregadas deben producir incertidumbre, negociación
    o información circunstancial**, no resolver automáticamente quién es
    Mafia.
6.  El MVP debe mantenerse pequeño y balanceable. Nuevos roles y objetos
    se incorporarán uno por uno luego de pruebas.

## 3. Flujo de acceso

### Crear sala

-   Un usuario ingresa al sitio.
-   Selecciona `Crear sala`.
-   El sistema genera un código privado corto.
-   El creador comparte el código con sus amigos.
-   No se requiere cuenta para el MVP; cada participante elige un
    nickname.

### Unirse

-   El jugador ingresa el código.
-   Elige un nickname.
-   Ingresa al lobby.
-   Puede ver qué jugadores están conectados.

### Lobby

El creador de la sala puede iniciar la partida cuando estén todos
presentes.

Al comenzar: - se bloquea el ingreso de nuevos jugadores; - el servidor
determina la composición de roles; - los roles se sortean; - cada
jugador recibe su rol de manera privada; - comienza la primera ronda.

El creador deja de tener privilegios de moderador durante la partida.

## 4. Roles iniciales

La primera versión tendrá únicamente:

### Ciudadano

-   Bando: Pueblo.
-   Sin habilidad especial propia.
-   Recibe **2 monedas por día**.
-   Puede utilizar todas las mecánicas universales: tienda, inventario,
    transferencia, chat privado y voto.
-   Su ventaja frente a los roles especiales es económica.

### Mafioso

-   Bando: Mafia.
-   Los mafiosos se conocen entre sí.
-   Recibe **1 moneda por día**.
-   Participa en la selección del objetivo nocturno.
-   La Mafia dispone de dos métodos iniciales de ataque:
    -   **Pistola:** 3 HP de daño. Consume una bala.
    -   **Cuchillo:** 1 HP de daño. No consume munición.
-   Las balas son un recurso limitado.
-   La cantidad inicial de balas será proporcional a la cantidad de
    jugadores; la fórmula exacta queda pendiente de balance.
-   La Mafia puede comprar balas adicionales mediante un objeto
    exclusivo de su tienda.

### Detective

-   Bando: Pueblo.
-   Recibe **1 moneda por día**.
-   Una vez por noche puede investigar a un jugador.
-   La habilidad clásica permite obtener información sobre su afiliación
    Mafia/Pueblo.
-   Se evaluará durante balance si la investigación necesita límites,
    cooldown o alguna variante menos determinista.
-   Futuras extensiones pueden permitir investigaciones de información
    privada mediante dinero.

### Médico

-   Bando: Pueblo.
-   Recibe **1 moneda por día**.
-   Una vez por noche puede seleccionar un jugador y curarle **1 HP**.
-   No necesita conocer los HP actuales del objetivo.
-   Una curación nunca puede superar el máximo de vida.

## 5. Sistema de vida

-   Todos los jugadores comienzan con **3 HP**.
-   Los HP son información privada.
-   Al llegar a 0 HP, el jugador muere y queda eliminado.
-   Un disparo hace 3 HP de daño.
-   Un cuchillazo hace 1 HP de daño.
-   Un Medikit recupera 1 HP.
-   El Médico recupera 1 HP mediante su habilidad.
-   Una expulsión por votación elimina al jugador independientemente de
    sus HP.

Que un jugador esté herido no implica que el resto conozca su estado. El
jugador puede revelar su salud, ocultarla o mentir sobre ella.

## 6. Economía

### Ingresos

Al comienzo de cada nuevo día: - Ciudadano: **+2 monedas**. - Cualquier
rol especial: **+1 moneda**.

Los valores son iniciales y están sujetos a balance.

### Saldo

-   El saldo de cada jugador es privado.
-   No puede gastarse más dinero del disponible.
-   Las compras y transferencias son irreversibles salvo que una futura
    mecánica establezca lo contrario.

### Transferencias

Durante el día, un jugador vivo puede transferir monedas propias a otro
jugador vivo.

Características iniciales: - privadas entre emisor y receptor; -
cantidad libre hasta el saldo disponible; - sin comisión; -
irreversibles; - no requieren comprar un objeto.

El sistema no implementa contratos. Los jugadores pueden negociar
verbalmente condiciones a cambio de dinero, pero cualquiera puede
incumplirlas.

## 7. Tienda e inventario

La tienda está disponible para todos los jugadores, aunque puede mostrar
productos distintos según el rol.

Precios provisionales:

### Chaleco antibalas --- 3 monedas

-   Bloquea un disparo.
-   No bloquea daño de cuchillo.
-   Se consume al bloquear el disparo.

### Medikit --- 2 monedas

-   Recupera 1 HP.
-   No permite superar 3 HP.

### Bala --- 5 monedas

-   Visible únicamente para la Mafia.
-   Agrega una bala a la reserva de munición mafiosa.
-   La propiedad de la munición será compartida por el equipo Mafia en
    la versión inicial.

### Informe médico --- 2 monedas

-   El comprador selecciona otro jugador.
-   Obtiene privadamente sus HP actuales.

### Sondeo --- 3 monedas

-   Permite conocer privadamente a quién votó un jugador en la última
    votación.

### Revisión de pertenencias --- 4 monedas

-   Permite conocer un objeto aleatorio del inventario de otro jugador.
-   Si no posee objetos, el resultado lo indica.

### Seguimiento --- 3 monedas

-   Se utiliza sobre un jugador durante la noche.
-   Informa si ese jugador realizó una acción.
-   No informa qué acción realizó ni cuál fue su objetivo.

### Seguro de vida --- 2 monedas

-   Al comprarlo, el jugador elige secretamente un beneficiario.
-   Si el asegurado muere o es expulsado, el beneficiario recibe **4
    monedas**.
-   El beneficiario no necesita saber previamente que fue elegido.
-   Los valores 2→4 son provisionales.

## 8. Información privada

Inicialmente son privados: - rol; - bando; - HP; - saldo; -
inventario; - voto individual; - mensajes privados; - acciones
nocturnas; - beneficiario del seguro.

El servidor conserva la verdad absoluta del estado de la partida, pero
cada jugador accede solamente a la información que las reglas permiten.

Los jugadores pueden mentir verbalmente sobre cualquier información
privada.

Como regla de diseño, los objetos de información no deberían vender una
revelación directa del rol o bando. Deben ofrecer datos circunstanciales
que el jugador tenga que interpretar.

## 9. Chat privado

Además de la conversación externa o presencial, el juego contará con
mensajería privada entre jugadores vivos.

Para el MVP: - disponible durante el día; - comunicación uno a uno; -
mensajes privados para el resto; - el historial se conserva al menos
durante la partida.

Queda para pruebas posteriores determinar si el chat será ilimitado o si
ciertas acciones de mensajería tendrán costes o restricciones.

## 10. Ciclo de partida

El ciclo principal será:

`Lobby → Asignación de roles → Noche → Resolución → Día → Discusión → Votación → Resolución → Verificación de victoria → siguiente Noche`

### Noche

-   El sistema habilita únicamente las acciones disponibles para cada
    jugador.
-   Mafia selecciona ataque/objetivo.
-   Detective investiga.
-   Médico cura.
-   Se procesan objetos o acciones nocturnas.
-   Cuando todos los actores necesarios terminan o vence el
    temporizador, el servidor resuelve las acciones.

### Resolución nocturna

El servidor calcula: - daño; - protección; - curaciones; - muertes; -
investigaciones; - efectos de objetos; - seguros y otras consecuencias.

### Día

-   Se anuncia públicamente el resultado que corresponda.
-   Se acreditan los ingresos diarios.
-   Los jugadores pueden conversar.
-   Pueden utilizar las funciones habilitadas durante el día: tienda,
    transferencias, chat, etc.

### Votación

-   Cada jugador vivo emite un voto privado.
-   El sistema contabiliza votos.
-   Se resuelven empates según una regla que deberá definirse.
-   El jugador expulsado queda eliminado.
-   Se ejecutan consecuencias asociadas a su muerte, como seguros.
-   El sistema comprueba las condiciones de victoria.

## 11. Condiciones de victoria

Inicialmente se mantienen las condiciones clásicas de Mafia:

-   **Pueblo:** gana cuando todos los miembros de la Mafia han sido
    eliminados.
-   **Mafia:** gana cuando alcanza una situación en la que controla o
    iguala al resto de jugadores vivos según la regla de mayoría
    adoptada.

La condición exacta de victoria mafiosa deberá formalizarse durante la
implementación del motor de reglas.

## 12. Backlog funcional

No forman parte del MVP, pero quedan registrados para evaluación:

-   veneno y daño progresivo;
-   cerraduras/protección frente a visitas;
-   robo de objetos;
-   ubicaciones físicas dentro de la ciudad;
-   Guardaespaldas;
-   Vigilante;
-   Periodista;
-   Armero;
-   Espía;
-   Ladrón;
-   Envenenador;
-   Sicario;
-   Falsificador;
-   Chantajista;
-   manipulación de seguros/herencias;
-   interceptación de mensajes;
-   objetos adicionales de información;
-   matchmaking público;
-   cuentas persistentes;
-   rankings;
-   progresión;
-   cosméticos;
-   chat de voz integrado.

## 13. Estrategia de desarrollo funcional

Los sistemas se incorporarán incrementalmente.

1.  Implementar el loop clásico de Mafia automatizado.
2.  Incorporar HP y ataques Pistola/Cuchillo.
3.  Incorporar economía e ingresos diferenciados.
4.  Incorporar tienda e inventario.
5.  Incorporar curación y protecciones.
6.  Incorporar información privada comprable.
7.  Incorporar transferencias.
8.  Incorporar chat privado.
9.  Incorporar seguro de vida.
10. Realizar partidas de prueba y balance.
11. Incorporar nuevos roles **uno por uno**, probando cada incorporación
    antes de sumar la siguiente.

La prioridad no será tener muchos roles sino conseguir que las
interacciones entre los pocos sistemas iniciales produzcan partidas
variadas, comprensibles y socialmente interesantes.
