import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AdminService, AdminUserStats } from '../../core/admin.service';
import { GameProgressService } from '../../core/game-progress.service';

@Component({
  selector: 'app-admin-page',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin.page.html',
  styleUrl: './admin.page.scss',
})
export class AdminPage {
  private readonly admin = inject(AdminService);
  readonly progress = inject(GameProgressService);

  readonly loading = signal(false);
  readonly stats = signal<AdminUserStats>({ active: 0, admins: 0, inactive: 0, total: 0 });
  readonly scoreCount = signal(0);
  readonly rankingCount = computed(() => this.progress.leaderboard().length);

  constructor() {
    void this.reloadSummary();
  }

  async reloadSummary(): Promise<void> {
    this.loading.set(true);

    try {
      const [stats, scoreCount] = await Promise.all([
        this.admin.getUserStats(),
        this.admin.countGameScores(),
        this.progress.refresh(),
      ]);
      this.stats.set(stats);
      this.scoreCount.set(scoreCount);
    } finally {
      this.loading.set(false);
    }
  }
}
