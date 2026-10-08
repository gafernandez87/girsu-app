import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { accountDeletionConfig } from '../../core/account-deletion.config';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-account-deletion-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './account-deletion.page.html',
  styleUrl: './account-deletion.page.scss',
})
export class AccountDeletionPage {
  readonly auth = inject(AuthService);
  readonly config = accountDeletionConfig;
  readonly deleting = signal(false);
  readonly deleted = signal(false);
  readonly error = signal<string | null>(null);
  email = '';
  password = '';
  confirmed = false;

  async submit(): Promise<void> {
    if (this.deleting() || this.deleted() || !this.confirmed || !this.password) return;
    this.deleting.set(true);
    this.error.set(null);
    try {
      await this.auth.deleteAccount(this.password, this.email);
      this.deleted.set(true);
      this.email = '';
      this.confirmed = false;
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'No pudimos confirmar la eliminación.',
      );
    } finally {
      this.password = '';
      this.deleting.set(false);
    }
  }
}
