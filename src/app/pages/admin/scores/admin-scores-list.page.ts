import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminGameScore, AdminListPage, AdminService } from '../../../core/admin.service';
import { AdminPaginationComponent } from '../admin-pagination.component';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-admin-scores-list-page',
  imports: [AdminPaginationComponent, DatePipe, RouterLink],
  templateUrl: './admin-scores-list.page.html',
  styleUrl: '../admin-entity.page.scss',
})
export class AdminScoresListPage {
  private readonly admin = inject(AdminService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly result = signal<AdminListPage<AdminGameScore>>({
    page: 1,
    pageSize: PAGE_SIZE,
    rows: [],
    total: 0,
  });
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.result().total / this.result().pageSize)),
  );

  constructor() {
    void this.loadPage(1);
  }

  async loadPage(page: number): Promise<void> {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      this.result.set(await this.admin.listGameScoresPage({ page, pageSize: PAGE_SIZE }));
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No pudimos cargar los puntajes.');
    } finally {
      this.loading.set(false);
    }
  }
}
