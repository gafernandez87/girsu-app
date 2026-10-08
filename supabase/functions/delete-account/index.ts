import { createClient } from 'npm:@supabase/supabase-js@2.112.2';
import { createAccountDeletionHandler, type DeletionBackend } from './handler.ts';

function getSecretKey(): string | undefined {
  const keys = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (keys) {
    const parsed = JSON.parse(keys) as Record<string, string>;
    return parsed['default'] ?? Object.values(parsed)[0];
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SECRET_KEY');
}

function createBackend(): DeletionBackend {
  const url = Deno.env.get('SUPABASE_URL');
  const secretKey = getSecretKey();
  if (!url || !secretKey) throw new Error('Missing backend configuration.');
  const options = {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  };
  const admin = createClient(url, secretKey, options);
  // Separate client: password verification must not replace the privileged session.
  const verifier = createClient(url, Deno.env.get('SUPABASE_ANON_KEY') ?? secretKey, options);

  return {
    async getUser(token) {
      const { data, error } = await admin.auth.getUser(token);
      if (error) {
        if ([401, 403, 404].includes(error.status ?? 0)) return null;
        throw error;
      }
      return data.user?.email ? { id: data.user.id, email: data.user.email } : null;
    },
    async verifyPassword(email, password) {
      const { data, error } = await verifier.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.code === 'invalid_credentials') return null;
        throw error;
      }
      return data.user && data.session
        ? { id: data.user.id, accessToken: data.session.access_token }
        : null;
    },
    async revokeSessions(token, scope) {
      const { error } = await admin.auth.admin.signOut(token, scope);
      if (error) throw error;
    },
    async deleteUser(id) {
      const { error } = await admin.auth.admin.deleteUser(id, false);
      if (error) throw error;
    },
  };
}

Deno.serve(async (request) => {
  // Per-request clients: no authentication state shared between users.
  try {
    return await createAccountDeletionHandler(createBackend())(request);
  } catch {
    return Response.json(
      { message: 'El servicio de eliminación no está disponible. Intentá nuevamente.' },
      {
        status: 503,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Cache-Control': 'no-store',
        },
      },
    );
  }
});
