import { Component, EventEmitter, Input, Output } from '@angular/core';

type PageItem =
  | {
      readonly key: string;
      readonly page: number;
      readonly type: 'page';
    }
  | {
      readonly key: string;
      readonly type: 'ellipsis';
    };

@Component({
  selector: 'app-admin-pagination',
  template: `
    @if (totalPages > 1) {
      <nav class="admin-pagination" aria-label="Paginacion">
        <button
          class="page-button page-button--arrow"
          type="button"
          aria-label="Pagina anterior"
          [disabled]="loading || currentPage <= 1"
          (click)="goToPage(currentPage - 1)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        @for (item of pageItems; track item.key) {
          @if (item.type === 'ellipsis') {
            <span class="page-ellipsis" aria-hidden="true">...</span>
          } @else {
            <button
              class="page-button"
              type="button"
              [class.page-button--active]="item.page === currentPage"
              [attr.aria-current]="item.page === currentPage ? 'page' : null"
              [attr.aria-label]="'Pagina ' + item.page"
              [disabled]="loading || item.page === currentPage"
              (click)="goToPage(item.page)"
            >
              {{ item.page }}
            </button>
          }
        }

        <button
          class="page-button page-button--arrow"
          type="button"
          aria-label="Pagina siguiente"
          [disabled]="loading || currentPage >= totalPages"
          (click)="goToPage(currentPage + 1)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </nav>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .admin-pagination {
        display: inline-flex;
        align-items: center;
        gap: 0.28rem;
        max-width: 100%;
        padding: 0.34rem;
        border: 1px solid rgba(61, 43, 29, 0.12);
        border-radius: 999px;
        background: #fffdf7;
        box-shadow: 0 0.7rem 1.6rem rgba(45, 28, 18, 0.08);
      }

      .page-button {
        display: inline-grid;
        width: 2rem;
        height: 2rem;
        border: 0;
        border-radius: 8px;
        place-items: center;
        background: transparent;
        color: #26352c;
        cursor: pointer;
        font-size: 0.82rem;
        font-weight: 900;
      }

      .page-button:not(:disabled):hover,
      .page-button:not(:disabled):focus-visible {
        background: rgba(47, 125, 87, 0.1);
        color: #2f7d57;
        outline: none;
      }

      .page-button--active,
      .page-button--active:disabled {
        background: #2f7d57;
        color: #fffaf0;
        opacity: 1;
      }

      .page-button:disabled {
        cursor: default;
        opacity: 0.42;
      }

      .page-button--active:disabled {
        cursor: default;
      }

      .page-button svg {
        width: 1rem;
        height: 1rem;
        fill: none;
        stroke: currentColor;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-width: 2.35;
      }

      .page-ellipsis {
        display: inline-grid;
        width: 1.45rem;
        height: 2rem;
        place-items: center;
        color: #7a857d;
        font-size: 0.82rem;
        font-weight: 900;
      }

      @media (max-width: 560px) {
        :host {
          width: 100%;
        }

        .admin-pagination {
          overflow-x: auto;
          width: 100%;
          justify-content: center;
        }
      }
    `,
  ],
})
export class AdminPaginationComponent {
  @Input() page = 1;
  @Input() totalPages = 1;
  @Input() loading = false;
  @Output() readonly pageChange = new EventEmitter<number>();

  get currentPage(): number {
    return this.clampPage(this.page);
  }

  get pageItems(): readonly PageItem[] {
    const totalPages = Math.max(1, Math.floor(this.totalPages));
    const currentPage = this.currentPage;

    if (totalPages <= 7) {
      return this.pagesBetween(1, totalPages);
    }

    const visiblePages = new Set<number>([1, totalPages, currentPage]);

    if (currentPage <= 4) {
      this.addRange(visiblePages, 2, 5);
    } else if (currentPage >= totalPages - 3) {
      this.addRange(visiblePages, totalPages - 4, totalPages - 1);
    } else {
      this.addRange(visiblePages, currentPage - 1, currentPage + 1);
    }

    return this.withEllipses([...visiblePages].sort((a, b) => a - b));
  }

  goToPage(page: number): void {
    const nextPage = this.clampPage(page);

    if (this.loading || nextPage === this.currentPage) {
      return;
    }

    this.pageChange.emit(nextPage);
  }

  private addRange(pages: Set<number>, from: number, to: number): void {
    for (let page = from; page <= to; page += 1) {
      if (page >= 1 && page <= this.totalPages) {
        pages.add(page);
      }
    }
  }

  private clampPage(page: number): number {
    return Math.min(Math.max(1, Math.floor(page)), Math.max(1, Math.floor(this.totalPages)));
  }

  private pagesBetween(from: number, to: number): readonly PageItem[] {
    return Array.from({ length: to - from + 1 }, (_, index) => {
      const page = from + index;
      return {
        key: `page-${page}`,
        page,
        type: 'page' as const,
      };
    });
  }

  private withEllipses(pages: readonly number[]): readonly PageItem[] {
    const items: PageItem[] = [];

    for (const page of pages) {
      const previous = items.at(-1);

      if (previous?.type === 'page') {
        const gap = page - previous.page;

        if (gap === 2) {
          items.push({
            key: `page-${page - 1}`,
            page: page - 1,
            type: 'page',
          });
        } else if (gap > 2) {
          items.push({
            key: `ellipsis-${previous.page}-${page}`,
            type: 'ellipsis',
          });
        }
      }

      items.push({
        key: `page-${page}`,
        page,
        type: 'page',
      });
    }

    return items;
  }
}
