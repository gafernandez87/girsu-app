import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CURRENT_USER, GAME_STAGES } from '../../core/app-content';
import { GameProgressService } from '../../core/game-progress.service';

const STAGE_IMAGES: Record<string, string> = {
  'separacion-origen': 'url("/assets/game-1/backgrounds/fondo%20juego%201.png")',
  'valorizacion-industrial': 'url("/assets/game-2/backgrounds/fondo-juego-2.png")',
  'compostaje-domiciliario': 'url("/assets/game-3/backgrounds/fondo-compostera.png")',
  'relleno-sanitario': 'url("/assets/game-4/processed/background/fondo-tetris.png")',
};

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage {
  private readonly progress = inject(GameProgressService);

  readonly user = CURRENT_USER;
  readonly stages = GAME_STAGES;
  readonly totalScore = this.progress.totalScore;
  readonly completedStages = this.progress.completedStages;
  readonly leaderboard = this.progress.leaderboard;
  readonly progressPercent = computed(() =>
    Math.round((this.completedStages() / this.stages.length) * 100),
  );
  readonly nextStage = computed(() =>
    this.stages.find((stage) => !this.progress.results()[stage.id]),
  );
  readonly leaderboardPosition = computed(
    () => this.leaderboard().find((entry) => entry.isCurrentUser)?.position ?? 0,
  );
  readonly totalDurationMinutes = Math.round(
    this.stages.reduce((total, stage) => total + stage.durationSeconds, 0) / 60,
  );

  stageScore(stageId: string): number {
    return this.progress.stageScore(stageId);
  }

  stageCompleted(stageId: string): boolean {
    return Boolean(this.progress.results()[stageId]);
  }

  stageImage(stageId: string): string {
    return STAGE_IMAGES[stageId] ?? STAGE_IMAGES['compostaje-domiciliario'];
  }
}
