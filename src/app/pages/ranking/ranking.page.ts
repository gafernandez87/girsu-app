import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { GameProgressService } from '../../core/game-progress.service';
import { SchoolService } from '../../core/school.service';

@Component({
  selector: 'app-ranking-page',
  imports: [RouterLink],
  templateUrl: './ranking.page.html',
  styleUrl: './ranking.page.scss',
})
export class RankingPage {
  readonly progress = inject(GameProgressService);
  private readonly schoolService = inject(SchoolService);

  readonly officialSchoolsCount = signal(0);
  readonly representedSchoolsCount = computed(
    () => new Set(this.progress.leaderboard().map((entry) => entry.schoolId ?? entry.school).filter(Boolean)).size,
  );

  constructor() {
    void this.progress.refresh();
    void this.loadOfficialSchoolCount();
  }

  private async loadOfficialSchoolCount(): Promise<void> {
    try {
      this.officialSchoolsCount.set(await this.schoolService.countActiveSchools());
    } catch {
      this.officialSchoolsCount.set(0);
    }
  }
}
