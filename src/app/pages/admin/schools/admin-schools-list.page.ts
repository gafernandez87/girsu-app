import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AdminListPage, AdminSchoolStatusFilter, AdminService } from '../../../core/admin.service';
import { School } from '../../../core/app.models';
import { AdminPaginationComponent } from '../admin-pagination.component';

const PAGE_SIZE = 50;

@Component({
  selector: 'app-admin-schools-list-page',
  imports: [AdminPaginationComponent, FormsModule, RouterLink],
  templateUrl: './admin-schools-list.page.html',
  styleUrl: '../admin-entity.page.scss',
})
export class AdminSchoolsListPage {
  private readonly admin = inject(AdminService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly result = signal<AdminListPage<School>>({
    page: 1,
    pageSize: PAGE_SIZE,
    rows: [],
    total: 0,
  });
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.result().total / this.result().pageSize)),
  );

  search = '';
  status: AdminSchoolStatusFilter = 'all';

  constructor() {
    void this.loadPage(1);
  }

  applyFilters(): void {
    void this.loadPage(1);
  }

  clearFilters(): void {
    this.search = '';
    this.status = 'all';
    void this.loadPage(1);
  }

  async loadPage(page: number): Promise<void> {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      this.result.set(
        await this.admin.listSchoolsPage({
          page,
          pageSize: PAGE_SIZE,
          search: this.search,
          status: this.status,
        }),
      );
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No pudimos cargar escuelas.');
    } finally {
      this.loading.set(false);
    }
  }
}
