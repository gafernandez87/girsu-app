# Backend y backoffice

## Stack

- Supabase Auth para registro, login y sesion.
- Supabase Postgres para perfiles, resultados de juegos y ranking.
- Row Level Security activado en tablas expuestas.
- Angular consume Supabase con la clave publicable del proyecto.

## Proyecto Supabase

- Project ref: `xxzzzqkscyqyogbcpzci`.
- URL: `https://xxzzzqkscyqyogbcpzci.supabase.co`.

## Modelo

- `profiles`: datos privados del usuario, email, rol, escuela, curso y estado activo.
- `public_profiles`: copia minima para ranking, sin email ni rol.
- `game_results`: intentos guardados por usuario y juego.
- `leaderboard`: vista `security_invoker` que suma el mejor puntaje por juego.

## Roles

- `player`: puede jugar y guardar sus propios resultados.
- `admin`: puede ver y editar perfiles desde el backoffice.

Para convertir el primer usuario en admin, registrar una cuenta desde la app y luego ejecutar:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@example.com';
```

## Backoffice

El panel `/admin` permite:

- Ver perfiles.
- Editar nombre, escuela, curso y rol.
- Activar o desactivar usuarios.
- Ver el ranking.

La creacion y eliminacion real de usuarios de Supabase Auth requiere una Edge Function con service role. No se expone service role en el frontend.
