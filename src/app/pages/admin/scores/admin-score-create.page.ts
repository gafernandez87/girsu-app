import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AdminService } from '../../../core/admin.service';
import { GAME_STAGES } from '../../../core/app-content';
import { UserProfile } from '../../../core/app.models';

@Component({
  selector: 'app-admin-score-create-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-score-create.page.html',
  styleUrl: '../admin-entity.page.scss',
})
export class AdminScoreCreatePage {
  private readonly admin = inject(AdminService);
  private readonly router = inject(Router);

  readonly stages = GAME_STAGES;
  readonly users = signal<readonly UserProfile[]>([]);
  readonly error = signal<string | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);

  completedAt = this.toDatetimeLocal(new Date().toISOString());
  correct = 0;
  mistakes = 0;
  remainingSeconds = 0;
  score = 0;
  stageId = GAME_STAGES[0]?.id ?? '';
  userId = '';

  constructor() {
    void this.loadUsers();
  }

  async loadUsers(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const users = await this.admin.listUsers();
      this.users.set(users);
      this.userId = users[0]?.id ?? '';
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No pudimos cargar usuarios.');
    } finally {
      this.loading.set(false);
    }
  }

  async submit(): Promise<void> {
    if (this.saving()) {
      return;
    }

    if (!this.userId) {
      this.error.set('Selecciona un usuario para crear el puntaje.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    try {
      const score = await this.admin.createGameScore({
        completedAt: this.fromDatetimeLocal(this.completedAt),
        correct: this.correct,
        mistakes: this.mistakes,
        remainingSeconds: this.remainingSeconds,
        score: this.score,
        stageId: this.stageId,
        userId: this.userId,
      });
      await this.router.navigate(['/admin/puntos', score.id, 'edit']);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No pudimos crear el puntaje.');
    } finally {
      this.saving.set(false);
    }
  }

  private fromDatetimeLocal(value: string): string {
    return new Date(value).toISOString();
  }

  private toDatetimeLocal(value: string): string {
    const date = new Date(value);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return localDate.toISOString().slice(0, 16);
  }
}
