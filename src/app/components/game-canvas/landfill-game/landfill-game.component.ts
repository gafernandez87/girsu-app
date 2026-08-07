import {
  AfterViewInit,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  computed,
  signal,
} from '@angular/core';

import { GameStage, StageResult, StageScoreBreakdownItem } from '../../../core/app.models';
import { HOME_BIN_ASSET_PATHS } from '../game-canvas.assets';
import type { StageTick } from '../game-canvas.types';

const BOARD_COLUMNS = 8;
const BOARD_ROWS = 16;
const SAFETY_ROWS = 2;
const FALL_INTERVAL_MS = 760;
const SPAWN_DELAY_MS = 320;
const RECYCLABLE_MIN_PIECES = 3;
const RECYCLABLE_MAX_GAP = 5;
const RECYCLABLE_CHANCE = 0.18;
const RECYCLABLE_LANDFILL_PENALTY = 120;
const WRONG_RECYCLE_PENALTY = RECYCLABLE_LANDFILL_PENALTY * 2;
const LANDFILL_ASSET_BASE = '/assets/game-4/processed';
const LANDFILL_BAG_ASSETS = {
  black: `${LANDFILL_ASSET_BASE}/bags/bolsa-negra.png`,
  blue: `${LANDFILL_ASSET_BASE}/bags/bolsa-azul.png`,
  orange: `${LANDFILL_ASSET_BASE}/bags/bolsa-naranja.png`,
  green: `${LANDFILL_ASSET_BASE}/bags/bolsa-verde.png`,
  red: `${LANDFILL_ASSET_BASE}/bags/bolsa-roja.png`,
  violet: `${LANDFILL_ASSET_BASE}/bags/bolsa-violeta.png`,
} as const;
const LANDFILL_RECYCLE_BIN_ASSETS = {
  normal: HOME_BIN_ASSET_PATHS['bin-reciclables-normal'],
  ready: HOME_BIN_ASSET_PATHS['bin-reciclables-open'],
} as const;

interface LandfillGridCell {
  readonly id: string;
  readonly row: number;
  readonly column: number;
}

interface LandfillPoint {
  readonly x: number;
  readonly y: number;
}

type LandfillWasteKind = 'landfill' | 'recyclable';

interface LandfillPieceShape {
  readonly id: string;
  readonly label: string;
  readonly cells: readonly LandfillPoint[];
}

interface LandfillPieceDefinition extends LandfillPieceShape {
  readonly shapeId: string;
  readonly wasteKind: LandfillWasteKind;
  readonly bagImagePath: string;
}

interface LandfillActivePiece {
  readonly id: number;
  readonly definition: LandfillPieceDefinition;
  readonly cells: readonly LandfillPoint[];
  readonly x: number;
  readonly y: number;
  readonly rotation: number;
}

interface LandfillRenderCell {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly bagImagePath: string;
  readonly label: string;
  readonly wasteKind: LandfillWasteKind;
  readonly pieceGroupId: string;
  readonly edgeTop: boolean;
  readonly edgeRight: boolean;
  readonly edgeBottom: boolean;
  readonly edgeLeft: boolean;
}

type LandfillBoardCell = LandfillRenderCell;
type LandfillRenderCellBase = Omit<
  LandfillRenderCell,
  'edgeTop' | 'edgeRight' | 'edgeBottom' | 'edgeLeft'
>;
type LandfillEffectType = 'score' | 'warning' | 'recycle';

interface LandfillEffect {
  readonly id: number;
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly type: LandfillEffectType;
}

interface GestureStart {
  readonly x: number;
  readonly y: number;
  readonly startedAt: number;
}

const LANDFILL_GRID_CELLS: readonly LandfillGridCell[] = Array.from(
  { length: BOARD_COLUMNS * BOARD_ROWS },
  (_, index) => ({
    id: `landfill-grid-${index}`,
    row: Math.floor(index / BOARD_COLUMNS),
    column: index % BOARD_COLUMNS,
  }),
);

