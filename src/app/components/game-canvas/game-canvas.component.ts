import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  signal,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import Phaser from 'phaser';

import { DropZone, GameItem, GameStage, StageResult } from '../../core/app.models';
import {
  HOME_BACKGROUND_ASSET,
  HOME_BIN_ASSETS,
  HOME_BIN_ASSET_PATHS,
  HOME_PRODUCT_ASSETS,
} from './game-canvas.assets';
import type {
  ActiveItemHud,
  BinVisualState,
  HomeEffect,
  SceneHooks,
  StageTick,
} from './game-canvas.types';
import { IndustrialGameComponent } from './industrial-game/industrial-game.component';
import { WasteJourneyScene } from './scenes/waste-journey.scene';

@Component({
  selector: 'app-game-canvas',
  imports: [IndustrialGameComponent],
  templateUrl: './game-canvas.component.html',
  styleUrl: './game-canvas.component.scss',
})
export class GameCanvasComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) stage!: GameStage;
  @Output() completed = new EventEmitter<StageResult>();
  @ViewChild('gameHost', { static: true }) private readonly gameHost!: ElementRef<HTMLDivElement>;
  @ViewChild('homeStage', { static: true }) private readonly homeStage!: ElementRef<HTMLDivElement>;

  readonly score = signal(0);
  readonly remainingSeconds = signal(0);
  readonly completedItems = signal(0);
  readonly completedResult = signal<StageResult | null>(null);
  readonly activeItem = signal<ActiveItemHud | null>(null);
  readonly homeBackgroundPath = HOME_BACKGROUND_ASSET.path;
  readonly homeBackgroundImage = `url("${HOME_BACKGROUND_ASSET.path}")`;
  readonly homeBinStates = signal<Record<string, BinVisualState>>({});
  readonly homeDragging = signal(false);
  readonly homeEffects = signal<readonly HomeEffect[]>([]);
  readonly homeTokenPosition = signal({ x: 0, y: 0 });
  readonly homeTokenRotation = signal(0);

  private game?: Phaser.Game;
  private resizeTimer?: ReturnType<typeof setTimeout>;
  private homeTimer?: ReturnType<typeof setInterval>;
  private homeStartFrame?: number;
  private homeTimeouts: Array<ReturnType<typeof setTimeout>> = [];
  private homeEffectId = 0;
  private homePendingItems: GameItem[] = [];
  private homeCurrentItem?: GameItem;
  private homeCorrect = 0;
  private homeMistakes = 0;
  private homeStreak = 0;
  private homeFinished = false;
  private homeDragPointerId?: number;
  private homeDragOffset = { x: 0, y: 0 };
  private homeTokenHome = { x: 0, y: 0 };

  constructor(private readonly ngZone: NgZone) {}

  ngAfterViewInit(): void {
    this.createGame();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stage'] && !changes['stage'].firstChange) {
      this.createGame();
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.resizeTimer);
    this.destroyGame();
  }

  @HostListener('window:resize')
  handleResize(): void {
    clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => this.createGame(), 180);
  }

  @HostListener('window:pointermove', ['$event'])
  handleHomePointerMove(event: PointerEvent): void {
    if (!this.homeDragging() || event.pointerId !== this.homeDragPointerId) {
      return;
    }

    event.preventDefault();
    this.moveHomeToken(event);
    this.updateHomeHoverState(event.clientX, event.clientY);
  }

  @HostListener('window:pointerup', ['$event'])
  handleHomePointerUp(event: PointerEvent): void {
    if (!this.homeDragging() || event.pointerId !== this.homeDragPointerId) {
      return;
    }

    event.preventDefault();
    this.finishHomeDrag(event.clientX, event.clientY);
  }

  @HostListener('window:pointercancel', ['$event'])
  handleHomePointerCancel(event: PointerEvent): void {
    if (!this.homeDragging() || event.pointerId !== this.homeDragPointerId) {
      return;
    }

    this.cancelHomeDrag();
  }

  private createGame(): void {
    if (!this.stage || !this.gameHost?.nativeElement) {
      return;
    }

    const host = this.gameHost.nativeElement;

    this.destroyGame();
    host.innerHTML = '';
    this.resetSharedState();

    if (this.stage.id === 'separacion-origen') {
      this.startHomeGame();
      return;
    }

    if (this.stage.id === 'valorizacion-industrial') {
      return;
    }

    const availableWidth = Math.max(320, Math.floor(host.clientWidth || window.innerWidth || 360));
    const availableHeight = Math.max(
      560,
      Math.floor(host.clientHeight || window.innerHeight || availableWidth * 1.18),
    );
    const width = Math.min(760, availableWidth);
    const height = Math.min(720, Math.max(560, Math.round(width * 1.18)));

    const hooks: SceneHooks = {
      onTick: (score, remainingSeconds, completedItems = 0) => {
        this.ngZone.run(() => {
          this.score.set(score);
          this.remainingSeconds.set(remainingSeconds);
          this.completedItems.set(completedItems);
        });
      },
      onComplete: (result) => {
        this.ngZone.run(() => {
          this.completedResult.set(result);
          this.completed.emit(result);
        });
      },
    };
    const scene = new WasteJourneyScene(this.stage, hooks);

    this.ngZone.runOutsideAngular(() => {
      this.game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: host,
        width,
        height,
        backgroundColor: this.stage.backgroundColor,
        scale: {
          autoCenter: Phaser.Scale.CENTER_BOTH,
          mode: Phaser.Scale.FIT,
        },
        scene,
      });
    });
  }

  private destroyGame(): void {
    clearInterval(this.homeTimer);
    this.homeTimer = undefined;
    this.homeTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.homeTimeouts = [];

    if (this.homeStartFrame !== undefined) {
      window.cancelAnimationFrame(this.homeStartFrame);
      this.homeStartFrame = undefined;
    }

    this.homeDragging.set(false);
    this.homeDragPointerId = undefined;
    this.game?.destroy(true);
    this.game = undefined;
  }

  homeBinImage(zoneId: string): string {
    const assets = HOME_BIN_ASSETS[zoneId];
    const state = this.homeBinState(zoneId);
    const textureKey = assets?.[state] ?? assets?.normal;

    return textureKey ? HOME_BIN_ASSET_PATHS[textureKey] : '';
  }

  homeBinState(zoneId: string): BinVisualState {
    return this.homeBinStates()[zoneId] ?? 'normal';
  }

  homeProductImage(itemId: string): string {
    return HOME_PRODUCT_ASSETS[itemId]?.path ?? '';
  }

  homeProductSize(itemId: string): number {
    return Math.min(HOME_PRODUCT_ASSETS[itemId]?.size ?? 96, 98);
  }

  homeTokenTransform(): string {
    const position = this.homeTokenPosition();
    const rotation = this.homeTokenRotation();
    const scale = this.homeDragging() ? 1.08 : 1;

    return `translate3d(${position.x - 64}px, ${position.y - 52}px, 0) scale(${scale})`;
  }

  startHomeDrag(event: PointerEvent): void {
    if (this.homeFinished || !this.homeCurrentItem || this.completedResult()) {
      return;
    }

    event.preventDefault();
    const localPoint = this.getHomeLocalPoint(event.clientX, event.clientY);
    const position = this.homeTokenPosition();

    this.homeDragPointerId = event.pointerId;
    this.homeDragOffset = {
      x: localPoint.x - position.x,
      y: localPoint.y - position.y,
    };
    this.homeDragging.set(true);

    const target = event.currentTarget as HTMLElement | null;
    target?.setPointerCapture?.(event.pointerId);
  }

  homeAccuracyBonus(result: StageResult): number {
    return Math.max(0, result.correct - result.mistakes) * 20;
  }

  industrialAccuracyBonus(result: StageResult): number {
    return Math.max(0, result.correct - result.mistakes) * 18;
  }

  handleIndustrialTick(update: StageTick): void {
    this.score.set(update.score);
    this.remainingSeconds.set(update.remainingSeconds);
    this.completedItems.set(update.completedItems);
  }

  handleStageCompleted(result: StageResult): void {
    this.completedResult.set(result);
    this.completed.emit(result);
  }

  private resetSharedState(): void {
    this.score.set(0);
    this.remainingSeconds.set(this.stage.durationSeconds);
    this.completedItems.set(0);
    this.completedResult.set(null);
    this.activeItem.set(null);
    this.homeEffects.set([]);
  }

  private startHomeGame(): void {
    this.homePendingItems = [...this.stage.items];
    this.homeCurrentItem = undefined;
    this.homeCorrect = 0;
    this.homeMistakes = 0;
    this.homeStreak = 0;
    this.homeFinished = false;
    this.homeEffectId = 0;
    this.homeBinStates.set(this.createHomeBinStates());

    this.homeStartFrame = window.requestAnimationFrame(() => {
      this.homeStartFrame = undefined;
      this.spawnNextHomeItem();
      this.startHomeTimer();
    });
  }

  private startHomeTimer(): void {
    this.homeTimer = setInterval(() => {
      if (this.homeFinished) {
        return;
      }

      const nextRemaining = Math.max(0, this.remainingSeconds() - 1);
      this.remainingSeconds.set(nextRemaining);

      if (nextRemaining === 0) {
        this.finishHomeLevel();
      }
    }, 1000);
  }

  private spawnNextHomeItem(): void {
    if (this.homeFinished || this.homeCurrentItem || this.homePendingItems.length === 0) {
      return;
    }

    const item = this.homePendingItems.shift();

    if (!item) {
      return;
    }

    this.homeCurrentItem = item;
    this.activeItem.set({
      id: item.id,
      label: item.label,
    });
    this.positionHomeTokenAtRest();
    this.homeTokenRotation.set(Math.floor(Math.random() * 9) - 4);
  }

  private positionHomeTokenAtRest(): void {
    const stage = this.homeStage.nativeElement;
    const rect = stage.getBoundingClientRect();
    const x = rect.width / 2;
    const y = rect.height < 650 ? rect.height * 0.48 : rect.height * 0.5;

    this.homeTokenHome = { x, y };
    this.homeTokenPosition.set(this.homeTokenHome);
  }

  private moveHomeToken(event: PointerEvent): void {
    const stage = this.homeStage.nativeElement;
    const rect = stage.getBoundingClientRect();
    const localPoint = this.getHomeLocalPoint(event.clientX, event.clientY);
    const radius = 56;
    const x = Math.min(rect.width - radius, Math.max(radius, localPoint.x - this.homeDragOffset.x));
    const y = Math.min(
      rect.height - radius,
      Math.max(radius, localPoint.y - this.homeDragOffset.y),
    );

    this.homeTokenPosition.set({ x, y });
  }

  private finishHomeDrag(clientX: number, clientY: number): void {
    const item = this.homeCurrentItem;

    this.homeDragging.set(false);
    this.homeDragPointerId = undefined;

    if (!item || this.homeFinished) {
      return;
    }

    const dropZone = this.getHomeDropZoneAt(clientX, clientY);
    this.homeBinStates.set(this.createHomeBinStates());

    if (!dropZone) {
      this.returnHomeToken();
      return;
    }

    if (dropZone.id === item.category) {
      this.handleHomeCorrectDrop(item, dropZone);
      return;
    }

    this.handleHomeWrongDrop(dropZone);
  }

  private cancelHomeDrag(): void {
    this.homeDragging.set(false);
    this.homeDragPointerId = undefined;
    this.homeBinStates.set(this.createHomeBinStates());
    this.returnHomeToken();
  }

  private handleHomeCorrectDrop(item: GameItem, dropZone: DropZone): void {
    this.homeCorrect += 1;
    this.homeStreak += 1;

    const comboBonus = Math.max(0, this.homeStreak - 1) * 15;
    const points = item.points + comboBonus;
    this.score.set(this.score() + points);
    this.completedItems.set(this.homeCorrect);
    this.homeCurrentItem = undefined;
    this.activeItem.set(null);
    this.setHomeBinState(dropZone.id, 'open');
    this.spawnHomeEffect('score', `+${points}`, this.homeTokenPosition());
    this.spawnHomeEffect('success', undefined, this.getHomeZoneCenter(dropZone.id));

    this.scheduleHomeTimeout(() => {
      this.setHomeBinState(dropZone.id, 'normal');

      if (this.homeFinished) {
        return;
      }

      if (this.homeCorrect === this.stage.items.length) {
        this.finishHomeLevel();
      } else {
        this.spawnNextHomeItem();
      }
    }, 520);
  }

  private handleHomeWrongDrop(dropZone: DropZone): void {
    this.homeMistakes += 1;
    this.homeStreak = 0;
    this.score.set(Math.max(0, this.score() - 40));
    this.setHomeBinState(dropZone.id, 'error');
    this.spawnHomeEffect('error', undefined, this.getHomeZoneCenter(dropZone.id));
    this.returnHomeToken();

    this.scheduleHomeTimeout(() => this.setHomeBinState(dropZone.id, 'normal'), 520);
  }

  private finishHomeLevel(): void {
    if (this.homeFinished) {
      return;
    }

    this.homeFinished = true;
    clearInterval(this.homeTimer);
    this.homeTimer = undefined;
    this.homeCurrentItem = undefined;
    this.activeItem.set(null);

    const timeBonus = this.remainingSeconds() * 10;
    const accuracyBonus = Math.max(0, this.homeCorrect - this.homeMistakes) * 20;
    const finalScore = this.score() + timeBonus + accuracyBonus;
    const result: StageResult = {
      stageId: this.stage.id,
      score: finalScore,
      correct: this.homeCorrect,
      mistakes: this.homeMistakes,
      remainingSeconds: this.remainingSeconds(),
      completedAt: new Date().toISOString(),
    };

    this.score.set(finalScore);
    this.completedResult.set(result);
    this.completed.emit(result);
  }

  private returnHomeToken(): void {
    this.homeTokenPosition.set(this.homeTokenHome);
  }

  private updateHomeHoverState(clientX: number, clientY: number): void {
    const hoveredZone = this.getHomeDropZoneAt(clientX, clientY);
    const nextStates = this.createHomeBinStates();

    if (hoveredZone) {
      nextStates[hoveredZone.id] = 'hover';
    }

    this.homeBinStates.set(nextStates);
  }

  private getHomeDropZoneAt(clientX: number, clientY: number): DropZone | undefined {
    const stage = this.homeStage.nativeElement;
    const binElements = Array.from(stage.querySelectorAll<HTMLElement>('[data-home-zone-id]'));

    for (const element of binElements) {
      const rect = element.getBoundingClientRect();
      const zoneId = element.dataset['homeZoneId'];

      if (
        zoneId &&
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        return this.stage.dropZones.find((zone) => zone.id === zoneId);
      }
    }

    return undefined;
  }

  private getHomeZoneCenter(zoneId: string): { x: number; y: number } {
    const stageRect = this.homeStage.nativeElement.getBoundingClientRect();
    const zoneElement = this.homeStage.nativeElement.querySelector<HTMLElement>(
      `[data-home-zone-id="${zoneId}"]`,
    );

    if (!zoneElement) {
      return this.homeTokenPosition();
    }

    const rect = zoneElement.getBoundingClientRect();

    return {
      x: rect.left - stageRect.left + rect.width / 2,
      y: rect.top - stageRect.top + rect.height / 2,
    };
  }

  private getHomeLocalPoint(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.homeStage.nativeElement.getBoundingClientRect();

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  private createHomeBinStates(): Record<string, BinVisualState> {
    return Object.fromEntries(this.stage.dropZones.map((zone) => [zone.id, 'normal']));
  }

  private setHomeBinState(zoneId: string, state: BinVisualState): void {
    this.homeBinStates.update((states) => ({
      ...states,
      [zoneId]: state,
    }));
  }

  private spawnHomeEffect(
    type: HomeEffect['type'],
    text: string | undefined,
    position: { x: number; y: number },
  ): void {
    const id = this.homeEffectId;
    this.homeEffectId += 1;
    const effect: HomeEffect = {
      id,
      type,
      text,
      x: position.x,
      y: position.y,
    };

    this.homeEffects.update((effects) => [...effects, effect]);
    this.scheduleHomeTimeout(() => {
      this.homeEffects.update((effects) => effects.filter((current) => current.id !== id));
    }, 820);
  }

  private scheduleHomeTimeout(callback: () => void, delay: number): void {
    const timeout = setTimeout(() => {
      this.homeTimeouts = this.homeTimeouts.filter((current) => current !== timeout);
      callback();
    }, delay);

    this.homeTimeouts.push(timeout);
  }
}
