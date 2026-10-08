export interface DeletionBackend {
  getUser(token: string): Promise<{ readonly id: string; readonly email: string } | null>;
  verifyPassword(
    email: string,
    password: string,
  ): Promise<{
    readonly id: string;
    readonly accessToken: string;
  } | null>;
  revokeSessions(token: string, scope: 'global' | 'local'): Promise<void>;
  deleteUser(id: string): Promise<void>;
}

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Max-Age': '86400',
  'Cache-Control': 'no-store',
};

function json(body: unknown, status = 200): Response {
  return Response.json(body, { headers: corsHeaders, status });
}

export function createAccountDeletionHandler(backend: DeletionBackend) {
  return async (request: Request): Promise<Response> => {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders, status: 204 });
    }
    if (request.method !== 'POST') return json({ message: 'Método no permitido.' }, 405);

    const token = request.headers.get('Authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1];
    if (!token) return json({ message: 'Iniciá sesión para eliminar tu cuenta.' }, 401);

    let body: unknown;
    try {
      const text = await request.text();
      if (text.length > 8192) return json({ message: 'Solicitud demasiado grande.' }, 413);
      body = JSON.parse(text);
    } catch {
      return json({ message: 'La solicitud no es válida.' }, 400);
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return json({ message: 'La solicitud no es válida.' }, 400);
    }
    const input = body as Record<string, unknown>;
    if (
      Object.keys(input).some((key) => key !== 'password' && key !== 'confirmation') ||
      input['confirmation'] !== true ||
      typeof input['password'] !== 'string' ||
      !input['password'] ||
      input['password'].length > 4096
    )
      return json({ message: 'Confirmá la eliminación e ingresá tu contraseña actual.' }, 400);

    try {
      // The target always comes from the verified token, never from the request body.
      const user = await backend.getUser(token);
      if (!user) return json({ message: 'Tu sesión venció. Volvé a identificarte.' }, 401);

      const verified = await backend.verifyPassword(user.email, input['password']);
      if (!verified || verified.id !== user.id) {
        if (verified) await backend.revokeSessions(verified.accessToken, 'local');
        return json({ message: 'La contraseña no es correcta.' }, 403);
      }
      // Revoke all sessions first. The RLS migration rejects revoked JWTs immediately.
      await backend.revokeSessions(verified.accessToken, 'global');
      await backend.deleteUser(user.id);
      return json({ ok: true });
    } catch {
      // Never return provider errors or log credentials/request bodies.
      return json({ message: 'No pudimos confirmar la eliminación. Volvé a intentarlo.' }, 503);
    }
  };
}
