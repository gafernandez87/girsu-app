import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { GameProgressService } from '../../core/game-progress.service';

@Component({
  selector: 'app-ranking-page',
  imports: [RouterLink],
  templateUrl: './ranking.page.html',
  styleUrl: './ranking.page.scss',
})
export class RankingPage {
  readonly progress = inject(GameProgressService);

  constructor() {
    void this.progress.refresh();
  }
}
