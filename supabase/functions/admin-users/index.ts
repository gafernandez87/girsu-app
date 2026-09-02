import { createClient } from 'npm:@supabase/supabase-js@2.112.2';

type UserRole = 'player' | 'admin';
type Province = 'Jujuy' | 'Otra';
type SchoolMembership = 'jujuy_school' | 'no_jujuy_school';

interface AdminUserPayload {
  readonly birthDate?: string;
  readonly composting?: unknown;
  readonly course?: string;
  readonly email?: string;
  readonly id?: string;
  readonly isActive?: boolean;
  readonly locality?: string;
  readonly localityId?: string;
  readonly localitySource?: string;
  readonly name?: string;
  readonly password?: string;
  readonly province?: string;
  readonly role?: UserRole;
  readonly schoolId?: string;
  readonly schoolMembership?: string;
  readonly schoolRole?: string;
  readonly wasteSeparation?: unknown;
}

interface NormalizedAdminUserPayload {
  readonly birthDate: string;
  readonly composting: readonly string[];
  readonly course: string;
  readonly email: string;
  readonly isActive: boolean;
  readonly locality: string;
  readonly localityId: string | null;
  readonly name: string;
  readonly password: string;
  readonly province: Province;
  readonly role: UserRole;
  readonly schoolId: string | null;
  readonly schoolMembership: SchoolMembership;
  readonly schoolRole: string;
  readonly wasteSeparation: readonly string[];
}

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Max-Age': '86400',
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
      birth_date: input.birthDate,
      composting: input.composting,
      course: input.course,
      locality: input.locality,
      locality_id: input.localityId ?? '',
      locality_source: input.province === 'Jujuy' ? 'jujuy_catalog' : 'manual',
      name: input.name,
      province: input.province,
      school_id: input.schoolId ?? '',
      school_membership: input.schoolMembership,
      school_role: input.schoolRole,
      waste_separation: input.wasteSeparation,
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
    user_metadata: Record<string, unknown>;
  } = {
    email: input.email,
    email_confirm: true,
    user_metadata: {
      birth_date: input.birthDate,
      composting: input.composting,
      course: input.course,
      locality: input.locality,
      locality_id: input.localityId ?? '',
      locality_source: input.province === 'Jujuy' ? 'jujuy_catalog' : 'manual',
      name: input.name,
      province: input.province,
      school_id: input.schoolId ?? '',
      school_membership: input.schoolMembership,
      school_role: input.schoolRole,
      waste_separation: input.wasteSeparation,
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
  input: NormalizedAdminUserPayload,
  adminClient: ReturnType<typeof createAdminClient>,
) {
  const [locality, school] = await Promise.all([
    input.province === 'Jujuy' ? getLocality(input.localityId, adminClient) : Promise.resolve(null),
    input.schoolMembership === 'jujuy_school' ? getSchool(input.schoolId, adminClient) : Promise.resolve(null),
  ]);

  const { data, error } = await adminClient
    .from('profiles')
    .upsert({
      birth_date: input.birthDate,
      composting: input.composting,
      course: input.course,
      email: input.email,
      id: userId,
      is_active: input.isActive,
      locality: locality?.name ?? input.locality,
      locality_id: locality?.id ?? null,
      locality_source: locality ? 'jujuy_catalog' : 'manual',
      name: input.name,
      province: input.province,
      role: input.role,
      school_membership: input.schoolMembership,
      school_role: input.schoolRole,
      school: school?.name ?? '',
      school_id: school?.id ?? null,
      waste_separation: input.wasteSeparation,
    })
    .select(
      'id, email, name, role, birth_date, province, locality, locality_id, locality_source, school_id, school_membership, school_role, school, course, waste_separation, composting, is_active, created_at, updated_at',
    )
    .single();

  if (error) {
    throw new HttpError(error.message, 400);
  }

  return data;
}

async function getSchool(
  schoolId: string | null,
  adminClient: ReturnType<typeof createAdminClient>,
): Promise<{ readonly id: string; readonly name: string } | null> {
  if (!schoolId) {
    return null;
  }

  const { data, error } = await adminClient
    .from('schools')
    .select('id, name')
    .eq('id', schoolId)
    .single();

  if (error || !data) {
    throw new HttpError('La escuela seleccionada no existe.', 400);
  }

  return data;
}

async function getLocality(
  localityId: string | null,
  adminClient: ReturnType<typeof createAdminClient>,
): Promise<{ readonly id: string; readonly name: string } | null> {
  if (!localityId) {
    throw new HttpError('Selecciona una localidad de Jujuy.', 400);
  }

  const { data, error } = await adminClient
    .from('jujuy_localities')
    .select('id, name')
    .eq('id', localityId)
    .single();

  if (error || !data) {
    throw new HttpError('La localidad seleccionada no existe.', 400);
  }

  return data;
}

function normalizePayload(
  payload: AdminUserPayload,
  options: { readonly passwordRequired: boolean },
): NormalizedAdminUserPayload {
  const email = payload.email?.trim().toLowerCase() ?? '';
  const password = payload.password?.trim() ?? '';
  const role = payload.role === 'admin' ? 'admin' : 'player';
  const province = normalizeProvince(payload.province);
  const schoolMembership = normalizeSchoolMembership(payload.schoolMembership);
  const locality = payload.locality?.trim() ?? '';
  const localityId = payload.localityId?.trim() || null;
  const birthDate = normalizeBirthDate(payload.birthDate);
  const schoolRole = payload.schoolRole?.trim() ?? '';
  const wasteSeparation = normalizeHabitValues(payload.wasteSeparation, 'separación de residuos');
  const composting = normalizeHabitValues(payload.composting, 'compostaje');

  if (!isEmail(email)) {
    throw new HttpError('Ingresa un email válido.', 400);
  }

  if (!payload.name?.trim()) {
    throw new HttpError('El nombre es obligatorio.', 400);
  }

  if (!schoolRole) {
    throw new HttpError('Selecciona el rol en la escuela.', 400);
  }

  if (province === 'Jujuy' && !localityId) {
    throw new HttpError('Selecciona una localidad de Jujuy.', 400);
  }

  if (province === 'Otra' && !locality) {
    throw new HttpError('Escribe la localidad.', 400);
  }

  if (schoolMembership === 'jujuy_school' && !payload.schoolId?.trim()) {
    throw new HttpError('Selecciona una escuela de Jujuy.', 400);
  }

  if (options.passwordRequired && password.length < 6) {
    throw new HttpError('El password debe tener al menos 6 caracteres.', 400);
  }

  if (!options.passwordRequired && password && password.length < 6) {
    throw new HttpError('El password debe tener al menos 6 caracteres.', 400);
  }

  return {
    birthDate,
    composting,
    course: payload.course?.trim() ?? '',
    email,
    isActive: payload.isActive ?? true,
    locality: province === 'Otra' ? locality : '',
    localityId: province === 'Jujuy' ? localityId : null,
    name: payload.name.trim(),
    password,
    province,
    role,
    schoolId: schoolMembership === 'jujuy_school' ? payload.schoolId?.trim() || null : null,
    schoolMembership,
    schoolRole,
    wasteSeparation,
  };
}

function normalizeProvince(province: string | undefined): Province {
  if (province === 'Jujuy' || province === 'Otra') {
    return province;
  }

  throw new HttpError('Selecciona una provincia válida.', 400);
}

function normalizeSchoolMembership(value: string | undefined): SchoolMembership {
  if (value === 'jujuy_school' || value === 'no_jujuy_school') {
    return value;
  }

  throw new HttpError('Selecciona la relación con una institución educativa.', 400);
}

function normalizeBirthDate(value: string | undefined): string {
  const birthDate = value?.trim() ?? '';

  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    throw new HttpError('La fecha de nacimiento es obligatoria.', 400);
  }

  const parsedDate = new Date(`${birthDate}T00:00:00.000Z`);

  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== birthDate) {
    throw new HttpError('La fecha de nacimiento no es válida.', 400);
  }

  if (birthDate > getTodayInArgentina()) {
    throw new HttpError('La fecha de nacimiento no puede ser futura.', 400);
  }

  return birthDate;
}

function normalizeHabitValues(value: unknown, label: string): readonly string[] {
  if (!Array.isArray(value)) {
    throw new HttpError(`Selecciona una opción de ${label}.`, 400);
  }

  const values = [...new Set(value.filter((item): item is string => typeof item === 'string'))];
  const allowedValues = new Set(['school', 'home', 'none']);

  if (values.length === 0 || values.some((item) => !allowedValues.has(item))) {
    throw new HttpError(`Selecciona una opción válida de ${label}.`, 400);
  }

  if (values.includes('none') && values.length > 1) {
    throw new HttpError(`No combines "No" con otras opciones de ${label}.`, 400);
  }

  return values;
}

function isEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getTodayInArgentina(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
  }).formatToParts();
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
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
