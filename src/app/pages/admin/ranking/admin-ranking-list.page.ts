import { Component, computed, inject, signal } from '@angular/core';

import { GameProgressService } from '../../../core/game-progress.service';
import { AdminPaginationComponent } from '../admin-pagination.component';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-admin-ranking-list-page',
  imports: [AdminPaginationComponent],
  templateUrl: './admin-ranking-list.page.html',
  styleUrl: '../admin-entity.page.scss',
})
export class AdminRankingListPage {
  readonly progress = inject(GameProgressService);
  readonly page = signal(1);
  readonly pageSize = PAGE_SIZE;
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly total = computed(() => this.progress.leaderboard().length);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));
  readonly rows = computed(() => {
    const from = (this.page() - 1) * this.pageSize;
    return this.progress.leaderboard().slice(from, from + this.pageSize);
  });

  constructor() {
    void this.reload();
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      await this.progress.refresh();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No pudimos cargar el ranking.');
    } finally {
      this.loading.set(false);
    }
  }

  goToPage(page: number): void {
    this.page.set(Math.min(Math.max(1, page), this.totalPages()));
  }
}
