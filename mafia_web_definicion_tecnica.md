# Mafia Web --- Definición Técnica de Desarrollo v0.1

## 1. Objetivo técnico

Construir una aplicación web multijugador en tiempo real que permita
ejecutar partidas privadas de Mafia sin moderador humano.

El servidor debe ser **autoritativo**: roles, HP, dinero, inventarios,
votos, acciones y resultados nunca deben depender del estado informado
por el cliente.

La arquitectura debe permitir agregar roles, objetos y reglas de forma
incremental sin reescribir el motor principal.

## 2. Alcance técnico del MVP

Incluye: - creación y unión a salas privadas; - nicknames sin
registro; - lobby en tiempo real; - asignación privada de roles; -
máquina de estados de partida; - fases día/noche/votación; - roles
Ciudadano, Mafia, Detective y Médico; - HP; - economía; - tienda; -
inventario; - ataques con pistola/cuchillo; - curación; - objetos
iniciales; - transferencias; - chat privado; - votación privada; -
resolución server-side; - condiciones de victoria; - reconexión básica.

No incluye inicialmente: - matchmaking; - login obligatorio; - perfiles
persistentes; - chat de voz; - ranking; - progresión; - pagos reales; -
cosméticos; - aplicación mobile nativa.

## 3. Stack propuesto

### Frontend

**Next.js + TypeScript**

Responsabilidades: - interfaz responsive mobile-first; - lobby; - vistas
específicas de cada fase; - HUD privado del jugador; -
tienda/inventario; - chat; - votación; - acciones de rol; - feedback de
eventos.

### Backend

Puede residir inicialmente dentro del ecosistema Node/TypeScript, pero
el motor de juego debe mantenerse separado de la UI.

Propuesta: - Node.js + TypeScript; - API HTTP para operaciones
transaccionales/no realtime; - WebSocket para sincronización de sala y
partida.

### Persistencia

**PostgreSQL** para datos que requieran persistencia.

Para el primer prototipo, el estado activo de las partidas puede
mantenerse en memoria si se acepta perder partidas ante un restart.
Antes de producción deberá existir persistencia/recovery adecuada.

### Estado realtime / escalabilidad

Primera etapa: - una instancia de servidor; - estado activo en
memoria; - WebSockets.

Etapa posterior: - Redis para presencia, pub/sub, locks y/o estado
efímero; - múltiples instancias del servidor; - sticky sessions o
distribución compatible con el sistema realtime elegido.

## 4. Arquitectura lógica

Separar cuatro capas:

### UI

Renderiza únicamente información autorizada para el jugador.

### Application Layer

Procesa comandos: - crear sala; - unirse; - comprar; - transferir; -
votar; - atacar; - investigar; - curar; - enviar mensaje.

### Game Engine

Contiene las reglas puras del juego: - fases; - validación de
acciones; - resolución; - daño; - curación; - objetos; - economía; -
eliminación; - victoria.

### Infrastructure

-   WebSocket;
-   base de datos;
-   timers;
-   logging;
-   generación de códigos;
-   persistencia/recovery.

El Game Engine no debería depender de React, HTTP ni WebSocket.

## 5. Modelo de dominio

Entidades principales:

### Room

``` ts
type Room = {
  id: string;
  code: string;
  status: "LOBBY" | "PLAYING" | "FINISHED";
  ownerPlayerId: string;
  createdAt: Date;
};
```

### Player

``` ts
type Player = {
  id: string;
  roomId: string;
  nickname: string;
  connectionStatus: "ONLINE" | "OFFLINE";
  alive: boolean;
};
```

### PlayerGameState

Información privada y autoritativa.

``` ts
type PlayerGameState = {
  playerId: string;
  role: RoleId;
  faction: "TOWN" | "MAFIA";
  hp: number;
  maxHp: number;
  coins: number;
  inventory: InventoryItem[];
};
```

### Game

``` ts
type Game = {
  id: string;
  roomId: string;
  round: number;
  phase: GamePhase;
  status: "RUNNING" | "FINISHED";
  winner?: "TOWN" | "MAFIA";
};
```

### GamePhase

``` ts
type GamePhase =
  | "ROLE_REVEAL"
  | "NIGHT"
  | "NIGHT_RESOLUTION"
  | "DAY"
  | "VOTING"
  | "VOTE_RESOLUTION"
  | "FINISHED";
```

### Action

``` ts
type GameAction = {
  id: string;
  gameId: string;
  round: number;
  actorId: string;
  type: ActionType;
  targetId?: string;
  payload?: unknown;
  createdAt: Date;
};
```

## 6. Máquina de estados

El backend controla exclusivamente las transiciones.

``` text
LOBBY
  ↓
ROLE_REVEAL
  ↓
NIGHT
  ↓
NIGHT_RESOLUTION
  ↓
DAY
  ↓
VOTING
  ↓
VOTE_RESOLUTION
  ↓
CHECK_WINNER
  ├── winner → FINISHED
  └── no winner → NIGHT
```

El cliente nunca decide cambiar de fase.

