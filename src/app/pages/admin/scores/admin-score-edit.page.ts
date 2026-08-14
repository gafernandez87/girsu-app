import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AdminGameScore, AdminService } from '../../../core/admin.service';

@Component({
  selector: 'app-admin-score-edit-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-score-edit.page.html',
  styleUrl: '../admin-entity.page.scss',
})
export class AdminScoreEditPage {
  private readonly admin = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly scoreId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly deleting = signal(false);
  readonly error = signal<string | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly scoreRecord = signal<AdminGameScore | null>(null);
  readonly success = signal<string | null>(null);

  completedAt = '';
  correct = 0;
  mistakes = 0;
  remainingSeconds = 0;
  score = 0;

  constructor() {
    void this.loadScore();
  }

  async loadScore(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const scoreRecord = await this.admin.getGameScore(this.scoreId);
      this.scoreRecord.set(scoreRecord);
      this.completedAt = this.toDatetimeLocal(scoreRecord.completedAt);
      this.correct = scoreRecord.correct;
      this.mistakes = scoreRecord.mistakes;
      this.remainingSeconds = scoreRecord.remainingSeconds;
      this.score = scoreRecord.score;
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No pudimos cargar el puntaje.');
    } finally {
      this.loading.set(false);
    }
  }

  async submit(): Promise<void> {
    if (this.saving()) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);

    try {
      const scoreRecord = await this.admin.updateGameScore(this.scoreId, {
        completedAt: this.fromDatetimeLocal(this.completedAt),
        correct: this.correct,
        mistakes: this.mistakes,
        remainingSeconds: this.remainingSeconds,
        score: this.score,
      });
      this.scoreRecord.set(scoreRecord);
      this.completedAt = this.toDatetimeLocal(scoreRecord.completedAt);
      this.correct = scoreRecord.correct;
      this.mistakes = scoreRecord.mistakes;
      this.remainingSeconds = scoreRecord.remainingSeconds;
      this.score = scoreRecord.score;
      this.success.set('Puntaje actualizado.');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No pudimos guardar el puntaje.');
    } finally {
      this.saving.set(false);
    }
  }

  async deleteScore(): Promise<void> {
    if (this.deleting() || !confirm('Seguro que queres eliminar este puntaje?')) {
      return;
    }

    this.deleting.set(true);
    this.error.set(null);

    try {
      await this.admin.deleteGameScore(this.scoreId);
      await this.router.navigate(['/admin/puntos']);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No pudimos eliminar el puntaje.');
    } finally {
      this.deleting.set(false);
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
