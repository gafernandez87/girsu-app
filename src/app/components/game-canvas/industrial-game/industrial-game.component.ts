import { NgStyle } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  signal,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

import { DropZone, GameItem, GameStage, StageResult } from '../../../core/app.models';
import {
  INDUSTRIAL_BACKGROUND_ASSET,
  INDUSTRIAL_BIN_ASSETS,
  INDUSTRIAL_CONVEYOR_ASSETS,
  INDUSTRIAL_PRODUCT_ASSETS,
} from '../game-canvas.assets';
import type { ImageAsset, ProductAsset, StageTick } from '../game-canvas.types';

type IndustrialZoneState = 'normal' | 'hover' | 'open' | 'error';

@Component({
  selector: 'app-industrial-game',
  imports: [NgStyle],
  templateUrl: './industrial-game.component.html',
  styleUrl: './industrial-game.component.scss',
})
export class IndustrialGameComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) stage!: GameStage;
  @Output() tick = new EventEmitter<StageTick>();
  @Output() completed = new EventEmitter<StageResult>();
  @ViewChild('industrialStage', { static: true })
  private readonly industrialStage!: ElementRef<HTMLDivElement>;
  @ViewChild('beltTrack', { static: true }) private readonly beltTrack!: ElementRef<HTMLDivElement>;

  readonly backgroundImage = `url("${INDUSTRIAL_BACKGROUND_ASSET.path}")`;
  readonly conveyorBaseAsset = INDUSTRIAL_CONVEYOR_ASSETS.base;
  readonly conveyorBeltPattern = `url("${INDUSTRIAL_CONVEYOR_ASSETS.belt.path}")`;
  readonly activeItem = signal<GameItem | null>(null);
  readonly dragging = signal(false);
  readonly tokenPosition = signal({ x: 0, y: 0 });
  readonly tokenAngle = signal(0);
  readonly zoneStates = signal<Record<string, IndustrialZoneState>>({});

  private viewReady = false;
  private pendingItems: GameItem[] = [];
  private correct = 0;
  private processed = 0;
  private mistakes = 0;
  private score = 0;
  private streak = 0;
  private remainingSeconds = 0;
  private finished = false;
  private dragPointerId?: number;
  private dragOffset = { x: 0, y: 0 };
  private conveyorProgress = 0.12;
  private stageTimer?: ReturnType<typeof setInterval>;
  private conveyorTimer?: ReturnType<typeof setInterval>;
  private timeouts: Array<ReturnType<typeof setTimeout>> = [];

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.startGame();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.viewReady && changes['stage']) {
      this.startGame();
    }
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  @HostListener('window:pointermove', ['$event'])
  handlePointerMove(event: PointerEvent): void {
    if (!this.dragging() || event.pointerId !== this.dragPointerId) {
      return;
    }

    event.preventDefault();
    this.moveToken(event);
    this.updateHoverState(event.clientX, event.clientY);
  }

  @HostListener('window:pointerup', ['$event'])
  handlePointerUp(event: PointerEvent): void {
    if (!this.dragging() || event.pointerId !== this.dragPointerId) {
      return;
    }

    event.preventDefault();
    this.finishDrag(event.clientX, event.clientY);
  }

  @HostListener('window:pointercancel', ['$event'])
  handlePointerCancel(event: PointerEvent): void {
    if (!this.dragging() || event.pointerId !== this.dragPointerId) {
      return;
    }

    this.cancelDrag();
  }

  startDrag(event: PointerEvent): void {
    if (this.finished || !this.activeItem()) {
      return;
    }

    event.preventDefault();
    this.stopConveyorTimer();

    const localPoint = this.getLocalPoint(event.clientX, event.clientY);
    const position = this.tokenPosition();

    this.dragPointerId = event.pointerId;
    this.dragOffset = {
      x: localPoint.x - position.x,
      y: localPoint.y - position.y,
    };
    this.dragging.set(true);

    const target = event.currentTarget as HTMLElement | null;
    target?.setPointerCapture?.(event.pointerId);
  }

  assetFrameStyle(asset: ImageAsset): Record<string, string> {
    const crop = asset.crop;

    if (!crop) {
      return {};
    }

    return {
      aspectRatio: `${crop.width} / ${crop.height}`,
    };
  }

  assetImageStyle(asset: ImageAsset): Record<string, string> {
    const crop = asset.crop;
    const sourceWidth = asset.sourceWidth;
    const sourceHeight = asset.sourceHeight;

    if (!crop || !sourceWidth || !sourceHeight) {
      return {};
    }

    return {
      width: `${(sourceWidth / crop.width) * 100}%`,
      height: `${(sourceHeight / crop.height) * 100}%`,
      transform: `translate(${-(crop.x / sourceWidth) * 100}%, ${-(crop.y / sourceHeight) * 100}%)`,
    };
  }

  binAsset(zoneId: string): ImageAsset | undefined {
    return INDUSTRIAL_BIN_ASSETS[zoneId];
  }

  productAsset(itemId: string): ProductAsset | undefined {
    return INDUSTRIAL_PRODUCT_ASSETS[itemId];
  }

  zoneState(zoneId: string): IndustrialZoneState {
    return this.zoneStates()[zoneId] ?? 'normal';
  }

  tokenTransform(): string {
    const position = this.tokenPosition();
    const scale = this.dragging() ? 1.08 : 1;

    return `translate3d(${position.x - 45}px, ${position.y - 45}px, 0) rotate(${this.tokenAngle()}deg) scale(${scale})`;
  }

  private startGame(): void {
    this.clearTimers();
    this.pendingItems = [...this.stage.items];
    this.correct = 0;
    this.processed = 0;
    this.mistakes = 0;
    this.score = 0;
    this.streak = 0;
    this.remainingSeconds = this.stage.durationSeconds;
    this.finished = false;
    this.dragPointerId = undefined;
    this.dragging.set(false);
    this.activeItem.set(null);
    this.zoneStates.set(this.createZoneStates());
    this.emitTick();

    this.schedule(() => {
      this.spawnNextItem();
      this.startStageTimer();
    }, 80);
  }

  private startStageTimer(): void {
    this.stageTimer = setInterval(() => {
      if (this.finished) {
        return;
      }

      this.remainingSeconds = Math.max(0, this.remainingSeconds - 1);
      this.emitTick();

      if (this.remainingSeconds === 0) {
        this.finishLevel();
      }
    }, 1000);
  }

  private spawnNextItem(): void {
    if (this.finished || this.activeItem() || this.pendingItems.length === 0) {
      return;
    }

    const item = this.pendingItems.shift();

    if (!item) {
      return;
    }

    this.conveyorProgress = 0.12;
    this.activeItem.set(item);
    this.tokenAngle.set(Math.floor(Math.random() * 7) - 3);
    this.positionTokenOnBelt();
    this.startConveyorTimer();
  }

  private startConveyorTimer(): void {
    this.stopConveyorTimer();
    this.conveyorTimer = setInterval(() => {
      if (this.finished || this.dragging() || !this.activeItem()) {
        return;
      }

      this.conveyorProgress += 0.0048;
      this.positionTokenOnBelt();

      if (this.conveyorProgress >= 0.96) {
        this.handleItemLost();
      }
    }, 40);
  }

  private stopConveyorTimer(): void {
    clearInterval(this.conveyorTimer);
    this.conveyorTimer = undefined;
  }

  private positionTokenOnBelt(): void {
    const stageRect = this.industrialStage.nativeElement.getBoundingClientRect();
    const beltRect = this.beltTrack.nativeElement.getBoundingClientRect();
    const x = beltRect.left - stageRect.left + beltRect.width * this.conveyorProgress;
    const y = beltRect.top - stageRect.top + beltRect.height * 0.45;

    this.tokenPosition.set({ x, y });
  }

  private moveToken(event: PointerEvent): void {
    const stage = this.industrialStage.nativeElement;
    const rect = stage.getBoundingClientRect();
    const localPoint = this.getLocalPoint(event.clientX, event.clientY);
    const radius = 44;
    const x = Math.min(rect.width - radius, Math.max(radius, localPoint.x - this.dragOffset.x));
    const y = Math.min(rect.height - radius, Math.max(radius, localPoint.y - this.dragOffset.y));

    this.tokenPosition.set({ x, y });
  }

  private finishDrag(clientX: number, clientY: number): void {
    const item = this.activeItem();

    this.dragging.set(false);
    this.dragPointerId = undefined;
    this.zoneStates.set(this.createZoneStates());

    if (!item || this.finished) {
      return;
    }

    const dropZone = this.getDropZoneAt(clientX, clientY);

    if (!dropZone) {
      this.returnToBelt();
      return;
    }

    if (dropZone.id === item.category) {
      this.handleCorrectDrop(item, dropZone);
      return;
    }

    this.handleWrongDrop(dropZone);
  }

  private cancelDrag(): void {
    this.dragging.set(false);
    this.dragPointerId = undefined;
    this.zoneStates.set(this.createZoneStates());
    this.returnToBelt();
  }

  private handleCorrectDrop(item: GameItem, dropZone: DropZone): void {
    this.correct += 1;
    this.processed += 1;
    this.streak += 1;

    const comboBonus = Math.max(0, this.streak - 1) * 18;
    this.score += item.points + comboBonus;
    this.activeItem.set(null);
    this.setZoneState(dropZone.id, 'open');
    this.emitTick();

    this.schedule(() => {
      this.setZoneState(dropZone.id, 'normal');

      if (this.processed === this.stage.items.length) {
        this.finishLevel();
      } else {
        this.spawnNextItem();
      }
    }, 520);
  }

  private handleWrongDrop(dropZone: DropZone): void {
    this.mistakes += 1;
    this.streak = 0;
    this.score = Math.max(0, this.score - 40);
    this.setZoneState(dropZone.id, 'error');
    this.emitTick();
    this.returnToBelt();
    this.schedule(() => this.setZoneState(dropZone.id, 'normal'), 520);
  }

  private handleItemLost(): void {
    if (!this.activeItem() || this.finished) {
      return;
    }

    this.stopConveyorTimer();
    this.mistakes += 1;
    this.processed += 1;
    this.streak = 0;
    this.score = Math.max(0, this.score - 60);
    this.activeItem.set(null);
    this.emitTick();

    this.schedule(() => {
      if (this.processed === this.stage.items.length) {
        this.finishLevel();
      } else {
        this.spawnNextItem();
      }
    }, 360);
  }

  private returnToBelt(): void {
    this.positionTokenOnBelt();
    this.schedule(() => this.startConveyorTimer(), 180);
  }

  private finishLevel(): void {
    if (this.finished) {
      return;
    }

    this.finished = true;
    this.clearTimers();
    this.activeItem.set(null);

    const timeBonus = this.remainingSeconds * 10;
    const accuracyBonus = Math.max(0, this.correct - this.mistakes) * 18;
    this.score += timeBonus + accuracyBonus;
    this.emitTick();
    this.completed.emit({
      stageId: this.stage.id,
      score: this.score,
      correct: this.correct,
      mistakes: this.mistakes,
      remainingSeconds: this.remainingSeconds,
      completedAt: new Date().toISOString(),
    });
  }

  private emitTick(): void {
    this.tick.emit({
      score: this.score,
      remainingSeconds: this.remainingSeconds,
      completedItems: this.processed,
    });
  }

  private updateHoverState(clientX: number, clientY: number): void {
    const hoveredZone = this.getDropZoneAt(clientX, clientY);
    const nextStates = this.createZoneStates();

    if (hoveredZone) {
      nextStates[hoveredZone.id] = 'hover';
    }

    this.zoneStates.set(nextStates);
  }

  private getDropZoneAt(clientX: number, clientY: number): DropZone | undefined {
    const stage = this.industrialStage.nativeElement;
    const zoneElements = Array.from(
      stage.querySelectorAll<HTMLElement>('[data-industrial-zone-id]'),
    );

    for (const element of zoneElements) {
      const rect = element.getBoundingClientRect();
      const zoneId = element.dataset['industrialZoneId'];

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

  private getLocalPoint(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.industrialStage.nativeElement.getBoundingClientRect();

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  private createZoneStates(): Record<string, IndustrialZoneState> {
    return Object.fromEntries(this.stage.dropZones.map((zone) => [zone.id, 'normal']));
  }

  private setZoneState(zoneId: string, state: IndustrialZoneState): void {
    this.zoneStates.update((states) => ({
      ...states,
      [zoneId]: state,
    }));
  }

  private schedule(callback: () => void, delay: number): void {
    const timeout = setTimeout(() => {
      this.timeouts = this.timeouts.filter((current) => current !== timeout);
      callback();
    }, delay);

    this.timeouts.push(timeout);
  }

  private clearTimers(): void {
    clearInterval(this.stageTimer);
    clearInterval(this.conveyorTimer);
    this.stageTimer = undefined;
    this.conveyorTimer = undefined;
    this.timeouts.forEach((timeout) => clearTimeout(timeout));
    this.timeouts = [];
  }
}