Cada transición genera un evento realtime para los jugadores
autorizados.

## 7. Patrón de comandos y eventos

Conviene separar:

### Commands

Intenciones enviadas por clientes.

Ejemplos:

``` text
JOIN_ROOM
START_GAME
SUBMIT_NIGHT_ACTION
BUY_ITEM
USE_ITEM
TRANSFER_COINS
SEND_PRIVATE_MESSAGE
CAST_VOTE
```

### Events

Hechos confirmados por el servidor.

Ejemplos:

``` text
PLAYER_JOINED
GAME_STARTED
PHASE_CHANGED
COINS_RECEIVED
ITEM_PURCHASED
HP_CHANGED
PLAYER_DIED
PRIVATE_MESSAGE_RECEIVED
VOTE_RESOLVED
GAME_FINISHED
```

Esto facilita testing, auditoría y futuras mecánicas.

## 8. Seguridad de información

Este punto es crítico.

El frontend **nunca debe recibir el estado completo de la partida** y
luego ocultarlo visualmente.

Incorrecto:

``` json
{
  "players": [
    {"name":"Ana","role":"MAFIA"},
    {"name":"Juan","role":"DETECTIVE"}
  ]
}
```

aunque React muestre solamente parte.

Correcto: el servidor genera una vista específica para cada jugador.

Ejemplo:

``` ts
function buildPlayerView(
  gameState: GameState,
  viewerId: PlayerId
): PlayerView;
```

La respuesta contiene únicamente información que `viewerId` está
autorizado a conocer.

Esto aplica a: - roles; - HP; - dinero; - inventario; - votos; -
acciones; - chats; - investigaciones; - Mafia teammates; - seguros.

## 9. Sistema de reglas extensible

Roles y objetos no deberían implementarse mediante grandes bloques
`if/else`.

Propuesta conceptual:

``` ts
interface RoleDefinition {
  id: RoleId;
  faction: Faction;
  dailyIncome: number;
  getAvailableActions(context: RoleContext): AvailableAction[];
}
```

Objetos:

``` ts
interface ItemDefinition {
  id: ItemId;
  price: number;
  visibility: "ALL" | Faction | RoleId;
  canPurchase(ctx: PurchaseContext): boolean;
  use?(ctx: ItemUseContext): Effect[];
}
```

Las acciones producen **Effects**:

``` ts
type Effect =
  | DamageEffect
  | HealEffect
  | GainCoinsEffect
  | TransferCoinsEffect
  | RevealInformationEffect
  | AddItemEffect
  | ConsumeItemEffect
  | DeathEffect;
```

El motor resuelve efectos en un orden determinista.

Esto permitirá agregar roles/objetos sin modificar el loop principal.

## 10. Resolución nocturna

La resolución debe estar centralizada.

Ejemplo conceptual:

``` text
1. Cerrar recepción de acciones.
2. Validar acciones pendientes.
3. Construir efectos.
4. Aplicar protecciones.
5. Aplicar ataques/daño.
6. Aplicar curaciones según orden definido.
7. Resolver investigaciones.
8. Resolver objetos.
9. Determinar HP finales.
10. Eliminar jugadores con HP <= 0.
11. Ejecutar efectos onDeath.
12. Comprobar condiciones de victoria.
13. Generar vistas/eventos públicos y privados.
```

El orden exacto deberá definirse explícitamente porque afectará el
balance.

Ejemplo: si una persona recibe un disparo de 3 y una curación de 1 la
misma noche, debemos decidir si muere antes de ser curada o termina con
1 HP.

Estas reglas deben tener tests automatizados.

## 11. Sistema de tienda

El catálogo debe estar definido como datos/configuración siempre que sea
posible.

Ejemplo:

``` ts
const ITEMS = {
  MEDKIT: {
    price: 2,
    visibility: "ALL",
  },
  BULLETPROOF_VEST: {
    price: 3,
    visibility: "ALL",
  },
  BULLET: {
    price: 5,
    visibility: "MAFIA",
  },
};
```

Toda compra se valida server-side: - jugador vivo; - fase permitida; -
saldo suficiente; - producto visible/autorizado; - límites de
inventario; - restricciones específicas.

## 12. Economía

Operaciones monetarias deben ser atómicas.

``` ts
transferCoins(from, to, amount)
```

Debe validar: - ambos jugadores vivos; - misma partida; - fase válida; -
amount \> 0; - saldo suficiente.

Luego:

``` text
from.coins -= amount
to.coins += amount
```

No debe existir un estado intermedio observable.

Las compras siguen el mismo principio.

## 13. Chat privado

Modelo mínimo:

``` ts
type PrivateMessage = {
  id: string;
  gameId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: Date;
};
```

Reglas: - solo jugadores autorizados; - inicialmente solo durante el
día; - validar longitud; - rate limiting; - sanitización/render
seguro; - entrega realtime; - historial visible únicamente para
participantes de la conversación.

Si posteriormente se implementan roles que interceptan mensajes, el
sistema de autorización deberá extenderse desde el servidor.

## 14. Votación

Los votos son privados.

