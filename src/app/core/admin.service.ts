import { inject, Injectable } from '@angular/core';
import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from '@supabase/supabase-js';

import { GAME_STAGES } from './app-content';
import { LocalitySource, School, UserProfile } from './app.models';
import { clampStageScore } from './scoring';
import { SupabaseService } from './supabase.service';
import {
  GameResultInsert,
  GameResultRow,
  GameResultUpdate,
  ProfileRow,
  SchoolInsert,
  SchoolRow,
  SchoolUpdate,
} from './supabase.types';

export interface AdminUserProfileInput {
  readonly birthDate: string;
  readonly composting: readonly string[];
  readonly course: string;
  readonly isActive: boolean;
  readonly locality: string;
  readonly localityId?: string;
  readonly localitySource: Exclude<LocalitySource, 'legacy'>;
  readonly name: string;
  readonly province: 'Jujuy' | 'Otra';
  readonly role: UserProfile['role'];
  readonly schoolId?: string;
  readonly schoolMembership: 'jujuy_school' | 'no_jujuy_school';
  readonly schoolRole: string;
  readonly wasteSeparation: readonly string[];
}

export interface AdminListPage<T> {
  readonly rows: readonly T[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
}

export interface AdminUserStats {
  readonly active: number;
  readonly admins: number;
  readonly inactive: number;
  readonly total: number;
}

export type AdminSchoolStatusFilter = 'active' | 'all' | 'inactive';

export interface AdminUserCreateInput extends AdminUserProfileInput {
  readonly email: string;
  readonly password: string;
}

export interface AdminUserEditInput extends AdminUserProfileInput {
  readonly email: string;
  readonly password?: string;
}

export interface AdminGameScore {
  readonly id: string;
  readonly userId: string;
  readonly userName: string;
  readonly userEmail: string;
  readonly school: string;
  readonly course: string;
  readonly stageId: string;
  readonly stageTitle: string;
  readonly score: number;
  readonly rawScore?: number;
  readonly correct: number;
  readonly mistakes: number;
  readonly remainingSeconds: number;
  readonly completedAt: string;
  readonly createdAt: string;
}

export interface AdminGameScoreCreateInput {
  readonly userId: string;
  readonly stageId: string;
  readonly score: number;
  readonly correct: number;
  readonly mistakes: number;
  readonly remainingSeconds: number;
  readonly completedAt: string;
}

export type AdminGameScoreEditInput = Pick<
  AdminGameScoreCreateInput,
  'completedAt' | 'correct' | 'mistakes' | 'remainingSeconds' | 'score'
>;

export type AdminSchoolCreateInput = Omit<School, 'createdAt' | 'id' | 'updatedAt'>;
export type AdminSchoolEditInput = Omit<School, 'createdAt' | 'id' | 'updatedAt'>;

interface AdminUserFunctionResponse {
  readonly user: ProfileRow;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly largePageSize = 1000;
  private readonly supabase = inject(SupabaseService).client;
  private readonly profileSelect =
    'id, email, name, role, birth_date, province, locality, locality_id, locality_source, school_id, school_membership, school_role, school, course, waste_separation, composting, is_active, created_at, updated_at';
  private readonly schoolSelect =
    'id, source_code, name, street, street_number, neighborhood, locality, department, phone, region, sector, scope, category, permanence, operating_period, email, is_active, created_at, updated_at';

  async listUsers(): Promise<readonly UserProfile[]> {
    const page = await this.listUsersPage({ page: 1, pageSize: 500 });
    return page.rows;
  }

  async listUsersPage(input: {
    readonly page: number;
    readonly pageSize: number;
  }): Promise<AdminListPage<UserProfile>> {
    const page = Math.max(1, input.page);
    const pageSize = Math.max(1, input.pageSize);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { count, data, error } = await this.supabase
      .from('profiles')
      .select(this.profileSelect, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw error;
    }

    return {
      rows: (data ?? []).map((row) => this.mapProfile(row)),
      page,
      pageSize,
      total: count ?? 0,
    };
  }

  async getUser(id: string): Promise<UserProfile> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select(this.profileSelect)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return this.mapProfile(data);
  }

