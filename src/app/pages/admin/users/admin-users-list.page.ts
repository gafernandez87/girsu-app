import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminListPage, AdminService } from '../../../core/admin.service';
import { UserProfile } from '../../../core/app.models';
import { AdminPaginationComponent } from '../admin-pagination.component';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-admin-users-list-page',
  imports: [AdminPaginationComponent, RouterLink],
  templateUrl: './admin-users-list.page.html',
  styleUrl: '../admin-entity.page.scss',
})
export class AdminUsersListPage {
  private readonly admin = inject(AdminService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly result = signal<AdminListPage<UserProfile>>({
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
      this.result.set(await this.admin.listUsersPage({ page, pageSize: PAGE_SIZE }));
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No pudimos cargar usuarios.');
    } finally {
      this.loading.set(false);
    }
  }
}
