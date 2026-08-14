import { computed, effect, inject, Injectable, signal } from '@angular/core';

import { AuthService } from './auth.service';
import { LeaderboardEntry, StageResult, StageScoreBreakdownItem } from './app.models';
import { clampStageScore } from './scoring';
import { SupabaseService } from './supabase.service';
import { GameResultRow, Json, LeaderboardRow } from './supabase.types';

@Injectable({
  providedIn: 'root',
})
export class GameProgressService {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService).client;
  private readonly resultsByStage = signal<Record<string, StageResult>>({});
  private readonly leaderboardEntries = signal<readonly LeaderboardEntry[]>([]);
  private loadRunId = 0;

  readonly results = this.resultsByStage.asReadonly();
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly totalScore = computed(() =>
    Object.values(this.resultsByStage()).reduce((total, result) => total + result.score, 0),
  );

  readonly completedStages = computed(() => Object.keys(this.resultsByStage()).length);

  readonly leaderboard = computed<LeaderboardEntry[]>(() => {
    const currentUserId = this.auth.profile()?.id;

    return this.leaderboardEntries().map((entry) => ({
      ...entry,
      isCurrentUser: entry.userId === currentUserId,
    }));
  });

  constructor() {
    effect(() => {
      const profile = this.auth.profile();

      if (!profile) {
        this.resultsByStage.set({});
        this.leaderboardEntries.set([]);
        return;
      }

      void this.refresh();
    });
  }

  async refresh(): Promise<void> {
    const profile = this.auth.profile();

    if (!profile) {
      return;
    }

    const runId = ++this.loadRunId;
    this.loading.set(true);
    this.error.set(null);

    try {
      await Promise.all([this.loadResults(profile.id, runId), this.loadLeaderboard(runId)]);
    } finally {
      if (this.loadRunId === runId) {
        this.loading.set(false);
      }
    }
  }

  async recordResult(result: StageResult): Promise<void> {
    const profile = this.auth.profile();

    if (!profile) {
      this.error.set('Inicia sesion para guardar tus puntos.');
      return;
    }

    const normalizedResult = this.normalizeResult(result);

    if (this.resultsByStage()[normalizedResult.stageId]) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const { error } = await this.supabase.from('game_results').insert({
      completed_at: normalizedResult.completedAt,
      correct: normalizedResult.correct,
      mistakes: normalizedResult.mistakes,
      raw_score: normalizedResult.rawScore ?? normalizedResult.score,
      remaining_seconds: normalizedResult.remainingSeconds,
      score: normalizedResult.score,
      score_breakdown: this.toJson(normalizedResult.scoreBreakdown ?? []),
      stage_id: normalizedResult.stageId,
      user_id: profile.id,
    });

    this.saving.set(false);

    if (error) {
      if (this.isFirstResultConflict(error)) {
        await this.loadResults(profile.id, ++this.loadRunId);
        return;
      }

      this.error.set(error.message);
      return;
    }

    this.mergeSavedResult(normalizedResult);
    await this.loadLeaderboard(++this.loadRunId);
  }

  stageScore(stageId: string): number {
    return this.resultsByStage()[stageId]?.score ?? 0;
  }

  private async loadResults(userId: string, runId: number): Promise<void> {
    const { data, error } = await this.supabase
      .from('game_results')
      .select(
        'id, user_id, stage_id, score, raw_score, score_breakdown, correct, mistakes, remaining_seconds, completed_at, created_at',
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (this.loadRunId !== runId) {
      return;
    }

    if (error) {
      this.error.set(error.message);
      this.resultsByStage.set({});
      return;
    }

    const firstResults = (data ?? []).reduce<Record<string, StageResult>>((accumulator, row) => {
      const result = this.mapResult(row);

      if (!accumulator[result.stageId]) {
        accumulator[result.stageId] = result;
      }

      return accumulator;
    }, {});

    this.resultsByStage.set(firstResults);
  }

  private async loadLeaderboard(runId: number): Promise<void> {
    const { data, error } = await this.supabase
      .from('leaderboard')
      .select('position, user_id, name, school, course, score, completed_stages, last_played_at')
      .order('position', { ascending: true })
      .limit(50);

    if (this.loadRunId !== runId) {
      return;
    }

    if (error) {
      this.error.set(error.message);
      this.leaderboardEntries.set([]);
      return;
    }

    this.leaderboardEntries.set((data ?? []).map((entry) => this.mapLeaderboardEntry(entry)));
  }

  private mergeSavedResult(result: StageResult): void {
    const nextResults = {
      ...this.resultsByStage(),
      [result.stageId]: result,
    };

    this.resultsByStage.set(nextResults);
  }

  private normalizeResult(result: StageResult): StageResult {
    return {
      ...result,
      score: clampStageScore(result.score),
    };
  }

  private mapResult(row: GameResultRow): StageResult {
    return {
      stageId: row.stage_id,
      score: clampStageScore(row.score),
      rawScore: row.raw_score ?? undefined,
      scoreBreakdown: this.mapScoreBreakdown(row.score_breakdown),
      correct: row.correct,
      mistakes: row.mistakes,
      remainingSeconds: row.remaining_seconds,
      completedAt: row.completed_at,
    };
  }

  private mapLeaderboardEntry(row: LeaderboardRow): LeaderboardEntry {
    return {
      position: row.position ?? 0,
      userId: row.user_id ?? '',
      name: row.name ?? 'Participante',
      school: row.school ?? '',
      course: row.course ?? '',
      score: row.score ?? 0,
      completedStages: row.completed_stages ?? 0,
      lastPlayedAt: row.last_played_at,
    };
  }

  private mapScoreBreakdown(value: Json): readonly StageScoreBreakdownItem[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((item): item is Record<string, Json> => Boolean(item) && typeof item === 'object')
      .map((item) => ({
        id: String(item['id'] ?? ''),
        label: String(item['label'] ?? ''),
        score: Number(item['score'] ?? 0),
      }))
      .filter((item) => item.id && item.label);
  }

  private isFirstResultConflict(error: { readonly code?: string; readonly message?: string }): boolean {
    return error.code === '23505' || Boolean(error.message?.toLowerCase().includes('duplicate key'));
  }

  private toJson(value: readonly StageScoreBreakdownItem[]): Json {
    return value.map((item) => ({
      id: item.id,
      label: item.label,
      score: item.score,
    }));
  }
}