  async getUserStats(): Promise<AdminUserStats> {
    const [total, active, inactive, admins] = await Promise.all([
      this.countProfiles(),
      this.countProfiles({ isActive: true }),
      this.countProfiles({ isActive: false }),
      this.countProfiles({ role: 'admin' }),
    ]);

    return { active, admins, inactive, total };
  }

  async createUser(input: AdminUserCreateInput): Promise<UserProfile> {
    const response = await this.invokeAdminUsers<AdminUserFunctionResponse>('create', {
      birthDate: input.birthDate,
      composting: [...input.composting],
      course: input.course.trim(),
      email: input.email.trim().toLowerCase(),
      isActive: input.isActive,
      locality: input.locality.trim(),
      localityId: input.localityId ?? '',
      localitySource: input.localitySource,
      name: input.name.trim(),
      password: input.password,
      province: input.province,
      role: input.role,
      schoolId: input.schoolId,
      schoolMembership: input.schoolMembership,
      schoolRole: input.schoolRole,
      wasteSeparation: [...input.wasteSeparation],
    });

    return this.mapProfile(response.user);
  }

  async updateUser(id: string, update: AdminUserEditInput): Promise<UserProfile> {
    const response = await this.invokeAdminUsers<AdminUserFunctionResponse>('update', {
      birthDate: update.birthDate,
      composting: [...update.composting],
      course: update.course.trim(),
      email: update.email.trim().toLowerCase(),
      id,
      isActive: update.isActive,
      locality: update.locality.trim(),
      localityId: update.localityId ?? '',
      localitySource: update.localitySource,
      name: update.name.trim(),
      password: update.password?.trim() || undefined,
      province: update.province,
      role: update.role,
      schoolId: update.schoolId,
      schoolMembership: update.schoolMembership,
      schoolRole: update.schoolRole,
      wasteSeparation: [...update.wasteSeparation],
    });

    return this.mapProfile(response.user);
  }

  async deleteUser(id: string): Promise<void> {
    await this.invokeAdminUsers('delete', { id });
  }

  async listSchools(): Promise<readonly School[]> {
    const schools: School[] = [];
    let total = Number.POSITIVE_INFINITY;

    while (schools.length < total) {
      const from = schools.length;
      const to = from + this.largePageSize - 1;
      const { count, data, error } = await this.supabase
        .from('schools')
        .select(this.schoolSelect, { count: 'exact' })
        .order('name', { ascending: true })
        .range(from, to);

      if (error) {
        throw error;
      }

      const page = (data ?? []).map((row) => this.mapSchool(row));
      schools.push(...page);
      total = count ?? schools.length;

      if (page.length === 0) {
        break;
      }
    }

    return schools;
  }

  async listSchoolsPage(input: {
    readonly page: number;
    readonly pageSize: number;
    readonly search?: string;
    readonly status?: AdminSchoolStatusFilter;
  }): Promise<AdminListPage<School>> {
    const page = Math.max(1, input.page);
    const pageSize = Math.max(1, input.pageSize);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const search = input.search?.trim();
    const status = input.status ?? 'all';

    let query = this.supabase
      .from('schools')
      .select(this.schoolSelect, { count: 'exact' })
      .order('name', { ascending: true });

    if (search) {
      const pattern = `%${search.replaceAll(',', ' ')}%`;
      query = query.or(
        `name.ilike.${pattern},source_code.ilike.${pattern},locality.ilike.${pattern},department.ilike.${pattern}`,
      );
    }

    if (status !== 'all') {
      query = query.eq('is_active', status === 'active');
    }

    const { count, data, error } = await query.range(from, to);

    if (error) {
      throw error;
    }

    return {
      rows: (data ?? []).map((row) => this.mapSchool(row)),
      page,
      pageSize,
      total: count ?? 0,
    };
  }

  async getSchool(id: string): Promise<School> {
    const { data, error } = await this.supabase
      .from('schools')
      .select(this.schoolSelect)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return this.mapSchool(data);
  }

  async createSchool(input: AdminSchoolCreateInput): Promise<School> {
    const { data, error } = await this.supabase
      .from('schools')
      .insert(this.toSchoolInsert(input))
      .select(this.schoolSelect)
      .single();

    if (error) {
      throw error;
    }

    return this.mapSchool(data);
  }

