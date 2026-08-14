import { createClient } from 'npm:@supabase/supabase-js@2.112.2';

type UserRole = 'player' | 'admin';

interface AdminUserPayload {
  readonly course?: string;
  readonly email?: string;
  readonly id?: string;
  readonly isActive?: boolean;
  readonly name?: string;
  readonly password?: string;
  readonly role?: UserRole;
  readonly school?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json({ message: 'Metodo no permitido.' }, 405);
  }

  try {
    const adminClient = createAdminClient();
    const caller = await getCaller(request, adminClient);
    await assertAdmin(caller.id, adminClient);

    const { action, payload } = await request.json();

    if (action === 'create') {
      const user = await createUser(payload, adminClient);
      return json({ user });
    }

    if (action === 'update') {
      const user = await updateUser(payload, adminClient);
      return json({ user });
    }

    if (action === 'delete') {
      await deleteUser(payload, caller.id, adminClient);
      return json({ ok: true });
    }

    return json({ message: 'Accion no soportada.' }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No pudimos completar la operacion.';
    const status = error instanceof HttpError ? error.status : 500;
    return json({ message }, status);
  }
});

async function getCaller(
  request: Request,
  adminClient: ReturnType<typeof createAdminClient>,
): Promise<{ readonly id: string }> {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');

  if (!token) {
    throw new HttpError('Sesion requerida.', 401);
  }

  const { data, error } = await adminClient.auth.getUser(token);

  if (error || !data.user) {
    throw new HttpError('Sesion invalida.', 401);
  }

  return { id: data.user.id };
}

async function assertAdmin(userId: string, adminClient: ReturnType<typeof createAdminClient>): Promise<void> {
  const { data, error } = await adminClient
    .from('profiles')
    .select('role, is_active')
    .eq('id', userId)
    .single();

  if (error || data?.role !== 'admin' || !data?.is_active) {
    throw new HttpError('No tenes permisos para administrar usuarios.', 403);
  }
}

async function createUser(
  payload: AdminUserPayload,
  adminClient: ReturnType<typeof createAdminClient>,
) {
  const input = normalizePayload(payload, { passwordRequired: true });

  const { data, error } = await adminClient.auth.admin.createUser({
    email: input.email,
    email_confirm: true,
    password: input.password,
    user_metadata: {
      course: input.course,
      name: input.name,
      school: input.school,
    },
  });

  if (error || !data.user) {
    throw new HttpError(error?.message ?? 'No pudimos crear el usuario.', 400);
  }

  return upsertProfile(data.user.id, input, adminClient);
}

async function updateUser(
  payload: AdminUserPayload,
  adminClient: ReturnType<typeof createAdminClient>,
) {
  if (!payload.id) {
    throw new HttpError('Falta el usuario a editar.', 400);
  }

  const input = normalizePayload(payload, { passwordRequired: false });
  const authUpdate: {
    email: string;
    email_confirm: boolean;
    password?: string;
    user_metadata: Record<string, string>;
  } = {
    email: input.email,
    email_confirm: true,
    user_metadata: {
      course: input.course,
      name: input.name,
      school: input.school,
    },
  };

  if (input.password) {
    authUpdate.password = input.password;
  }

  const { error } = await adminClient.auth.admin.updateUserById(payload.id, authUpdate);

  if (error) {
    throw new HttpError(error.message, 400);
  }

  return upsertProfile(payload.id, input, adminClient);
}

async function deleteUser(
  payload: AdminUserPayload,
  callerId: string,
  adminClient: ReturnType<typeof createAdminClient>,
): Promise<void> {
  if (!payload.id) {
    throw new HttpError('Falta el usuario a eliminar.', 400);
  }

  if (payload.id === callerId) {
    throw new HttpError('No podes eliminar tu propio usuario admin.', 400);
  }

  const { error } = await adminClient.auth.admin.deleteUser(payload.id);

  if (error) {
    throw new HttpError(error.message, 400);
  }
}

async function upsertProfile(
  userId: string,
  input: Required<Omit<AdminUserPayload, 'id'>>,
  adminClient: ReturnType<typeof createAdminClient>,
) {
  const { data, error } = await adminClient
    .from('profiles')
    .upsert({
      course: input.course,
      email: input.email,
      id: userId,
      is_active: input.isActive,
      name: input.name,
      role: input.role,
      school: input.school,
    })
    .select('id, email, name, role, school, course, is_active, created_at, updated_at')
    .single();

  if (error) {
    throw new HttpError(error.message, 400);
  }

  return data;
}

function normalizePayload(
  payload: AdminUserPayload,
  options: { readonly passwordRequired: boolean },
): Required<Omit<AdminUserPayload, 'id'>> {
  const email = payload.email?.trim().toLowerCase() ?? '';
  const password = payload.password?.trim() ?? '';
  const role = payload.role === 'admin' ? 'admin' : 'player';

  if (!email) {
    throw new HttpError('El email es obligatorio.', 400);
  }

  if (!payload.name?.trim()) {
    throw new HttpError('El nombre es obligatorio.', 400);
  }

  if (options.passwordRequired && password.length < 6) {
    throw new HttpError('El password debe tener al menos 6 caracteres.', 400);
  }

  if (!options.passwordRequired && password && password.length < 6) {
    throw new HttpError('El password debe tener al menos 6 caracteres.', 400);
  }

  return {
    course: payload.course?.trim() ?? '',
    email,
    isActive: payload.isActive ?? true,
    name: payload.name.trim(),
    password,
    role,
    school: payload.school?.trim() ?? '',
  };
}

function createAdminClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const secretKey = getSecretKey();

  if (!supabaseUrl || !secretKey) {
    throw new HttpError('Falta configuracion de Supabase en la funcion.', 500);
  }

  return createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getSecretKey(): string | null {
  const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS');

  if (secretKeys) {
    const parsed = JSON.parse(secretKeys) as Record<string, string>;
    return parsed['default'] ?? Object.values(parsed)[0] ?? null;
  }

  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SECRET_KEY');
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    headers: corsHeaders,
    status,
  });
}

class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
