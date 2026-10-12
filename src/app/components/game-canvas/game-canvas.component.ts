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
  inject,
  signal,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Capacitor } from '@capacitor/core';

import {
  DropZone,
  GameItem,
  GameStage,
  StageResult,
  StageScoreBreakdownItem,
} from '../../core/app.models';
import { GAME_ONE_PRODUCTS } from '../../core/game-1-products';
import { GameAudioService } from '../../core/game-audio.service';
import { normalizeRawStageScore } from '../../core/scoring';
import { shuffleGameItems } from '../../core/shuffle-game-items';
import {
  HOME_BACKGROUND_ASSET,
  HOME_BIN_ASSETS,
  HOME_BIN_ASSET_PATHS,
  HOME_PRODUCT_ASSETS,
  INDUSTRIAL_PRODUCT_ASSETS,
  COMPOST_PRODUCT_ASSETS,
} from './game-canvas.assets';
import type { BinVisualState, HomeEffect, StageTick } from './game-canvas.types';
import { CompostGameComponent } from './compost-game/compost-game.component';
import { IndustrialGameComponent } from './industrial-game/industrial-game.component';
import { LandfillGameComponent } from './landfill-game/landfill-game.component';
import { GameReviewComponent, GameReviewGroup } from './game-review/game-review.component';

type GameIntroState = 'intro' | 'countdown' | 'playing';
type HomePoint = { readonly x: number; readonly y: number };

interface HomeItemSlot {
  readonly id: number;
  readonly home: HomePoint;
  readonly item: GameItem;
  readonly position: HomePoint;
  readonly rotation: number;
}

interface HomeReviewItem {
  readonly item: GameItem;
  readonly correct: boolean;
  readonly chosenZoneId: string;
}

const HOME_VISIBLE_SLOT_COUNT = 3;
const RESULT_DISPLAY_MS = 4500;