  async updateSchool(id: string, input: AdminSchoolEditInput): Promise<School> {
    const { data, error } = await this.supabase
      .from('schools')
      .update(this.toSchoolUpdate(input))
      .eq('id', id)
      .select(this.schoolSelect)
      .single();

    if (error) {
      throw error;
    }

    return this.mapSchool(data);
  }

  async deleteSchool(id: string): Promise<void> {
    const { error } = await this.supabase.from('schools').delete().eq('id', id);

    if (error) {
      throw error;
    }
  }

  async countSchools(): Promise<number> {
    const { count, error } = await this.supabase
      .from('schools')
      .select('id', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  async listGameScoresPage(input: {
    readonly page: number;
    readonly pageSize: number;
  }): Promise<AdminListPage<AdminGameScore>> {
    const page = Math.max(1, input.page);
    const pageSize = Math.max(1, input.pageSize);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { count, data, error } = await this.supabase
      .from('game_results')
      .select(
        'id, user_id, stage_id, score, raw_score, score_breakdown, correct, mistakes, remaining_seconds, completed_at, created_at',
        { count: 'exact' },
      )
      .order('completed_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw error;
    }

    return {
      rows: await this.mapGameScores(data ?? []),
      page,
      pageSize,
      total: count ?? 0,
    };
  }

  async getGameScore(id: string): Promise<AdminGameScore> {
    const { data, error } = await this.supabase
      .from('game_results')
      .select(
        'id, user_id, stage_id, score, raw_score, score_breakdown, correct, mistakes, remaining_seconds, completed_at, created_at',
      )
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    const [score] = await this.mapGameScores([data]);
    return score;
  }

  async createGameScore(input: AdminGameScoreCreateInput): Promise<AdminGameScore> {
    const score = clampStageScore(input.score);
    const payload: GameResultInsert = {
      completed_at: input.completedAt,
      correct: Math.max(0, Math.round(input.correct)),
      mistakes: Math.max(0, Math.round(input.mistakes)),
      raw_score: score,
      remaining_seconds: Math.max(0, Math.round(input.remainingSeconds)),
      score,
      score_breakdown: [],
      stage_id: input.stageId,
      user_id: input.userId,
    };

    const { data, error } = await this.supabase
      .from('game_results')
      .insert(payload)
      .select(
        'id, user_id, stage_id, score, raw_score, score_breakdown, correct, mistakes, remaining_seconds, completed_at, created_at',
      )
      .single();

    if (error) {
      throw error;
    }

    const [createdScore] = await this.mapGameScores([data]);
    return createdScore;
  }

  async updateGameScore(id: string, input: AdminGameScoreEditInput): Promise<AdminGameScore> {
    const payload: GameResultUpdate = {
      completed_at: input.completedAt,
      correct: Math.max(0, Math.round(input.correct)),
      mistakes: Math.max(0, Math.round(input.mistakes)),
      remaining_seconds: Math.max(0, Math.round(input.remainingSeconds)),
      score: clampStageScore(input.score),
    };

    const { data, error } = await this.supabase
      .from('game_results')
      .update(payload)
      .eq('id', id)
      .select(
        'id, user_id, stage_id, score, raw_score, score_breakdown, correct, mistakes, remaining_seconds, completed_at, created_at',
      )
      .single();

    if (error) {
      throw error;
    }

    const [updatedScore] = await this.mapGameScores([data]);
    return updatedScore;
  }

  async deleteGameScore(id: string): Promise<void> {
    const { error } = await this.supabase.from('game_results').delete().eq('id', id);

    if (error) {
      throw error;
    }
  }

  async countGameScores(): Promise<number> {
    const { count, error } = await this.supabase
      .from('game_results')
      .select('id', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  private async countProfiles(filter?: {
    readonly isActive?: boolean;
    readonly role?: UserProfile['role'];
  }): Promise<number> {
    let query = this.supabase.from('profiles').select('id', { count: 'exact', head: true });

    if (typeof filter?.isActive === 'boolean') {
      query = query.eq('is_active', filter.isActive);
    }

    if (filter?.role) {
      query = query.eq('role', filter.role);
    }

    const { count, error } = await query;

    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  private async invokeAdminUsers<T = unknown>(action: string, payload: Record<string, unknown>): Promise<T> {
    const { data, error } = await this.supabase.functions.invoke<T>('admin-users', {
      body: { action, payload },
    });

    if (error) {
      throw new Error(await this.getAdminUsersFunctionErrorMessage(error));
    }

    return data as T;
  }

  private async getAdminUsersFunctionErrorMessage(error: unknown): Promise<string> {
    if (error instanceof FunctionsHttpError) {
      const response = error.context as Response;

      try {
        const body = (await response.clone().json()) as { readonly message?: string };
        return body.message ?? `La funcion admin-users respondio con error ${response.status}.`;
      } catch {
        return `La funcion admin-users respondio con error ${response.status}.`;
      }
    }

    if (error instanceof FunctionsRelayError) {
      return 'Supabase no pudo ejecutar la funcion admin-users. Verifica que este desplegada y revisa sus logs.';
    }

    if (error instanceof FunctionsFetchError) {
      return 'No pudimos conectar con la funcion admin-users. Si Chrome muestra CORS, suele indicar que la funcion no esta desplegada, fallo antes de responder o el gateway la rechazo.';
    }

    return error instanceof Error
      ? error.message
      : 'No pudimos completar la operacion de usuarios. Verifica que la Edge Function admin-users este desplegada.';
  }

  private mapProfile(row: ProfileRow): UserProfile {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      birthDate: row.birth_date,
      province: row.province,
      locality: row.locality,
      localityId: row.locality_id,
      localitySource: row.locality_source,
      schoolId: row.school_id,
      schoolMembership: row.school_membership,
      schoolRole: row.school_role,
      school: row.school,
      course: row.course,
      wasteSeparation: row.waste_separation,
      composting: row.composting,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapSchool(row: SchoolRow): School {
    return {
      id: row.id,
      sourceCode: row.source_code,
      name: row.name,
      street: row.street,
      streetNumber: row.street_number,
      neighborhood: row.neighborhood,
      locality: row.locality,
      department: row.department,
      phone: row.phone,
      region: row.region,
      sector: row.sector,
      scope: row.scope,
      category: row.category,
      permanence: row.permanence,
      operatingPeriod: row.operating_period,
      email: row.email,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private toSchoolInsert(input: AdminSchoolCreateInput): SchoolInsert {
    return {
      category: input.category.trim(),
      department: input.department.trim(),
      email: input.email.trim().toLowerCase(),
      is_active: input.isActive,
      locality: input.locality.trim(),
      name: input.name.trim(),
      neighborhood: input.neighborhood.trim(),
      operating_period: input.operatingPeriod.trim(),
      permanence: input.permanence.trim(),
      phone: input.phone.trim(),
      region: input.region.trim(),
      scope: input.scope.trim(),
      sector: input.sector.trim(),
      source_code: input.sourceCode.trim(),
      street: input.street.trim(),
      street_number: input.streetNumber.trim(),
    };
  }

  private toSchoolUpdate(input: AdminSchoolEditInput): SchoolUpdate {
    return this.toSchoolInsert(input);
  }

  private async mapGameScores(rows: readonly GameResultRow[]): Promise<readonly AdminGameScore[]> {
    const profiles = await this.loadProfilesById(rows.map((row) => row.user_id));

    return rows.map((row) => {
      const profile = profiles.get(row.user_id);
      const stage = GAME_STAGES.find((gameStage) => gameStage.id === row.stage_id);

      return {
        id: row.id,
        userId: row.user_id,
        userName: profile?.name ?? 'Participante',
        userEmail: profile?.email ?? '',
        school: profile?.school ?? '',
        course: profile?.course ?? '',
        stageId: row.stage_id,
        stageTitle: stage?.title ?? row.stage_id,
        score: row.score,
        rawScore: row.raw_score ?? undefined,
        correct: row.correct,
        mistakes: row.mistakes,
        remainingSeconds: row.remaining_seconds,
        completedAt: row.completed_at,
        createdAt: row.created_at,
      };
    });
  }

  private async loadProfilesById(userIds: readonly string[]): Promise<ReadonlyMap<string, UserProfile>> {
    const uniqueUserIds = [...new Set(userIds)];

    if (uniqueUserIds.length === 0) {
      return new Map();
    }

    const { data, error } = await this.supabase
      .from('profiles')
      .select(this.profileSelect)
      .in('id', uniqueUserIds);

    if (error) {
      throw error;
    }

    return new Map((data ?? []).map((row) => [row.id, this.mapProfile(row)]));
  }
}
