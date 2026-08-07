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

import { GameItem, GameStage, StageResult } from '../../../core/app.models';
import { COMPOST_BACKGROUND_ASSET, COMPOST_PRODUCT_ASSETS } from '../game-canvas.assets';
import type { ProductAsset, StageTick } from '../game-canvas.types';

type CompostCategory = 'verdes' | 'marrones';
type CompostZoneState = 'normal' | 'hover' | 'open';
type CompostMoistureState = 'dry' | 'balanced' | 'wet';
type CompostLayerFragmentType =
  'soil' | 'peel' | 'lettuce' | 'yerba' | 'tea' | 'leaf' | 'twig' | 'cardboard' | 'grass';

interface CompostLayerFragment {
  readonly id: string;
  readonly type: CompostLayerFragmentType;
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly stretch: number;
  readonly rotation: number;
}

interface CompostLayer {
  readonly id: number;
  readonly itemId: string;
  readonly label: string;
  readonly category: CompostCategory;
  readonly offset: number;
  readonly height: number;
  readonly tilt: number;
  readonly fragments: readonly CompostLayerFragment[];
}

interface CompostParticle {
  readonly id: number;
  readonly itemId: string;
  readonly category: CompostCategory;
  readonly x: number;
  readonly drift: number;
  readonly delay: number;
  readonly duration: number;
  readonly size: number;
  readonly rotation: number;
}

interface CompostEffect {
  readonly id: number;
  readonly type: 'score' | 'penalty';
  readonly text: string;
  readonly x: number;
  readonly y: number;
}

const MOISTURE_ICONS: ReadonlyArray<{
  readonly id: CompostMoistureState;
}> = [{ id: 'dry' }, { id: 'balanced' }, { id: 'wet' }];

