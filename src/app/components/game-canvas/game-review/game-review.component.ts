import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { DropZone } from '../../../core/app.models';

export interface GameReviewItem {
  readonly id: string;
  readonly label: string;
  readonly imagePath: string;
  readonly correct?: boolean;
}

export interface GameReviewGroup {
  readonly zone: DropZone;
  readonly items: readonly GameReviewItem[];
}

@Component({
  selector: 'app-game-review',
  imports: [RouterLink],
  templateUrl: './game-review.component.html',
  styleUrl: './game-review.component.scss',
})
export class GameReviewComponent implements AfterViewInit {
  @Input({ required: true }) groups!: readonly GameReviewGroup[];
  @Input() title = '¡Así se separan los residuos!';
  @Input() description = 'Cada residuo aparece en el cesto que le corresponde.';
  @Input({ required: true }) nextStageLink!: string;
  @Input() nextStageLabel = 'Próximo juego';
  @Output() replay = new EventEmitter<void>();
  @ViewChild('reviewTitle', { static: true })
  private readonly reviewTitle!: ElementRef<HTMLElement>;

  ngAfterViewInit(): void {
    this.reviewTitle.nativeElement.focus();
  }
}
