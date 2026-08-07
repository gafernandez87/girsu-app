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
type IndustrialPoint = { readonly x: number; readonly y: number };

interface IndustrialActiveToken {
  readonly tokenId: number;
  readonly item: GameItem;
  readonly progress: number;
  readonly position: IndustrialPoint;
  readonly rotation: number;
}

type IndustrialEffectType = 'score' | 'error';

interface IndustrialEffect {
  readonly id: number;
  readonly type: IndustrialEffectType;
  readonly text: string;
  readonly x: number;
  readonly y: number;
}

const INDUSTRIAL_SPAWN_INTERVAL_MS = 5000;
const INDUSTRIAL_MOVE_INTERVAL_MS = 40;
const INDUSTRIAL_START_PROGRESS = 0.08;
const INDUSTRIAL_END_PROGRESS = 0.96;
const INDUSTRIAL_PROGRESS_STEP = 0.0048;

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
  readonly activeTokens = signal<readonly IndustrialActiveToken[]>([]);
  readonly effects = signal<readonly IndustrialEffect[]>([]);
  readonly draggingTokenId = signal<number | null>(null);
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
  private nextTokenId = 0;
  private effectId = 0;
  private dragPointerId?: number;
  private dragOffset = { x: 0, y: 0 };
  private stageTimer?: ReturnType<typeof setInterval>;
  private conveyorTimer?: ReturnType<typeof setInterval>;
  private spawnTimer?: ReturnType<typeof setTimeout>;
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
    const tokenId = this.draggingTokenId();

    if (tokenId === null || event.pointerId !== this.dragPointerId) {
      return;
    }

    event.preventDefault();
    this.moveToken(event, tokenId);
    this.updateHoverState(event.clientX, event.clientY);
  }

  @HostListener('window:pointerup', ['$event'])
  handlePointerUp(event: PointerEvent): void {
    const tokenId = this.draggingTokenId();

    if (tokenId === null || event.pointerId !== this.dragPointerId) {
      return;
    }

    event.preventDefault();
    this.finishDrag(event.clientX, event.clientY, tokenId);
  }

  @HostListener('window:pointercancel', ['$event'])
  handlePointerCancel(event: PointerEvent): void {
    const tokenId = this.draggingTokenId();

    if (tokenId === null || event.pointerId !== this.dragPointerId) {
      return;
    }

    this.cancelDrag(tokenId);
  }

  startDrag(event: PointerEvent, tokenId: number): void {
    const token = this.activeToken(tokenId);

    if (this.finished || !token) {
      return;
    }

    event.preventDefault();

    const localPoint = this.getLocalPoint(event.clientX, event.clientY);

    this.dragPointerId = event.pointerId;
    this.dragOffset = {
      x: localPoint.x - token.position.x,
      y: localPoint.y - token.position.y,
    };
    this.draggingTokenId.set(tokenId);

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

  isTokenDragging(tokenId: number): boolean {
    return this.draggingTokenId() === tokenId;
  }

  tokenTransform(token: IndustrialActiveToken): string {
    const scale = this.isTokenDragging(token.tokenId) ? 1.08 : 1;

    return `translate3d(${token.position.x - 45}px, ${token.position.y - 45}px, 0) rotate(${token.rotation}deg) scale(${scale})`;
  }

  private startGame(): void {
    this.clearTimers();
    this.pendingItems = this.shuffleItems(this.stage.items);
    this.correct = 0;
    this.processed = 0;
    this.mistakes = 0;
    this.score = 0;
    this.streak = 0;
    this.remainingSeconds = this.stage.durationSeconds;
    this.finished = false;
    this.nextTokenId = 0;
    this.effectId = 0;
    this.dragPointerId = undefined;
    this.draggingTokenId.set(null);
    this.activeTokens.set([]);
    this.effects.set([]);
    this.zoneStates.set(this.createZoneStates());
    this.emitTick();

    this.schedule(() => {
      this.spawnNextItem();
      this.startStageTimer();
      this.startConveyorTimer();
      this.startSpawnTimer();
      this.finishIfDeckComplete();
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

  private startSpawnTimer(): void {
    this.scheduleNextSpawn();
  }

  private scheduleNextSpawn(): void {
    clearTimeout(this.spawnTimer);
    this.spawnTimer = undefined;

    if (this.finished || this.pendingItems.length === 0) {
      return;
    }

    this.spawnTimer = setTimeout(() => {
      this.spawnTimer = undefined;
      this.spawnNextItem();
      this.finishIfDeckComplete();
    }, INDUSTRIAL_SPAWN_INTERVAL_MS);
  }

  private startConveyorTimer(): void {
    this.conveyorTimer = setInterval(() => {
      if (this.finished) {
        return;
      }

      const draggingId = this.draggingTokenId();
      const lostTokens: IndustrialActiveToken[] = [];
      const nextTokens: IndustrialActiveToken[] = [];

      for (const token of this.activeTokens()) {
        if (token.tokenId === draggingId) {
          nextTokens.push(token);
          continue;
        }

        const progress = token.progress + INDUSTRIAL_PROGRESS_STEP;

        if (progress >= INDUSTRIAL_END_PROGRESS) {
          lostTokens.push(token);
          continue;
        }

        nextTokens.push({
          ...token,
          progress,
          position: this.beltPosition(progress),
        });
      }

      this.activeTokens.set(nextTokens);

      for (const token of lostTokens) {
        this.handleItemLost(token);
      }

      this.ensureActiveItem();
      this.finishIfDeckComplete();
    }, INDUSTRIAL_MOVE_INTERVAL_MS);
  }

  private spawnNextItem(): boolean {
    if (this.finished || this.pendingItems.length === 0) {
      return false;
    }

    const item = this.pendingItems.shift();

    if (!item) {
      return false;
    }

    const token: IndustrialActiveToken = {
      tokenId: this.nextTokenId,
      item,
      progress: INDUSTRIAL_START_PROGRESS,
      position: this.beltPosition(INDUSTRIAL_START_PROGRESS),
      rotation: Math.floor(Math.random() * 7) - 3,
    };

    this.nextTokenId += 1;
    this.activeTokens.update((tokens) => [...tokens, token]);
    this.scheduleNextSpawn();

    return true;
  }

  private beltPosition(progress: number): IndustrialPoint {
    const stageRect = this.industrialStage.nativeElement.getBoundingClientRect();
    const beltRect = this.beltTrack.nativeElement.getBoundingClientRect();
    const x = beltRect.left - stageRect.left + beltRect.width * progress;
    const y = beltRect.top - stageRect.top + beltRect.height * 0.45;

    return { x, y };
  }

  private moveToken(event: PointerEvent, tokenId: number): void {
    const stage = this.industrialStage.nativeElement;
    const rect = stage.getBoundingClientRect();
    const localPoint = this.getLocalPoint(event.clientX, event.clientY);
    const radius = 44;
    const x = Math.min(rect.width - radius, Math.max(radius, localPoint.x - this.dragOffset.x));
    const y = Math.min(rect.height - radius, Math.max(radius, localPoint.y - this.dragOffset.y));

    this.updateToken(tokenId, (token) => ({
      ...token,
      position: { x, y },
    }));
  }

  private finishDrag(clientX: number, clientY: number, tokenId: number): void {
    const token = this.activeToken(tokenId);

    this.draggingTokenId.set(null);
    this.dragPointerId = undefined;
    this.zoneStates.set(this.createZoneStates());

    if (!token || this.finished) {
      return;
    }

    const dropZone = this.getDropZoneAt(clientX, clientY);

    if (!dropZone) {
      this.returnTokenToBelt(tokenId);
      return;
    }

    if (dropZone.id === token.item.category) {
      this.handleCorrectDrop(token, dropZone);
      return;
    }

    this.handleWrongDrop(token, dropZone);
  }

  private cancelDrag(tokenId: number): void {
    this.draggingTokenId.set(null);
    this.dragPointerId = undefined;
    this.zoneStates.set(this.createZoneStates());
    this.returnTokenToBelt(tokenId);
  }

  private handleCorrectDrop(token: IndustrialActiveToken, dropZone: DropZone): void {
    this.correct += 1;
    this.processed += 1;
    this.streak += 1;

    const comboBonus = Math.max(0, this.streak - 1) * 18;
    const points = token.item.points + comboBonus;
    this.score += points;
    this.removeToken(token.tokenId);
    this.setZoneState(dropZone.id, 'open');
    this.spawnEffect('score', `+${points}`, this.getZoneCenter(dropZone.id));
    this.emitTick();
    this.ensureActiveItem();

    this.schedule(() => {
      this.setZoneState(dropZone.id, 'normal');
      this.finishIfDeckComplete();
    }, 520);
  }

  private handleWrongDrop(token: IndustrialActiveToken, dropZone: DropZone): void {
    this.mistakes += 1;
    this.processed += 1;
    this.streak = 0;
    this.score = Math.max(0, this.score - 40);
    this.removeToken(token.tokenId);
    this.setZoneState(dropZone.id, 'error');
    this.spawnEffect('error', '-40', this.getZoneCenter(dropZone.id));
    this.emitTick();
    this.ensureActiveItem();

    this.schedule(() => {
      this.setZoneState(dropZone.id, 'normal');
      this.finishIfDeckComplete();
    }, 520);
  }

  private handleItemLost(token: IndustrialActiveToken): void {
    this.mistakes += 1;
    this.processed += 1;
    this.streak = 0;
    this.score = Math.max(0, this.score - 60);
    this.spawnEffect('error', '-60', token.position);
    this.emitTick();
  }

  private returnTokenToBelt(tokenId: number): void {
    this.updateToken(tokenId, (token) => ({
      ...token,
      position: this.beltPosition(token.progress),
    }));
  }

  private ensureActiveItem(): void {
    if (!this.finished && this.activeTokens().length === 0 && this.pendingItems.length > 0) {
      this.spawnNextItem();
    }
  }

  private finishIfDeckComplete(): void {
    if (!this.finished && this.pendingItems.length === 0 && this.activeTokens().length === 0) {
      this.finishLevel();
    }
  }

  private finishLevel(): void {
    if (this.finished) {
      return;
    }

    this.finished = true;
    this.clearTimers();
    this.activeTokens.set([]);
    this.draggingTokenId.set(null);
    this.dragPointerId = undefined;

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

  private getLocalPoint(clientX: number, clientY: number): IndustrialPoint {
    const rect = this.industrialStage.nativeElement.getBoundingClientRect();

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  private getZoneCenter(zoneId: string): IndustrialPoint {
    const stage = this.industrialStage.nativeElement;
    const stageRect = stage.getBoundingClientRect();
    const zoneElement = stage.querySelector<HTMLElement>(
      `[data-industrial-zone-id="${zoneId}"]`,
    );

    if (!zoneElement) {
      return {
        x: stageRect.width / 2,
        y: stageRect.height / 2,
      };
    }

    const rect = zoneElement.getBoundingClientRect();

    return {
      x: rect.left - stageRect.left + rect.width / 2,
      y: rect.top - stageRect.top + rect.height * 0.42,
    };
  }

  private activeToken(tokenId: number): IndustrialActiveToken | undefined {
    return this.activeTokens().find((token) => token.tokenId === tokenId);
  }

  private updateToken(
    tokenId: number,
    updater: (token: IndustrialActiveToken) => IndustrialActiveToken,
  ): void {
    this.activeTokens.update((tokens) =>
      tokens.map((token) => (token.tokenId === tokenId ? updater(token) : token)),
    );
  }

  private removeToken(tokenId: number): void {
    this.activeTokens.update((tokens) => tokens.filter((token) => token.tokenId !== tokenId));
  }

  private shuffleItems(items: readonly GameItem[]): GameItem[] {
    const shuffledItems = [...items];

    for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffledItems[index], shuffledItems[swapIndex]] = [
        shuffledItems[swapIndex],
        shuffledItems[index],
      ];
    }

    return shuffledItems;
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

  private spawnEffect(
    type: IndustrialEffectType,
    text: string,
    position: IndustrialPoint,
  ): void {
    const id = this.effectId;
    this.effectId += 1;

    this.effects.update((effects) => [
      ...effects,
      {
        id,
        type,
        text,
        x: position.x,
        y: position.y,
      },
    ]);
    this.schedule(() => {
      this.effects.update((effects) => effects.filter((current) => current.id !== id));
    }, 1100);
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
    clearTimeout(this.spawnTimer);
    this.stageTimer = undefined;
    this.conveyorTimer = undefined;
    this.spawnTimer = undefined;
    this.timeouts.forEach((timeout) => clearTimeout(timeout));
    this.timeouts = [];
  }
}
