import { computed, Injectable, signal } from '@angular/core';

import { MOCK_LEADERBOARD } from './app-content';
import { LeaderboardEntry, StageResult } from './app.models';
import { clampStageScore } from './scoring';

const STORAGE_KEY = 'camino-residuos-progress-v2';

@Injectable({
  providedIn: 'root',
})
export class GameProgressService {
  private readonly resultsByStage = signal<Record<string, StageResult>>(this.loadResults());

  readonly results = this.resultsByStage.asReadonly();

  readonly totalScore = computed(() =>
    Object.values(this.resultsByStage()).reduce((total, result) => total + result.score, 0),
  );

  readonly completedStages = computed(() => Object.keys(this.resultsByStage()).length);

  readonly leaderboard = computed<LeaderboardEntry[]>(() => {
    const userScore = this.totalScore();
    const entries = MOCK_LEADERBOARD.map((entry) =>
      entry.isCurrentUser ? { ...entry, score: userScore } : entry,
    )
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ ...entry, position: index + 1 }));

    return entries;
  });

  recordResult(result: StageResult): void {
    const normalizedResult = this.normalizeResult(result);
    const current = this.resultsByStage()[normalizedResult.stageId];

    if (current && current.score >= normalizedResult.score) {
      return;
    }

    const nextResults = {
      ...this.resultsByStage(),
      [normalizedResult.stageId]: normalizedResult,
    };

    this.resultsByStage.set(nextResults);
    this.saveResults(nextResults);
  }

  stageScore(stageId: string): number {
    return this.resultsByStage()[stageId]?.score ?? 0;
  }

  private loadResults(): Record<string, StageResult> {
    if (typeof localStorage === 'undefined') {
      return {};
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? this.normalizeResults(JSON.parse(raw) as Record<string, StageResult>) : {};
    } catch {
      return {};
    }
  }

  private saveResults(results: Record<string, StageResult>): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
  }

  private normalizeResults(results: Record<string, StageResult>): Record<string, StageResult> {
    return Object.fromEntries(
      Object.entries(results).map(([stageId, result]) => [stageId, this.normalizeResult(result)]),
    );
  }

  private normalizeResult(result: StageResult): StageResult {
    return {
      ...result,
      score: clampStageScore(result.score),
    };
  }
}
