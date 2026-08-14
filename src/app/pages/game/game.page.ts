import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { GameCanvasComponent } from '../../components/game-canvas/game-canvas.component';
import { findStageById } from '../../core/app-content';
import { GameProgressService } from '../../core/game-progress.service';
import { StageResult } from '../../core/app.models';

@Component({
  selector: 'app-game-page',
  imports: [GameCanvasComponent, RouterLink],
  templateUrl: './game.page.html',
  styleUrl: './game.page.scss'
})
export class GamePage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly progress = inject(GameProgressService);
  private readonly stageId = signal(this.route.snapshot.paramMap.get('stageId'));
  private routeSub?: Subscription;

  readonly stage = computed(() => findStageById(this.stageId()));
  readonly savedScore = computed(() => this.progress.stageScore(this.stage().id));
  readonly lastResult = signal<StageResult | null>(null);

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe((params) => {
      this.stageId.set(params.get('stageId'));
      this.lastResult.set(null);
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  saveResult(result: StageResult): void {
    void this.progress.recordResult(result);
    this.lastResult.set(result);
  }
}