const LANDFILL_PIECE_SHAPES = [
  {
    id: 'line-five',
    label: 'Bolsa larga',
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 4, y: 0 },
    ],
  },
  {
    id: 'square',
    label: 'Bloque compacto',
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
  },
  {
    id: 'tee',
    label: 'Bolsa T',
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
    ],
  },
  {
    id: 'ell',
    label: 'Bolsa L',
    cells: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ],
  },
  {
    id: 'jay',
    label: 'Bolsa J',
    cells: [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 0, y: 2 },
    ],
  },
  {
    id: 'zig',
    label: 'Bolsa Z',
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ],
  },
  {
    id: 'zag',
    label: 'Bolsa S',
    cells: [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
  },
] as const satisfies readonly LandfillPieceShape[];

const INITIAL_LANDFILL_PIECE = createLandfillPieceDefinition(LANDFILL_PIECE_SHAPES[0], 'landfill');

function createLandfillPieceDefinition(
  shape: LandfillPieceShape,
  wasteKind: LandfillWasteKind,
): LandfillPieceDefinition {
  const isRecyclable = wasteKind === 'recyclable';

  return {
    ...shape,
    id: `${shape.id}-${wasteKind}`,
    shapeId: shape.id,
    label: `${shape.label} ${isRecyclable ? 'reciclable' : 'no reciclable'}`,
    wasteKind,
    bagImagePath: isRecyclable ? LANDFILL_BAG_ASSETS.green : LANDFILL_BAG_ASSETS.black,
  };
}