@Component({
  selector: 'app-game-canvas',
  imports: [
    CompostGameComponent,
    IndustrialGameComponent,
    LandfillGameComponent,
    GameReviewComponent,
    RouterLink,
  ],
  templateUrl: './game-canvas.component.html',
  styleUrl: './game-canvas.component.scss',
})
export class GameCanvasComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) stage!: GameStage;
  @Output() completed = new EventEmitter<StageResult>();
  @ViewChild('homeStage', { static: true }) private readonly homeStage!: ElementRef<HTMLDivElement>;

  private readonly audio = inject(GameAudioService);

  readonly audioMuted = this.audio.muted;
  readonly isIos = Capacitor.getPlatform() === 'ios';
  readonly score = signal(0);
  readonly remainingSeconds = signal(0);
  readonly completedItems = signal(0);
  readonly completedResult = signal<StageResult | null>(null);
  readonly homeBackgroundPath = HOME_BACKGROUND_ASSET.path;
  readonly homeBackgroundImage = `url("${HOME_BACKGROUND_ASSET.path}")`;
  readonly homeBinStates = signal<Record<string, BinVisualState>>({});
  readonly homeDragging = signal(false);
  readonly homeDraggedSlotId = signal<number | null>(null);
  readonly homeEffects = signal<readonly HomeEffect[]>([]);
  readonly homeItemSlots = signal<readonly HomeItemSlot[]>([]);
  readonly reviewGroups = signal<readonly GameReviewGroup[]>([]);
  readonly reviewVisible = signal(false);
  readonly introState = signal<GameIntroState>('intro');
  readonly countdownSeconds = signal(3);

  private reviewTimer?: ReturnType<typeof setTimeout>;
  private resizeTimer?: ReturnType<typeof setTimeout>;
  private countdownTimer?: ReturnType<typeof setInterval>;
  private homeTimer?: ReturnType<typeof setInterval>;
  private homeStartFrame?: number;
  private homeTimeouts: Array<ReturnType<typeof setTimeout>> = [];
  private homeEffectId = 0;
  private homePendingItems: GameItem[] = [];
  private homePlayedItems: HomeReviewItem[] = [];
  private homeCorrect = 0;
  private homeMistakes = 0;
  private homeProcessed = 0;
  private homeStreak = 0;
  private homeFinished = false;
  private homeDragPointerId?: number;
  private homeDragOffset = { x: 0, y: 0 };

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
    this.clearCountdownTimer();
    this.destroyGame();
    this.audio.stopBackground();
  }

  @HostListener('window:resize')
  handleResize(): void {
    if (this.stage.id !== 'separacion-origen' || this.completedResult()) {
      return;
    }

    clearTimeout(this.resizeTimer);
    const shouldKeepPlaying = this.gameplayActive();
    this.resizeTimer = setTimeout(
      () => this.createGame({ startImmediately: shouldKeepPlaying }),
      180,
    );
  }

  @HostListener('window:pointermove', ['$event'])
  handleHomePointerMove(event: PointerEvent): void {
    if (!this.homeDragging() || event.pointerId !== this.homeDragPointerId) {
      return;
    }

    event.preventDefault();
    this.moveHomeSlot(event);
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

  private createGame(options: { startImmediately?: boolean } = {}): void {
    if (!this.stage) {
      return;
    }

    this.clearCountdownTimer();
    this.destroyGame();
    this.audio.stopBackground();
    this.resetSharedState();
    this.countdownSeconds.set(3);

    if (options.startImmediately) {
      this.introState.set('playing');
      this.startPlayableGame();
      return;
    }

    this.introState.set('intro');
  }

  private destroyGame(): void {
    clearTimeout(this.reviewTimer);
    this.reviewTimer = undefined;
    clearInterval(this.homeTimer);
    this.homeTimer = undefined;
    this.homeTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.homeTimeouts = [];

    if (this.homeStartFrame !== undefined) {
      window.cancelAnimationFrame(this.homeStartFrame);
      this.homeStartFrame = undefined;
    }

    this.homeDragging.set(false);
    this.homeDraggedSlotId.set(null);
    this.homeDragPointerId = undefined;
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
    return Math.min(HOME_PRODUCT_ASSETS[itemId]?.size ?? 96, 104);
  }

  homeSlotTransform(slot: HomeItemSlot): string {
    const scale = this.homeDraggedSlotId() === slot.id ? 1.08 : 1;

    return `translate3d(${slot.position.x}px, ${slot.position.y}px, 0) translate(-50%, -45%) scale(${scale})`;
  }

  isHomeSlotDragging(slotId: number): boolean {
    return this.homeDraggedSlotId() === slotId;
  }

  startHomeDrag(event: PointerEvent, slotId: number): void {
    const slot = this.homeSlot(slotId);

    if (this.homeFinished || !slot || this.completedResult()) {
      return;
    }

    event.preventDefault();
    const localPoint = this.getHomeLocalPoint(event.clientX, event.clientY);

    this.homeDragPointerId = event.pointerId;
    this.homeDraggedSlotId.set(slotId);
    this.homeDragOffset = {
      x: localPoint.x - slot.position.x,
      y: localPoint.y - slot.position.y,
    };
    this.homeDragging.set(true);

    const target = event.currentTarget as HTMLElement | null;
    target?.setPointerCapture?.(event.pointerId);
  }

  showReview(): void {
    if (!this.completedResult() || this.reviewGroups().length === 0) {
      return;
    }

    clearTimeout(this.reviewTimer);
    this.reviewTimer = undefined;
    this.reviewVisible.set(true);
  }

  private scheduleReview(): void {
    clearTimeout(this.reviewTimer);
    this.reviewVisible.set(false);
    this.reviewTimer = setTimeout(() => this.showReview(), RESULT_DISPLAY_MS);
  }

  restartCurrentGame(): void {
    this.createGame();
    this.startIntroCountdown();
  }

  audioToggleLabel(): string {
    return this.audioMuted() ? 'Activar sonido' : 'Silenciar sonido';
  }

  toggleAudio(): void {
    this.audio.toggleMuted();

    if (!this.audioMuted() && this.gameplayActive() && !this.completedResult()) {
      this.audio.startBackground(this.stage.id);
    }
  }

  homeAccuracyBonus(result: StageResult): number {
    return Math.max(0, result.correct - result.mistakes) * 20;
  }

  industrialAccuracyBonus(result: StageResult): number {
    return Math.max(0, result.correct - result.mistakes) * 18;
  }

  compostAccuracyBonus(result: StageResult): number {
    return Math.max(0, result.correct - result.mistakes) * 22;
  }

  landfillRawTotal(result: StageResult): number {
    return Math.round(result.rawScore ?? result.score);
  }

  landfillScoreBreakdown(result: StageResult): readonly StageScoreBreakdownItem[] {
    return result.scoreBreakdown ?? [];
  }

  signedScore(score: number): string {
    return score > 0 ? `+${score}` : `${score}`;
  }

  isUnsupportedStage(): boolean {
    return ![
      'separacion-origen',
      'valorizacion-industrial',
      'compostaje-domiciliario',
      'relleno-sanitario',
    ].includes(this.stage.id);
  }

  handleIndustrialTick(update: StageTick): void {
    this.score.set(update.score);
    this.remainingSeconds.set(update.remainingSeconds);
    this.completedItems.set(update.completedItems);
  }

  handleCompostTick(update: StageTick): void {
    this.score.set(update.score);
    this.remainingSeconds.set(update.remainingSeconds);
    this.completedItems.set(update.completedItems);
  }

  handleLandfillTick(update: StageTick): void {
    this.score.set(update.score);
    this.remainingSeconds.set(update.remainingSeconds);
    this.completedItems.set(update.completedItems);
  }

  reviewTitle(): string {
    if (this.stage.id === 'compostaje-domiciliario') {
      return '¡Qué materiales podemos compostar!';
    }
    return this.stage.id === 'separacion-origen'
      ? '¡Así se separan los residuos!'
      : '¡Así se clasifican los materiales!';
  }

  reviewDescription(): string {
    return this.stage.id === 'compostaje-domiciliario'
      ? 'Los materiales compostables van a la compostera. Separá los demás residuos en sus cestos.'
      : 'Cada residuo aparece en el cesto que le corresponde.';
  }

  reviewNextStageLink(): string {
    if (this.stage.id === 'compostaje-domiciliario') {
      return '/juego/relleno-sanitario';
    }
    return this.stage.id === 'separacion-origen'
      ? '/juego/valorizacion-industrial'
      : '/juego/compostaje-domiciliario';
  }

  reviewNextStageLabel(): string {
    return this.stage.id === 'separacion-origen'
      ? '¡Quiero visitar la planta de reciclaje!'
      : 'Próximo juego';
  }

  private createCompostReviewGroups(): readonly GameReviewGroup[] {
    const nonCompostableIds = new Set([
      'reciclables-botella-de-plastico-pet',
      'reciclables-botella-de-vidrio',
      'reciclables-lata-de-gaseosa',
      'no-reciclables-panal-descartable',
      'no-reciclables-colilla-de-cigarrillo',
      'no-reciclables-guantes-descartables',
    ]);
    return [
      {
        zone: {
          id: 'compostables',
          label: 'Compostables',
          shortLabel: 'Compostables',
          color: '#2f7d57',
          description:
            'Restos vegetales húmedos y materiales secos. Alterná las capas y mezclá con cuidado.',
        },
        items: this.stage.items.map((item) => ({
          id: item.id,
          label: item.label,
          imagePath: COMPOST_PRODUCT_ASSETS[item.id]?.path ?? '',
        })),
      },
      {
        zone: {
          id: 'no-compostables',
          label: 'No compostables',
          shortLabel: 'No compostables',
          color: '#9b421a',
          description:
            'Estos materiales no van a la compostera. Separá los reciclables y los no reciclables en sus cestos.',
        },
        items: GAME_ONE_PRODUCTS.filter((item) => nonCompostableIds.has(item.id)).map((item) => ({
          id: item.id,
          label: item.label,
          imagePath: item.path,
        })),
      },
    ];
  }

  handleStageCompleted(result: StageResult): void {
    const visibleResult = this.withVisibleStageScore(result);

    this.audio.playGameComplete();
    this.score.set(result.score);
    this.completedResult.set(visibleResult);
    this.completed.emit(visibleResult);

    if (this.stage.id === 'valorizacion-industrial') {
      this.reviewGroups.set(
        this.stage.dropZones.map((zone) => ({
          zone,
          items: this.stage.items
            .filter((item) => item.category === zone.id)
            .map((item) => ({
              id: item.id,
              label: item.label,
              imagePath: INDUSTRIAL_PRODUCT_ASSETS[item.id]?.path ?? '',
            })),
        })),
      );
      this.scheduleReview();
    } else if (this.stage.id === 'compostaje-domiciliario') {
      this.reviewGroups.set(this.createCompostReviewGroups());
      this.scheduleReview();
    }
  }

  gameplayActive(): boolean {
    return this.introState() === 'playing';
  }

  stageIntroText(): string {
    return this.stage.introText.trim() || this.stage.mechanic;
  }

  startIntroCountdown(): void {
    if (this.introState() !== 'intro') {
      return;
    }

    this.clearCountdownTimer();
    this.audio.unlock();
    this.countdownSeconds.set(3);
    this.introState.set('countdown');

    this.countdownTimer = setInterval(() => {
      const nextSecond = this.countdownSeconds() - 1;

      if (nextSecond <= 0) {
        this.clearCountdownTimer();
        this.introState.set('playing');
        this.startPlayableGame();
        return;
      }

      this.countdownSeconds.set(nextSecond);
    }, 1000);
  }

  private clearCountdownTimer(): void {
    clearInterval(this.countdownTimer);
    this.countdownTimer = undefined;
  }

  private startPlayableGame(): void {
    if (!this.isUnsupportedStage()) {
      this.audio.startBackground(this.stage.id);
    }

    if (this.stage.id === 'separacion-origen') {
      this.startHomeGame();
    }
  }

  private resetSharedState(): void {
    this.score.set(0);
    this.remainingSeconds.set(this.stage.durationSeconds);
    this.completedItems.set(0);
    this.completedResult.set(null);
    this.homeEffects.set([]);
    this.homeItemSlots.set([]);
    this.reviewGroups.set([]);
    this.reviewVisible.set(false);
    this.homePlayedItems = [];
    this.homeDraggedSlotId.set(null);
  }

  private startHomeGame(): void {
    this.homePendingItems = shuffleGameItems(this.stage.items);
    this.homePlayedItems = [];
    this.homeItemSlots.set([]);
    this.homeCorrect = 0;
    this.homeMistakes = 0;
    this.homeProcessed = 0;
    this.homeStreak = 0;
    this.homeFinished = false;
    this.homeEffectId = 0;
    this.homeBinStates.set(this.createHomeBinStates());

    this.homeStartFrame = window.requestAnimationFrame(() => {
      this.homeStartFrame = undefined;
      this.refillHomeSlots();
      this.startHomeTimer();

      if (this.homeDeckExhausted()) {
        this.finishHomeLevel();
      }
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

  private refillHomeSlots(): void {
    if (this.homeFinished) {
      return;
    }

    const homes = this.createHomeSlotHomes();
    const draggingSlotId = this.homeDraggedSlotId();
    const occupiedSlotIds = new Set<number>();
    const nextSlots = this.homeItemSlots().map((slot) => {
      const home = homes[slot.id] ?? slot.home;
      occupiedSlotIds.add(slot.id);

      return {
        ...slot,
        home,
        position: draggingSlotId === slot.id ? slot.position : home,
      };
    });

    for (let slotId = 0; slotId < HOME_VISIBLE_SLOT_COUNT; slotId += 1) {
      if (occupiedSlotIds.has(slotId)) {
        continue;
      }

      const nextItem = this.homePendingItems.shift();

      if (!nextItem) {
        continue;
      }

      const home = homes[slotId];

      if (!home) {
        continue;
      }

      nextSlots.push(this.createHomeSlot(slotId, nextItem, home));
    }

    this.homeItemSlots.set([...nextSlots].sort((left, right) => left.id - right.id));
  }

  private createHomeSlotHomes(): readonly HomePoint[] {
    const stage = this.homeStage.nativeElement;
    const rect = stage.getBoundingClientRect();
    const centerX = rect.width / 2;
    const y = rect.height < 650 ? rect.height * 0.36 : rect.height * 0.42;
    const spread = Math.min(rect.width < 520 ? rect.width * 0.31 : rect.width * 0.22, 190);

    return [
      { x: centerX - spread, y },
      { x: centerX, y: y - Math.min(10, rect.height * 0.015) },
      { x: centerX + spread, y },
    ];
  }

  private createHomeSlot(slotId: number, item: GameItem, home: HomePoint): HomeItemSlot {
    return {
      id: slotId,
      item,
      home,
      position: home,
      rotation: Math.floor(Math.random() * 11) - 5,
    };
  }

  private moveHomeSlot(event: PointerEvent): void {
    const slotId = this.homeDraggedSlotId();

    if (slotId === null) {
      return;
    }

    const stage = this.homeStage.nativeElement;
    const rect = stage.getBoundingClientRect();
    const localPoint = this.getHomeLocalPoint(event.clientX, event.clientY);
    const radius = 56;
    const x = Math.min(rect.width - radius, Math.max(radius, localPoint.x - this.homeDragOffset.x));
    const y = Math.min(
      rect.height - radius,
      Math.max(radius, localPoint.y - this.homeDragOffset.y),
    );

    this.updateHomeSlot(slotId, (slot) => ({
      ...slot,
      position: { x, y },
    }));
  }

  private finishHomeDrag(clientX: number, clientY: number): void {
    const slotId = this.homeDraggedSlotId();
    const slot = slotId === null ? undefined : this.homeSlot(slotId);

    this.homeDragging.set(false);
    this.homeDraggedSlotId.set(null);
    this.homeDragPointerId = undefined;

    if (!slot || this.homeFinished) {
      return;
    }

    const dropZone = this.getHomeDropZoneAt(clientX, clientY);
    this.homeBinStates.set(this.createHomeBinStates());

    if (!dropZone) {
      this.returnHomeSlot(slot.id);
      return;
    }

    if (dropZone.id === slot.item.category) {
      this.handleHomeCorrectDrop(slot, dropZone);
      return;
    }

    this.handleHomeWrongDrop(slot, dropZone);
  }

  private cancelHomeDrag(): void {
    const slotId = this.homeDraggedSlotId();

    this.homeDragging.set(false);
    this.homeDraggedSlotId.set(null);
    this.homeDragPointerId = undefined;
    this.homeBinStates.set(this.createHomeBinStates());

    if (slotId !== null) {
      this.returnHomeSlot(slotId);
    }
  }

  private handleHomeCorrectDrop(slot: HomeItemSlot, dropZone: DropZone): void {
    const item = slot.item;

    this.recordHomeReviewItem(item, true, dropZone.id);
    this.homeCorrect += 1;
    this.homeProcessed += 1;
    this.homeStreak += 1;

    const comboBonus = Math.max(0, this.homeStreak - 1) * 15;
    const points = item.points + comboBonus;
    this.score.set(this.score() + points);
    this.completedItems.set(this.homeProcessed);
    this.removeHomeSlot(slot.id);
    this.setHomeBinState(dropZone.id, 'open');
    const zoneCenter = this.getHomeZoneCenter(dropZone.id);
    this.audio.playCorrectDrop();
    this.spawnHomeEffect('score', `+${points}`, zoneCenter);
    this.spawnHomeEffect('success', undefined, zoneCenter);

    this.settleHomeDrop(dropZone.id);
  }

  private handleHomeWrongDrop(slot: HomeItemSlot, dropZone: DropZone): void {
    this.recordHomeReviewItem(slot.item, false, dropZone.id);
    this.homeMistakes += 1;
    this.homeProcessed += 1;
    this.homeStreak = 0;
    this.score.set(Math.max(0, this.score() - 40));
    this.completedItems.set(this.homeProcessed);
    this.removeHomeSlot(slot.id);
    this.setHomeBinState(dropZone.id, 'error');
    this.audio.playWrongDrop();
    this.spawnHomeEffect('error', '-40', this.getHomeZoneCenter(dropZone.id));

    this.settleHomeDrop(dropZone.id);
  }

  private finishHomeLevel(): void {
    if (this.homeFinished) {
      return;
    }

    this.homeFinished = true;
    clearInterval(this.homeTimer);
    this.homeTimer = undefined;
    this.homePendingItems = [];
    this.homeItemSlots.set([]);
    this.homeDragging.set(false);
    this.homeDraggedSlotId.set(null);
    this.homeDragPointerId = undefined;

    const timeBonus = this.remainingSeconds() * 10;
    const accuracyBonus = Math.max(0, this.homeCorrect - this.homeMistakes) * 20;
    const rawFinalScore = this.score() + timeBonus + accuracyBonus;
    const result = this.withVisibleStageScore({
      stageId: this.stage.id,
      score: rawFinalScore,
      correct: this.homeCorrect,
      mistakes: this.homeMistakes,
      remainingSeconds: this.remainingSeconds(),
      completedAt: new Date().toISOString(),
    });

    this.score.set(rawFinalScore);
    this.homeBinStates.set(this.createHomeBinStates('open'));
    this.reviewGroups.set(this.createHomeReviewGroups());
    this.audio.playGameComplete();
    this.completedResult.set(result);
    this.completed.emit(result);
    this.scheduleReview();
  }

  private returnHomeSlot(slotId: number): void {
    this.updateHomeSlot(slotId, (slot) => ({
      ...slot,
      position: slot.home,
    }));
  }

  private removeHomeSlot(slotId: number): void {
    this.homeItemSlots.update((slots) => slots.filter((slot) => slot.id !== slotId));
  }

  private settleHomeDrop(zoneId: string): void {
    this.scheduleHomeTimeout(() => {
      if (this.homeFinished) {
        return;
      }

      this.setHomeBinState(zoneId, 'normal');
      this.refillHomeSlots();

      if (this.homeDeckExhausted()) {
        this.finishHomeLevel();
      }
    }, 520);
  }

  private homeDeckExhausted(): boolean {
    return this.homePendingItems.length === 0 && this.homeItemSlots().length === 0;
  }

  private homeSlot(slotId: number): HomeItemSlot | undefined {
    return this.homeItemSlots().find((slot) => slot.id === slotId);
  }

  private updateHomeSlot(slotId: number, updater: (slot: HomeItemSlot) => HomeItemSlot): void {
    this.homeItemSlots.update((slots) =>
      slots.map((slot) => (slot.id === slotId ? updater(slot) : slot)),
    );
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
      return {
        x: stageRect.width / 2,
        y: stageRect.height / 2,
      };
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

  private createHomeBinStates(state: BinVisualState = 'normal'): Record<string, BinVisualState> {
    return Object.fromEntries(this.stage.dropZones.map((zone) => [zone.id, state]));
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
    }, 1280);
  }

  private scheduleHomeTimeout(callback: () => void, delay: number): void {
    const timeout = setTimeout(() => {
      this.homeTimeouts = this.homeTimeouts.filter((current) => current !== timeout);
      callback();
    }, delay);

    this.homeTimeouts.push(timeout);
  }

  private recordHomeReviewItem(item: GameItem, correct: boolean, chosenZoneId: string): void {
    this.homePlayedItems.push({ item, correct, chosenZoneId });
  }

  private createHomeReviewGroups(): readonly GameReviewGroup[] {
    return this.stage.dropZones.map((zone) => ({
      zone,
      items: this.homePlayedItems
        .filter((playedItem) => playedItem.item.category === zone.id)
        .map(({ item, correct }) => ({
          id: item.id,
          label: item.label,
          imagePath: this.homeProductImage(item.id),
          correct,
        })),
    }));
  }

  private withVisibleStageScore(result: StageResult): StageResult {
    return {
      ...result,
      score: this.visibleStageScore(result.score),
    };
  }

  private visibleStageScore(score: number): number {
    return normalizeRawStageScore(score, this.stage);
  }
}
