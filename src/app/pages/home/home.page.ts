import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CURRENT_USER, GAME_STAGES } from '../../core/app-content';
import { GameProgressService } from '../../core/game-progress.service';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss'
})
export class HomePage {
  private readonly progress = inject(GameProgressService);

  readonly user = CURRENT_USER;
  readonly stages = GAME_STAGES;
  readonly totalScore = this.progress.totalScore;
  readonly completedStages = this.progress.completedStages;
  readonly leaderboard = this.progress.leaderboard;
  readonly progressPercent = computed(() => Math.round((this.completedStages() / this.stages.length) * 100));

  stageScore(stageId: string): number {
    return this.progress.stageScore(stageId);
  }
}