@Component({
  selector: 'app-compost-game',
  templateUrl: './compost-game.component.html',
  styleUrl: './compost-game.component.scss',
})
export class CompostGameComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) stage!: GameStage;
  @Output() tick = new EventEmitter<StageTick>();
  @Output() completed = new EventEmitter<StageResult>();
  @ViewChild('compostStage', { static: true })
  private readonly compostStage!: ElementRef<HTMLDivElement>;

  readonly backgroundImage = `url("${COMPOST_BACKGROUND_ASSET.path}")`;
  readonly activeItem = signal<GameItem | null>(null);
  readonly dragging = signal(false);
  readonly tokenPosition = signal({ x: 0, y: 0 });
  readonly tokenAngle = signal(0);
  readonly placedItemIds = signal<ReadonlySet<string>>(new Set());
  readonly layers = signal<readonly CompostLayer[]>([]);
  readonly particles = signal<readonly CompostParticle[]>([]);
  readonly composterState = signal<CompostZoneState>('normal');
  readonly effects = signal<readonly CompostEffect[]>([]);
  readonly moistureBalance = signal(0);
  readonly moistureIcons = MOISTURE_ICONS;

  private viewReady = false;
  private correct = 0;
  private mistakes = 0;
  private score = 0;
  private streak = 0;
  private remainingSeconds = 0;
  private finished = false;
  private dragPointerId?: number;
  private effectId = 0;
  private layerId = 0;
  private particleId = 0;
  private timer?: ReturnType<typeof setInterval>;
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

  startDrag(item: GameItem, event: PointerEvent): void {
    if (this.finished || this.placedItemIds().has(item.id)) {
      return;
    }

    event.preventDefault();
    const localPoint = this.getLocalPoint(event.clientX, event.clientY);

    this.activeItem.set(item);
    this.dragPointerId = event.pointerId;
    this.dragging.set(true);
    this.tokenAngle.set(Math.floor(Math.random() * 9) - 4);
    this.tokenPosition.set(localPoint);

    const target = event.currentTarget as HTMLElement | null;
    target?.setPointerCapture?.(event.pointerId);
  }

  itemsByCategory(category: string): readonly GameItem[] {
    return this.stage.items.filter((item) => item.category === category);
  }

  isItemPlaced(itemId: string): boolean {
    return this.placedItemIds().has(itemId);
  }

  private neededCategory(): CompostCategory {
    const balance = this.moistureBalance();

    if (balance >= 2) {
      return 'marrones';
    }

    if (balance <= -2) {
      return 'verdes';
    }

    const lastLayer = this.layers().at(-1);

    if (!lastLayer) {
      return 'marrones';
    }

    return lastLayer.category === 'verdes' ? 'marrones' : 'verdes';
  }

  moistureState(): CompostMoistureState {
    const balance = this.moistureBalance();

    if (balance >= 2) {
      return 'wet';
    }

    if (balance <= -2) {
      return 'dry';
    }

    return 'balanced';
  }

  moistureLabel(): string {
    const state = this.moistureState();

    if (state === 'wet') {
      return 'Muy humeda';
    }

    if (state === 'dry') {
      return 'Muy seca';
    }

    return 'En balance';
  }

  productAsset(itemId: string): ProductAsset | undefined {
    return COMPOST_PRODUCT_ASSETS[itemId];
  }

  tokenTransform(): string {
    const position = this.tokenPosition();
    const scale = this.dragging() ? 1.08 : 1;

    return `translate3d(${position.x - 44}px, ${position.y - 47}px, 0) rotate(${this.tokenAngle()}deg) scale(${scale})`;
  }

  private startGame(): void {
    this.clearTimers();
    this.correct = 0;
    this.mistakes = 0;
    this.score = 0;
    this.streak = 0;
    this.remainingSeconds = this.stage.durationSeconds;
    this.finished = false;
    this.dragPointerId = undefined;
    this.effectId = 0;
    this.layerId = 0;
    this.particleId = 0;
    this.activeItem.set(null);
    this.dragging.set(false);
    this.placedItemIds.set(new Set());
    this.layers.set([]);
    this.particles.set([]);
    this.composterState.set('normal');
    this.effects.set([]);
    this.moistureBalance.set(0);
    this.emitTick();

    this.timer = setInterval(() => {
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

  private moveToken(event: PointerEvent): void {
    const stage = this.compostStage.nativeElement;
    const rect = stage.getBoundingClientRect();
    const localPoint = this.getLocalPoint(event.clientX, event.clientY);
    const radius = 44;
    const x = Math.min(rect.width - radius, Math.max(radius, localPoint.x));
    const y = Math.min(rect.height - radius, Math.max(radius, localPoint.y));

    this.tokenPosition.set({ x, y });
  }

  private finishDrag(clientX: number, clientY: number): void {
    const item = this.activeItem();

    this.dragging.set(false);
    this.dragPointerId = undefined;

    if (!item || this.finished) {
      return;
    }

    const hitComposter = this.isOverComposter(clientX, clientY);

    if (!hitComposter) {
      this.activeItem.set(null);
      this.composterState.set('normal');
      return;
    }

    this.placeItem(item, this.getCompostCategory(item.category));
  }

  private cancelDrag(): void {
    this.dragging.set(false);
    this.dragPointerId = undefined;
    this.activeItem.set(null);
    this.composterState.set('normal');
  }

  private placeItem(item: GameItem, category: CompostCategory): void {
    const requiredCategory = this.neededCategory();
    const isCorrect = category === requiredCategory;
    const nextBalance = this.moistureBalance() + (category === 'verdes' ? 1 : -1);

    this.spawnMaterialFall(item, category);
    this.placedItemIds.update((placed) => {
      const nextPlaced = new Set(placed);
      nextPlaced.add(item.id);
      return nextPlaced;
    });
    const layerId = this.layerId;

    this.layers.update((layers) => [
      ...layers,
      {
        id: layerId,
        itemId: item.id,
        label: item.label,
        category,
        offset: Math.floor(Math.random() * 6) - 3,
        height:
          category === 'marrones'
            ? 7 + Math.floor(Math.random() * 3)
            : 8 + Math.floor(Math.random() * 3),
        tilt: Math.floor(Math.random() * 3) - 1,
        fragments: this.createLayerFragments(item, category, layerId),
      },
    ]);
    this.layerId += 1;
    this.moistureBalance.set(nextBalance);
    this.activeItem.set(null);
    this.composterState.set('open');

    if (isCorrect) {
      this.handleCorrectLayer(item);
    } else {
      this.handleUnbalancedLayer();
    }

    this.emitTick();

    this.schedule(() => {
      this.composterState.set('normal');

      if (this.placedItemIds().size === this.stage.items.length) {
        this.finishLevel();
      }
    }, 620);
  }

  private handleCorrectLayer(item: GameItem): void {
    this.correct += 1;
    this.streak += 1;

    const comboBonus = Math.max(0, this.streak - 1) * 16;
    const points = item.points + comboBonus;
    this.score += points;
    this.spawnEffect('score', `+${points}`, this.tokenPosition());
  }

  private handleUnbalancedLayer(): void {
    this.mistakes += 1;
    this.streak = 0;
    this.score = Math.max(0, this.score - 35);
    this.spawnEffect('penalty', '-35', this.tokenPosition());
  }

  private createLayerFragments(
    item: GameItem,
    category: CompostCategory,
    layerId: number,
  ): readonly CompostLayerFragment[] {
    const fragmentTypes = this.fragmentTypesForItem(item, category);
    const count = category === 'marrones' ? 16 : 14;

    return Array.from({ length: count }, (_, index) => {
      const type = fragmentTypes[index % fragmentTypes.length];

      return {
        id: `${layerId}-${index}`,
        type,
        x: 5 + Math.random() * 90,
        y: 18 + Math.random() * 70,
        size: this.fragmentSize(type),
        stretch: Number((0.78 + Math.random() * 0.86).toFixed(2)),
        rotation: Math.floor(Math.random() * 150) - 75,
      };
    });
  }

  private fragmentTypesForItem(
    item: GameItem,
    category: CompostCategory,
  ): readonly CompostLayerFragmentType[] {
    if (item.id === 'ramas') {
      return ['twig', 'twig', 'twig', 'leaf', 'soil'];
    }

    if (item.id === 'hojas-secas') {
      return ['leaf', 'leaf', 'twig', 'soil', 'grass'];
    }

    if (item.id === 'cesped-seco') {
      return ['grass', 'grass', 'twig', 'leaf', 'soil'];
    }

    if (item.id === 'carton-sin-tinta' || item.id === 'carton-trocitos') {
      return ['cardboard', 'cardboard', 'twig', 'leaf', 'soil'];
    }

    if (item.id === 'yerba-compost') {
      return ['yerba', 'yerba', 'soil', 'peel', 'leaf'];
    }

    if (item.id === 'te') {
      return ['tea', 'yerba', 'soil', 'leaf', 'peel'];
    }

    if (item.id === 'hojas-lechuga') {
      return ['lettuce', 'lettuce', 'peel', 'soil', 'yerba'];
    }

    if (item.id === 'cascaras-fruta') {
      return ['peel', 'peel', 'lettuce', 'soil', 'yerba'];
    }

    return category === 'marrones'
      ? ['leaf', 'twig', 'grass', 'soil']
      : ['peel', 'lettuce', 'yerba', 'soil'];
  }

  private fragmentSize(type: CompostLayerFragmentType): number {
    if (type === 'twig' || type === 'grass') {
      return 5 + Math.floor(Math.random() * 5);
    }

    if (type === 'soil' || type === 'yerba') {
      return 4 + Math.floor(Math.random() * 4);
    }

    if (type === 'cardboard' || type === 'tea') {
      return 6 + Math.floor(Math.random() * 5);
    }

    return 6 + Math.floor(Math.random() * 7);
  }

  private spawnMaterialFall(item: GameItem, category: CompostCategory): void {
    const particleCount = category === 'marrones' ? 13 : 11;
    const nextParticles = Array.from({ length: particleCount }, () => {
      const id = this.particleId;
      this.particleId += 1;

      return {
        id,
        itemId: item.id,
        category,
        x: 14 + Math.random() * 72,
        drift: Math.floor(Math.random() * 44) - 22,
        delay: Math.floor(Math.random() * 160),
        duration: 560 + Math.floor(Math.random() * 240),
        size: 7 + Math.floor(Math.random() * 9),
        rotation: Math.floor(Math.random() * 220) - 110,
      };
    });

    this.particles.update((particles) => [...particles, ...nextParticles]);
    this.schedule(() => {
      const particleIds = new Set(nextParticles.map((particle) => particle.id));
      this.particles.update((particles) =>
        particles.filter((particle) => !particleIds.has(particle.id)),
      );
    }, 980);
  }

  private finishLevel(): void {
    if (this.finished) {
      return;
    }

    this.finished = true;
    this.clearTimers();
    this.activeItem.set(null);
    this.dragging.set(false);

    const timeBonus = this.remainingSeconds * 10;
    const accuracyBonus = Math.max(0, this.correct - this.mistakes) * 22;
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

  private updateHoverState(clientX: number, clientY: number): void {
    this.composterState.set(this.isOverComposter(clientX, clientY) ? 'hover' : 'normal');
  }

  private isOverComposter(clientX: number, clientY: number): boolean {
    const composter = this.compostStage.nativeElement.querySelector<HTMLElement>(
      '[data-compost-drop-zone]',
    );

    if (!composter) {
      return false;
    }

    const rect = composter.getBoundingClientRect();

    return (
      clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
    );
  }

  private getLocalPoint(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.compostStage.nativeElement.getBoundingClientRect();

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  private getCompostCategory(category: string): CompostCategory {
    return category === 'marrones' ? 'marrones' : 'verdes';
  }

  private spawnEffect(
    type: CompostEffect['type'],
    text: string,
    position: { x: number; y: number },
  ): void {
    const id = this.effectId;
    this.effectId += 1;
    const effect: CompostEffect = {
      id,
      type,
      text,
      x: position.x,
      y: position.y,
    };

    this.effects.update((effects) => [...effects, effect]);
    this.schedule(() => {
      this.effects.update((effects) => effects.filter((current) => current.id !== id));
    }, 860);
  }

  private emitTick(): void {
    this.tick.emit({
      score: this.score,
      remainingSeconds: this.remainingSeconds,
      completedItems: this.placedItemIds().size,
    });
  }

  private schedule(callback: () => void, delay: number): void {
    const timeout = setTimeout(() => {
      this.timeouts = this.timeouts.filter((current) => current !== timeout);
      callback();
    }, delay);

    this.timeouts.push(timeout);
  }

  private clearTimers(): void {
    clearInterval(this.timer);
    this.timer = undefined;
    this.timeouts.forEach((timeout) => clearTimeout(timeout));
    this.timeouts = [];
  }
}
