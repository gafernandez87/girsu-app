import { inject, Injectable } from '@angular/core';

import { GAME_STAGES } from './app-content';
import { UserProfile } from './app.models';
import { clampStageScore } from './scoring';
import { SupabaseService } from './supabase.service';
import {
  GameResultInsert,
  GameResultRow,
  GameResultUpdate,
  ProfileRow,
  ProfileUpdate,
} from './supabase.types';

export type AdminUserUpdate = Pick<UserProfile, 'course' | 'isActive' | 'name' | 'role' | 'school'>;

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

export interface AdminUserCreateInput extends AdminUserUpdate {
  readonly email: string;
  readonly password: string;
}

export interface AdminUserEditInput extends AdminUserUpdate {
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

interface AdminUserFunctionResponse {
  readonly user: ProfileRow;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly profileSelect = 'id, email, name, role, school, course, is_active, created_at, updated_at';

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
      course: input.course.trim(),
      email: input.email.trim().toLowerCase(),
      isActive: input.isActive,
      name: input.name.trim(),
      password: input.password,
      role: input.role,
      school: input.school.trim(),
    });

    return this.mapProfile(response.user);
  }

  async updateUserFull(id: string, update: AdminUserEditInput): Promise<UserProfile> {
    const response = await this.invokeAdminUsers<AdminUserFunctionResponse>('update', {
      course: update.course.trim(),
      email: update.email.trim().toLowerCase(),
      id,
      isActive: update.isActive,
      name: update.name.trim(),
      password: update.password?.trim() || undefined,
      role: update.role,
      school: update.school.trim(),
    });

    return this.mapProfile(response.user);
  }

  async deleteUser(id: string): Promise<void> {
    await this.invokeAdminUsers('delete', { id });
  }

  async updateUser(id: string, update: AdminUserUpdate): Promise<UserProfile> {
    const payload: ProfileUpdate = {
      course: update.course.trim(),
      is_active: update.isActive,
      name: update.name.trim(),
      role: update.role,
      school: update.school.trim(),
    };

    const { data, error } = await this.supabase
      .from('profiles')
      .update(payload)
      .eq('id', id)
      .select('id, email, name, role, school, course, is_active, created_at, updated_at')
      .single();

    if (error) {
      throw error;
    }

    return this.mapProfile(data);
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
      throw new Error(
        'No pudimos completar la operacion de usuarios. Verifica que la Edge Function admin-users este desplegada.',
      );
    }

    return data as T;
  }

  private mapProfile(row: ProfileRow): UserProfile {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      school: row.school,
      course: row.course,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
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