@Component({
  selector: 'app-landfill-game',
  templateUrl: './landfill-game.component.html',
  styleUrl: './landfill-game.component.scss',
})
export class LandfillGameComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) stage!: GameStage;
  @Output() tick = new EventEmitter<StageTick>();
  @Output() completed = new EventEmitter<StageResult>();

  readonly safetyRows = SAFETY_ROWS;
  readonly gridCells = LANDFILL_GRID_CELLS;
  readonly boardCells = signal<readonly LandfillBoardCell[]>([]);
  readonly activePiece = signal<LandfillActivePiece | null>(null);
  readonly nextPiece = signal<LandfillPieceDefinition>(INITIAL_LANDFILL_PIECE);
  readonly effects = signal<readonly LandfillEffect[]>([]);
  readonly placedPieces = signal(0);
  readonly compactedLayers = signal(0);
  readonly recycledPieces = signal(0);

  readonly activeCells = computed(() => {
    const piece = this.activePiece();
    return piece ? this.renderPieceCells(piece) : [];
  });

  readonly ghostCells = computed(() => {
    const piece = this.activePiece();

    if (!piece || piece.definition.wasteKind === 'recyclable') {
      return [];
    }

    return this.renderPieceCells({ ...piece, y: this.findLandingY(piece) });
  });

  readonly previewShape = computed(() => {
    const piece = this.nextPiece();
    const cells = this.normalizeCells(piece.cells);

    return {
      piece,
      cells,
      columns: this.pieceWidth(cells),
      rows: this.pieceHeight(cells),
    };
  });

  readonly previewCells = computed(() => {
    const { piece, cells } = this.previewShape();
    return this.withPieceBorders(
      cells.map((cell, index) => ({
        id: `preview-${piece.id}-${index}`,
        x: cell.x,
        y: cell.y,
        bagImagePath: piece.bagImagePath,
        label: piece.label,
        wasteKind: piece.wasteKind,
        pieceGroupId: `preview-${piece.id}`,
      })),
    );
  });

  readonly previewGridColumns = computed(
    () => `repeat(${this.previewShape().columns}, var(--landfill-preview-cell-size))`,
  );

  readonly previewGridRows = computed(
    () => `repeat(${this.previewShape().rows}, var(--landfill-preview-cell-size))`,
  );

  readonly compactionQuality = computed(() => {
    const holes = this.countHolesForCells(this.boardCells());
    return Math.max(0, 100 - Math.min(90, holes * 12));
  });

  readonly dangerActive = computed(() => this.boardCells().some((cell) => cell.y < SAFETY_ROWS));

  readonly recycleBinReady = computed(
    () => this.activePiece()?.definition.wasteKind === 'recyclable',
  );
  readonly recycleBinCanReceive = computed(() => this.activePiece() !== null);

  private viewReady = false;
  private score = 0;
  private correct = 0;
  private mistakes = 0;
  private streak = 0;
  private remainingSeconds = 0;
  private finished = false;
  private pieceId = 0;
  private effectId = 0;
  private generatedPieces = 0;
  private piecesSinceRecyclable = 0;
  private landfillPlacementScore = 0;
  private recycleScore = 0;
  private softDropScore = 0;
  private recyclableLandfillPenalty = 0;
  private wrongRecyclePenalty = 0;
  private stageTimer?: ReturnType<typeof setInterval>;
  private fallTimer?: ReturnType<typeof setInterval>;
  private timeouts: Array<ReturnType<typeof setTimeout>> = [];
  private gestureStart?: GestureStart;

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

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (!this.canControl()) {
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.moveLeft();
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.moveRight();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.softDrop();
      return;
    }

    if (event.key === 'ArrowUp' || event.key === ' ') {
      event.preventDefault();
      this.rotatePiece();
    }
  }

  canControl(): boolean {
    return !this.finished && this.activePiece() !== null;
  }

  cranePosition(): string {
    const piece = this.activePiece();
    const cells = piece?.cells ?? this.nextPiece().cells;
    const pieceX = piece?.x ?? Math.floor((BOARD_COLUMNS - this.pieceWidth(cells)) / 2);
    const targetCenter = pieceX + this.pieceWidth(cells) / 2;
    const carriedPieceWidth = this.previewShape().columns;
    const minCenter = carriedPieceWidth / 2;
    const maxCenter = BOARD_COLUMNS - carriedPieceWidth / 2;
    const center = Math.min(maxCenter, Math.max(minCenter, targetCenter));

    return `${Number(((center / BOARD_COLUMNS) * 100).toFixed(2))}%`;
  }

  gridColumn(x: number): string {
    return `${x + 1}`;
  }

  gridRow(y: number): string {
    return `${y + 1}`;
  }

  recycleBinImagePath(): string {
    return this.recycleBinReady()
      ? LANDFILL_RECYCLE_BIN_ASSETS.ready
      : LANDFILL_RECYCLE_BIN_ASSETS.normal;
  }

  stopRecycleBinGesture(event: PointerEvent): void {
    event.stopPropagation();
  }

  recycleFromBin(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const piece = this.activePiece();

    if (!piece || this.finished) {
      return;
    }

    if (piece.definition.wasteKind === 'recyclable') {
      this.recycleActivePiece();
      return;
    }

    this.handleWrongRecycle();
  }

  startBoardGesture(event: PointerEvent): void {
    const target = event.target as HTMLElement | null;

    if (target?.closest('button')) {
      return;
    }

    this.gestureStart = {
      x: event.clientX,
      y: event.clientY,
      startedAt: Date.now(),
    };
  }

  finishBoardGesture(event: PointerEvent): void {
    if (!this.gestureStart || !this.canControl()) {
      this.gestureStart = undefined;
      return;
    }

    const dx = event.clientX - this.gestureStart.x;
    const dy = event.clientY - this.gestureStart.y;
    const elapsed = Date.now() - this.gestureStart.startedAt;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    this.gestureStart = undefined;

    if (absX < 14 && absY < 14 && elapsed < 420) {
      this.rotatePiece();
      return;
    }

    if (absX > absY) {
      if (dx < 0) {
        this.moveLeft();
      } else {
        this.moveRight();
      }
      return;
    }

    if (dy > 16) {
      this.softDrop();
    }
  }

  cancelBoardGesture(): void {
    this.gestureStart = undefined;
  }

  moveLeft(): void {
    this.moveActivePiece(-1, 0);
  }

  moveRight(): void {
    this.moveActivePiece(1, 0);
  }

  softDrop(): void {
    if (!this.canControl()) {
      return;
    }

    if (this.moveActivePiece(0, 1)) {
      this.score += 2;
      this.softDropScore += 2;
      this.emitTick();
      return;
    }

    this.lockActivePiece();
  }

  rotatePiece(): void {
    const piece = this.activePiece();

    if (!piece || !this.canControl()) {
      return;
    }

    const rotatedCells = this.rotateCells(piece.cells);
    const wallKicks = [0, -1, 1, -2, 2];

    for (const kick of wallKicks) {
      const nextX = piece.x + kick;

      if (this.canPlace(rotatedCells, nextX, piece.y)) {
        this.activePiece.set({
          ...piece,
          cells: rotatedCells,
          x: nextX,
          rotation: (piece.rotation + 90) % 360,
        });
        return;
      }
    }
  }

  private startGame(): void {
    this.clearTimers();
    this.score = 0;
    this.correct = 0;
    this.mistakes = 0;
    this.streak = 0;
    this.remainingSeconds = this.stage.durationSeconds;
    this.finished = false;
    this.pieceId = 0;
    this.effectId = 0;
    this.generatedPieces = 0;
    this.piecesSinceRecyclable = 0;
    this.landfillPlacementScore = 0;
    this.recycleScore = 0;
    this.softDropScore = 0;
    this.recyclableLandfillPenalty = 0;
    this.wrongRecyclePenalty = 0;
    this.gestureStart = undefined;
    this.boardCells.set([]);
    this.activePiece.set(null);
    this.nextPiece.set(this.randomPiece());
    this.effects.set([]);
    this.placedPieces.set(0);
    this.compactedLayers.set(0);
    this.recycledPieces.set(0);
    this.emitTick();

    this.schedule(() => this.spawnPiece(), 180);
    this.startStageTimer();
    this.startFallTimer();
  }

  private startStageTimer(): void {
    this.stageTimer = setInterval(() => {
      if (this.finished) {
        return;
      }

      this.remainingSeconds = Math.max(0, this.remainingSeconds - 1);
      this.emitTick();

      if (this.remainingSeconds === 0) {
        this.finishLevel('time');
      }
    }, 1000);
  }

  private startFallTimer(): void {
    this.fallTimer = setInterval(() => this.advanceFall(), FALL_INTERVAL_MS);
  }

  private advanceFall(): void {
    if (this.finished) {
      return;
    }

    if (!this.activePiece()) {
      return;
    }

    if (!this.moveActivePiece(0, 1)) {
      this.lockActivePiece();
    }
  }

  private spawnPiece(): void {
    if (this.finished || this.activePiece()) {
      return;
    }

    const definition = this.nextPiece();
    const cells = definition.cells;
    const x = Math.max(0, Math.floor((BOARD_COLUMNS - this.pieceWidth(cells)) / 2));
    const piece: LandfillActivePiece = {
      id: this.pieceId,
      definition,
      cells,
      x,
      y: 0,
      rotation: 0,
    };

    this.pieceId += 1;
    this.nextPiece.set(this.randomPiece(definition.shapeId));

    if (!this.canPlace(piece.cells, piece.x, piece.y)) {
      this.finishLevel('collapse');
      return;
    }

    this.activePiece.set(piece);
  }

  private moveActivePiece(dx: number, dy: number): boolean {
    const piece = this.activePiece();

    if (!piece || this.finished) {
      return false;
    }

    const nextX = piece.x + dx;
    const nextY = piece.y + dy;

    if (!this.canPlace(piece.cells, nextX, nextY)) {
      if (this.canSendToRecycleBin(piece, dx, dy)) {
        this.recycleActivePiece();
        return true;
      }

      return false;
    }

    this.activePiece.set({
      ...piece,
      x: nextX,
      y: nextY,
    });
    return true;
  }

  private canSendToRecycleBin(piece: LandfillActivePiece, dx: number, dy: number): boolean {
    if (piece.definition.wasteKind !== 'recyclable' || dx >= 0 || dy !== 0) {
      return false;
    }

    const leftmostCell = Math.min(...piece.cells.map((cell) => piece.x + cell.x));
    return leftmostCell <= 0;
  }

  private recycleActivePiece(): void {
    const piece = this.activePiece();

    if (!piece || this.finished || piece.definition.wasteKind !== 'recyclable') {
      return;
    }

    const recycledPoints = 140 + piece.cells.length * 32 + this.streak * 10;

    this.score += recycledPoints;
    this.recycleScore += recycledPoints;
    this.correct += 2;
    this.streak += 1;
    this.activePiece.set(null);
    this.placedPieces.update((pieces) => pieces + 1);
    this.recycledPieces.update((pieces) => pieces + 1);
    this.spawnEffect('Reciclado', 16, 33, 'recycle');
    this.spawnEffect(`+${recycledPoints}`, 16, 39, 'score');
    this.emitTick();
    this.schedule(() => this.spawnPiece(), SPAWN_DELAY_MS);
  }

  private handleWrongRecycle(): void {
    const penalty = this.applyScorePenalty(WRONG_RECYCLE_PENALTY);

    this.mistakes += 1;
    this.streak = 0;
    this.wrongRecyclePenalty += penalty;
    this.activePiece.set(null);
    this.placedPieces.update((pieces) => pieces + 1);
    this.spawnEffect('No reciclable', 16, 33, 'warning');
    if (penalty > 0) {
      this.spawnEffect(`-${penalty}`, 16, 39, 'warning');
    }
    this.emitTick();
    this.schedule(() => this.spawnPiece(), SPAWN_DELAY_MS);
  }

  private lockActivePiece(): void {
    const piece = this.activePiece();

    if (!piece || this.finished) {
      return;
    }

    const landedCells = this.renderPieceCells(piece).filter((cell) => cell.y >= 0);

    if (landedCells.length !== piece.cells.length) {
      this.finishLevel('collapse');
      return;
    }

    const previousCells = this.boardCells();
    const previousHoles = this.countHolesForCells(previousCells);
    const withPiece = [...previousCells, ...landedCells];
    const compacted = this.compactFullRows(withPiece);
    const nextCells = compacted.cells;
    const holesCreated = Math.max(0, this.countHolesForCells(nextCells) - previousHoles);
    const layerCount = compacted.rows.length;
    const recyclableMisplaced = piece.definition.wasteKind === 'recyclable';
    const efficientPlacement = !recyclableMisplaced && (holesCreated === 0 || layerCount > 0);
    const basePoints = landedCells.length * 24;
    const layerBonus = layerCount * 150 + Math.max(0, layerCount - 1) * 90;
    const compactionBonus = efficientPlacement ? 60 + this.streak * 12 : 0;
    const holePenalty = holesCreated * 34;
    const earnedPoints = recyclableMisplaced
      ? 0
      : Math.max(12, basePoints + layerBonus + compactionBonus - holePenalty);
    let misplacedPenalty = 0;

    if (recyclableMisplaced) {
      misplacedPenalty = this.applyScorePenalty(RECYCLABLE_LANDFILL_PENALTY);
      this.recyclableLandfillPenalty += misplacedPenalty;
      this.mistakes += 2;
      this.streak = 0;
    } else if (efficientPlacement) {
      this.correct += 1 + layerCount;
      this.streak += 1;
    } else {
      this.mistakes += Math.max(1, holesCreated);
      this.streak = 0;
    }

    if (!recyclableMisplaced) {
      this.score += earnedPoints;
      this.landfillPlacementScore += earnedPoints;
    }

    this.boardCells.set(nextCells);
    this.activePiece.set(null);
    this.placedPieces.update((pieces) => pieces + 1);
    this.compactedLayers.update((layers) => layers + layerCount);
    if (recyclableMisplaced) {
      this.spawnEffect(
        'Reciclable al foso',
        this.effectX(landedCells),
        this.effectY(landedCells),
        'warning',
      );
      if (misplacedPenalty > 0) {
        this.spawnEffect(
          `-${misplacedPenalty}`,
          this.effectX(landedCells),
          this.effectY(landedCells) + 8,
          'warning',
        );
      }
    } else {
      this.spawnEffect(
        `+${earnedPoints}`,
        this.effectX(landedCells),
        this.effectY(landedCells),
        'score',
      );
    }

    if (holesCreated > 0 && !recyclableMisplaced) {
      this.spawnEffect(
        'Huecos',
        this.effectX(landedCells),
        this.effectY(landedCells) + 8,
        'warning',
      );
    }

    this.emitTick();

    if (this.isCollapsed(nextCells)) {
      this.finishLevel('collapse');
      return;
    }

    this.schedule(() => this.spawnPiece(), SPAWN_DELAY_MS);
  }

  private finishLevel(reason: 'time' | 'collapse'): void {
    if (this.finished) {
      return;
    }

    this.finished = true;
    this.clearTimers();
    this.activePiece.set(null);
    this.gestureStart = undefined;

    const survivedSeconds = this.stage.durationSeconds - this.remainingSeconds;
    const survivalBonus = survivedSeconds * 6;
    const precisionBonus = Math.max(0, this.correct - this.mistakes) * 20;
    const sealedLayerBonus = this.compactedLayers() * 90;
    const fullRunBonus = reason === 'time' ? 260 : 0;
    const rawScoreBeforeBonuses = this.score;
    const scoreBreakdown = this.createScoreBreakdown({
      rawScoreBeforeBonuses,
      survivalBonus,
      precisionBonus,
      sealedLayerBonus,
      fullRunBonus,
    });

    this.score += survivalBonus + precisionBonus + sealedLayerBonus + fullRunBonus;
    this.emitTick();
    this.completed.emit({
      stageId: this.stage.id,
      score: this.score,
      rawScore: this.score,
      scoreBreakdown,
      correct: this.correct,
      mistakes: this.mistakes,
      remainingSeconds: this.remainingSeconds,
      completedAt: new Date().toISOString(),
    });
  }

  private renderPieceCells(piece: LandfillActivePiece): readonly LandfillRenderCell[] {
    return this.withPieceBorders(
      piece.cells.map((cell, index) => ({
        id: `${piece.id}-${index}`,
        x: piece.x + cell.x,
        y: piece.y + cell.y,
        bagImagePath: piece.definition.bagImagePath,
        label: piece.definition.label,
        wasteKind: piece.definition.wasteKind,
        pieceGroupId: `piece-${piece.id}`,
      })),
    );
  }

  private withPieceBorders(
    cells: readonly LandfillRenderCellBase[],
  ): readonly LandfillRenderCell[] {
    const occupied = new Set(
      cells.map((cell) => this.pieceCellKey(cell.pieceGroupId, cell.x, cell.y)),
    );

    return cells.map((cell) => ({
      ...cell,
      edgeTop: !occupied.has(this.pieceCellKey(cell.pieceGroupId, cell.x, cell.y - 1)),
      edgeRight: !occupied.has(this.pieceCellKey(cell.pieceGroupId, cell.x + 1, cell.y)),
      edgeBottom: !occupied.has(this.pieceCellKey(cell.pieceGroupId, cell.x, cell.y + 1)),
      edgeLeft: !occupied.has(this.pieceCellKey(cell.pieceGroupId, cell.x - 1, cell.y)),
    }));
  }

  private canPlace(cells: readonly LandfillPoint[], x: number, y: number): boolean {
    const occupied = new Set(this.boardCells().map((cell) => this.cellKey(cell.x, cell.y)));

    return cells.every((cell) => {
      const nextX = x + cell.x;
      const nextY = y + cell.y;

      if (nextX < 0 || nextX >= BOARD_COLUMNS || nextY >= BOARD_ROWS) {
        return false;
      }

      return nextY < 0 || !occupied.has(this.cellKey(nextX, nextY));
    });
  }

  private findLandingY(piece: LandfillActivePiece): number {
    let y = piece.y;

    while (this.canPlace(piece.cells, piece.x, y + 1)) {
      y += 1;
    }

    return y;
  }

  private rotateCells(cells: readonly LandfillPoint[]): readonly LandfillPoint[] {
    return this.normalizeCells(cells.map((cell) => ({ x: cell.y, y: -cell.x })));
  }

  private normalizeCells(cells: readonly LandfillPoint[]): readonly LandfillPoint[] {
    const minX = Math.min(...cells.map((cell) => cell.x));
    const minY = Math.min(...cells.map((cell) => cell.y));

    return cells
      .map((cell) => ({
        x: cell.x - minX,
        y: cell.y - minY,
      }))
      .sort((first, second) => first.y - second.y || first.x - second.x);
  }

  private compactFullRows(cells: readonly LandfillBoardCell[]): {
    readonly cells: readonly LandfillBoardCell[];
    readonly rows: readonly number[];
  } {
    const rowCounts = Array.from({ length: BOARD_ROWS }, () => 0);

    cells.forEach((cell) => {
      rowCounts[cell.y] += 1;
    });

    const fullRows = rowCounts.flatMap((count, row) => (count >= BOARD_COLUMNS ? [row] : []));

    if (fullRows.length === 0) {
      return { cells, rows: [] };
    }

    const fullRowSet = new Set(fullRows);
    const shiftedCells = cells
      .filter((cell) => !fullRowSet.has(cell.y))
      .map((cell) => ({
        ...cell,
        y: cell.y + fullRows.filter((row) => row > cell.y).length,
      }));

    return { cells: this.withPieceBorders(shiftedCells), rows: fullRows };
  }

  private countHolesForCells(cells: readonly LandfillBoardCell[]): number {
    const occupied = new Set(cells.map((cell) => this.cellKey(cell.x, cell.y)));
    let holes = 0;

    for (let x = 0; x < BOARD_COLUMNS; x += 1) {
      let hasBagAbove = false;

      for (let y = 0; y < BOARD_ROWS; y += 1) {
        if (occupied.has(this.cellKey(x, y))) {
          hasBagAbove = true;
        } else if (hasBagAbove) {
          holes += 1;
        }
      }
    }

    return holes;
  }

  private isCollapsed(cells: readonly LandfillBoardCell[]): boolean {
    return cells.some((cell) => cell.y < SAFETY_ROWS);
  }

  private pieceWidth(cells: readonly LandfillPoint[]): number {
    return Math.max(...cells.map((cell) => cell.x)) + 1;
  }

  private pieceHeight(cells: readonly LandfillPoint[]): number {
    return Math.max(...cells.map((cell) => cell.y)) + 1;
  }

  private randomPiece(excludedShapeId?: string): LandfillPieceDefinition {
    const candidates = LANDFILL_PIECE_SHAPES.filter((piece) => piece.id !== excludedShapeId);
    const shapes = candidates.length > 0 ? candidates : LANDFILL_PIECE_SHAPES;
    const shape = shapes[Math.floor(Math.random() * shapes.length)] ?? LANDFILL_PIECE_SHAPES[0];

    return createLandfillPieceDefinition(shape, this.nextWasteKind());
  }

  private nextWasteKind(): LandfillWasteKind {
    this.generatedPieces += 1;

    const canRecycle = this.generatedPieces > RECYCLABLE_MIN_PIECES;
    const shouldForceRecycle = canRecycle && this.piecesSinceRecyclable >= RECYCLABLE_MAX_GAP;
    const shouldRandomRecycle = canRecycle && Math.random() < RECYCLABLE_CHANCE;

    if (shouldForceRecycle || shouldRandomRecycle) {
      this.piecesSinceRecyclable = 0;
      return 'recyclable';
    }

    this.piecesSinceRecyclable += 1;
    return 'landfill';
  }

  private effectX(cells: readonly LandfillRenderCell[]): number {
    const center = cells.reduce((total, cell) => total + cell.x + 0.5, 0) / cells.length;
    return Math.min(86, Math.max(14, (center / BOARD_COLUMNS) * 100));
  }

  private effectY(cells: readonly LandfillRenderCell[]): number {
    const top = Math.min(...cells.map((cell) => cell.y));
    return Math.min(82, Math.max(20, 23 + (top / BOARD_ROWS) * 62));
  }

  private spawnEffect(text: string, x: number, y: number, type: LandfillEffectType): void {
    const id = this.effectId;
    this.effectId += 1;

    this.effects.update((effects) => [...effects, { id, text, x, y, type }]);
    this.schedule(() => {
      this.effects.update((effects) => effects.filter((effect) => effect.id !== id));
    }, 1280);
  }

  private createScoreBreakdown({
    rawScoreBeforeBonuses,
    survivalBonus,
    precisionBonus,
    sealedLayerBonus,
    fullRunBonus,
  }: {
    readonly rawScoreBeforeBonuses: number;
    readonly survivalBonus: number;
    readonly precisionBonus: number;
    readonly sealedLayerBonus: number;
    readonly fullRunBonus: number;
  }): readonly StageScoreBreakdownItem[] {
    const knownOperationScore =
      this.landfillPlacementScore +
      this.recycleScore +
      this.softDropScore -
      this.recyclableLandfillPenalty -
      this.wrongRecyclePenalty;
    const scoreAdjustment = rawScoreBeforeBonuses - knownOperationScore;

    return [
      {
        id: 'landfill-placement',
        label: 'Bolsas negras al foso',
        score: this.landfillPlacementScore,
      },
      { id: 'landfill-recycling', label: 'Reciclaje correcto', score: this.recycleScore },
      { id: 'landfill-soft-drop', label: 'Descenso manual', score: this.softDropScore },
      { id: 'landfill-adjustment', label: 'Operacion', score: scoreAdjustment },
      { id: 'landfill-durability', label: 'Vida util', score: survivalBonus },
      { id: 'landfill-compaction', label: 'Compactacion', score: precisionBonus },
      { id: 'landfill-layers', label: 'Capas selladas', score: sealedLayerBonus },
      { id: 'landfill-full-run', label: 'Fosa sostenida', score: fullRunBonus },
      {
        id: 'landfill-recyclable-penalty',
        label: 'Verdes al foso',
        score: -this.recyclableLandfillPenalty,
      },
      {
        id: 'landfill-wrong-bin-penalty',
        label: 'Negras al tacho verde',
        score: -this.wrongRecyclePenalty,
      },
    ].filter((item) => item.score !== 0);
  }

  private applyScorePenalty(points: number): number {
    const penalty = Math.min(this.score, points);
    this.score -= penalty;
    return penalty;
  }

  private cellKey(x: number, y: number): string {
    return `${x}:${y}`;
  }

  private pieceCellKey(pieceGroupId: string, x: number, y: number): string {
    return `${pieceGroupId}:${x}:${y}`;
  }

  private emitTick(): void {
    this.tick.emit({
      score: this.score,
      remainingSeconds: this.remainingSeconds,
      completedItems: this.placedPieces(),
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
    clearInterval(this.stageTimer);
    clearInterval(this.fallTimer);
    this.stageTimer = undefined;
    this.fallTimer = undefined;
    this.timeouts.forEach((timeout) => clearTimeout(timeout));
    this.timeouts = [];
  }
}