``` ts
type Vote = {
  gameId: string;
  round: number;
  voterId: string;
  targetId: string;
};
```

Restricciones: - un voto efectivo por jugador; - solo jugadores vivos; -
objetivo válido; - únicamente durante `VOTING`.

Debe definirse si un jugador puede modificar su voto antes del cierre.

La resolución ocurre exclusivamente en el servidor.

## 15. Reconexión

Cada jugador necesita un token secreto asociado a su participación en la
sala.

Ejemplo:

``` text
roomCode + playerSessionToken
```

Ante refresh o pérdida temporal de conexión: - el cliente reconecta; -
presenta token; - el servidor recupera identidad; - genera nuevamente
`PlayerView`; - envía estado autorizado actual.

Nunca se debe confiar en nickname como identidad.

## 16. API HTTP tentativa

``` text
POST /api/rooms
POST /api/rooms/:code/join
POST /api/rooms/:code/start

GET  /api/game/state

POST /api/game/actions
POST /api/game/shop/purchase
POST /api/game/items/use
POST /api/game/coins/transfer
POST /api/game/vote
```

La estructura final puede variar según framework.

## 17. Eventos WebSocket tentativos

Server → Client:

``` text
room:updated
game:started
game:state
game:phase-changed
game:private-event
game:public-event
chat:message
game:finished
```

Client → Server puede usar comandos WebSocket o HTTP según el tipo de
operación. Para el MVP conviene elegir un patrón consistente y evitar
duplicar lógica.

## 18. Testing

### Unit tests

Prioridad máxima para Game Engine: - daño; - chaleco; - cuchillo; -
curación; - muerte; - economía; - transferencias; - compras; -
seguros; - Detective; - Médico; - condiciones de victoria.

### Tests de escenarios

Ejemplo:

``` text
Given jugador A tiene 3 HP
And A posee chaleco
When Mafia dispara a A
Then A mantiene 3 HP
And el chaleco se consume
And la bala se consume
```

Otro:

``` text
Given A tiene 1 HP
And B usa Médico sobre A
And Mafia apuñala a A
When se resuelve la noche
Then el resultado depende del orden de resolución formalmente definido
```

### Integration tests

-   crear sala;
-   unir múltiples jugadores;
-   iniciar partida;
-   ejecutar ronda completa;
-   reconectar;
-   finalizar partida.

## 19. Observabilidad

Registrar server-side: - creación/cierre de salas; - inicio/final de
partidas; - transiciones de fase; - comandos inválidos; - excepciones; -
desconexiones; - tiempos de resolución.

Para playtesting también conviene registrar métricas anónimas: -
duración de partida; - rondas; - win rate Mafia/Pueblo; - compras por
objeto; - monedas generadas/gastadas; - daño por arma; - supervivencia
por rol.

Estas métricas serán esenciales para balance.

## 20. Roadmap técnico sugerido

### Fase 1 --- Skeleton realtime

-   proyecto;
-   Room;
-   lobby;
-   código privado;
-   WebSocket;
-   presencia/reconexión básica.

### Fase 2 --- Motor clásico

-   Game Engine;
-   state machine;
-   roles;
-   noche/día;
-   votación;
-   condiciones de victoria.

### Fase 3 --- Vida y combate

-   HP;
-   cuchillo;
-   pistola;
-   munición;
-   Médico;
-   chaleco.

### Fase 4 --- Economía

-   ingresos;
-   saldo;
-   tienda;
-   inventario;
-   Medikit;
-   balas;
-   transferencias.

### Fase 5 --- Información

-   HP privado;
-   informe médico;
-   sondeo;
-   pertenencias;
-   seguimiento;
-   Detective.

### Fase 6 --- Sistemas sociales

-   chat privado;
-   seguro de vida;
-   eventos privados;
-   UX de información.

### Fase 7 --- Playtesting

-   telemetría;
-   partidas controladas;
-   balance;
-   corrección de exploits;
-   revisión de UX mobile.

### Fase 8 --- Expansión

Agregar **un rol u objeto por iteración**, acompañado de tests y
playtesting.

## 21. Decisiones técnicas pendientes

Antes o durante el prototipo deberán cerrarse: - framework realtime
concreto; - persistencia del estado de partidas activas; - duración de
fases y timers; - algoritmo de composición de roles; - fórmula de balas
iniciales; - orden exacto de resolución nocturna; - regla de empates; -
regla exacta de victoria Mafia; - posibilidad de modificar voto; -
cuándo pueden utilizarse objetos; - límites de inventario; - expiración
de salas; - comportamiento ante desconexión prolongada; -
sanitización/moderación del chat; - retención de mensajes y partidas.

## 22. Criterio arquitectónico principal

La prioridad técnica es que **agregar un nuevo rol o un nuevo objeto sea
una extensión del motor, no una modificación transversal del sistema**.

El servidor debe ser la única fuente de verdad y cada cliente debe
recibir exclusivamente la porción del estado que puede conocer. Esta
separación será fundamental para evitar trampas y para permitir futuras
mecánicas de espionaje, ocultamiento y manipulación de información.
