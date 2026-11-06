import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { GameProgressService } from '../../core/game-progress.service';

@Component({
  selector: 'app-ranking-page',
  imports: [RouterLink],
  templateUrl: './ranking.page.html',
  styleUrl: './ranking.page.scss',
})
export class RankingPage {
  readonly progress = inject(GameProgressService);
  readonly currentEntry = computed(() =>
    this.progress.leaderboard().find((entry) => entry.isCurrentUser),
  );
  readonly representedSchoolsCount = computed(
    () => new Set(this.progress.leaderboard().map((entry) => entry.schoolId ?? entry.school).filter(Boolean)).size,
  );

  constructor() {
    void this.progress.refresh();
  }
}
