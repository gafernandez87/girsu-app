import Phaser from 'phaser';

import type { GameItem, GameStage } from '../../../core/app.models';
import type { SceneHooks } from '../game-canvas.types';
import { hexToNumber } from '../phaser-color.utils';

export class WasteJourneyScene extends Phaser.Scene {
  private score = 0;
  private correct = 0;
  private mistakes = 0;
  private remainingSeconds = 0;
  private finished = false;
  private timerEvent?: Phaser.Time.TimerEvent;

  constructor(
    private readonly stage: GameStage,
    private readonly hooks: SceneHooks,
  ) {
    super({ key: `waste-stage-${stage.id}` });
  }

  create(): void {
    this.remainingSeconds = this.stage.durationSeconds;
    this.drawEnvironment();
    this.createDropZones();
    this.createItems();
    this.createTimer();
    this.syncHud();
  }

  private drawEnvironment(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const background = hexToNumber(this.stage.backgroundColor);
    const accent = hexToNumber(this.stage.accentColor);

    this.add.rectangle(width / 2, height / 2, width, height, background);
    this.add.circle(width * 0.84, 78, 58, 0xffdc8a, 0.56);
    this.add.polygon(
      width * 0.5,
      126,
      [
        0,
        86,
        width * 0.18,
        24,
        width * 0.34,
        78,
        width * 0.48,
        10,
        width * 0.68,
        82,
        width,
        28,
        width,
        126,
      ],
      0x8ab17d,
      0.36,
    );

    this.add.text(22, 22, `Etapa ${this.stage.order}`, {
      color: '#243026',
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '14px',
      fontStyle: '700',
    });

    this.add.text(22, 44, this.stage.title, {
      color: '#152019',
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '24px',
      fontStyle: '800',
      wordWrap: { width: width - 44 },
    });

    if (this.stage.kind === 'conveyor') {
      this.add.rectangle(width / 2, height * 0.52, width - 44, 44, 0x607d8b, 0.92);
      this.add.rectangle(width / 2, height * 0.52, width - 64, 6, 0xcfd8dc, 0.8);
    }

    if (this.stage.kind === 'compost') {
      this.add.rectangle(width / 2, height * 0.55, width * 0.42, 98, 0x9c6b3d, 0.82);
      this.add.rectangle(width / 2, height * 0.59, width * 0.36, 16, 0x4f8f46, 0.78);
      this.add.rectangle(width / 2, height * 0.63, width * 0.36, 16, 0x74512f, 0.72);
    }

    if (this.stage.kind === 'landfill') {
      this.add.rectangle(width / 2, height * 0.58, width * 0.64, 150, 0x2b2331, 0.18);
      this.add.rectangle(width / 2, height * 0.58, width * 0.58, 126, 0x3d3350, 0.32);
      this.add.line(width / 2, 126, -78, 0, 78, 0, accent, 0.8).setLineWidth(6);
      this.add.line(width / 2 + 78, 126, 0, 0, 0, 58, accent, 0.8).setLineWidth(5);
    }
  }

  private createDropZones(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const zoneCount = this.stage.dropZones.length;
    const rows = zoneCount > 3 ? 2 : 1;
    const columns = Math.ceil(zoneCount / rows);
    const gap = 8;
    const zoneWidth = Math.min(150, (width - 32 - gap * (columns - 1)) / columns);
    const zoneHeight = 58;
    const bottom = height - 62;
    const startX = (width - (zoneWidth * columns + gap * (columns - 1))) / 2 + zoneWidth / 2;

    this.stage.dropZones.forEach((zone, index) => {
      const row = Math.floor(index / columns);
      const column = index % columns;
      const x = startX + column * (zoneWidth + gap);
      const y = bottom - (rows - row - 1) * (zoneHeight + gap);
      const color = hexToNumber(zone.color);

      this.add
        .rectangle(x, y, zoneWidth, zoneHeight, color, 0.92)
        .setStrokeStyle(2, 0xffffff, 0.92);
      this.add
        .text(x, y - 8, zone.label, {
          align: 'center',
          color: '#ffffff',
          fontFamily: 'Inter, Arial, sans-serif',
          fontSize: '12px',
          fontStyle: '800',
          wordWrap: { width: zoneWidth - 12 },
        })
        .setOrigin(0.5);
      this.add
        .text(x, y + 15, zone.shortLabel, {
          align: 'center',
          color: 'rgba(255,255,255,0.78)',
          fontFamily: 'Inter, Arial, sans-serif',
          fontSize: '10px',
          fontStyle: '700',
        })
        .setOrigin(0.5);

      this.add
        .zone(x, y, zoneWidth, zoneHeight)
        .setRectangleDropZone(zoneWidth, zoneHeight)
        .setData('zoneId', zone.id);
    });
  }

  private createItems(): void {
    const width = this.scale.width;
    const columns = width < 430 ? 2 : 3;
    const gapX = Math.min(132, (width - 44) / columns);
    const startX = width / 2 - ((columns - 1) * gapX) / 2;
    const startY = this.stage.kind === 'conveyor' ? 170 : 150;

    this.stage.items.forEach((item, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = startX + column * gapX;
      const y = startY + row * 66;
      const card = this.createItemCard(item, x, y);

      card.setData('homeX', x);
      card.setData('homeY', y);
    });

    this.input.on(
      Phaser.Input.Events.DRAG,
      (
        _pointer: Phaser.Input.Pointer,
        gameObject: Phaser.GameObjects.GameObject,
        dragX: number,
        dragY: number,
      ) => {
        const card = gameObject as Phaser.GameObjects.Container;
        card.x = dragX;
        card.y = dragY;
      },
    );

    this.input.on(
      Phaser.Input.Events.DRAG_END,
      (
        _pointer: Phaser.Input.Pointer,
        gameObject: Phaser.GameObjects.GameObject,
        dropped: boolean,
      ) => {
        if (!dropped) {
          this.returnHome(gameObject as Phaser.GameObjects.Container);
        }
      },
    );

    this.input.on(
      Phaser.Input.Events.DROP,
      (
        _pointer: Phaser.Input.Pointer,
        gameObject: Phaser.GameObjects.GameObject,
        dropZone: Phaser.GameObjects.GameObject,
      ) => this.handleDrop(gameObject as Phaser.GameObjects.Container, dropZone),
    );
  }

  private createItemCard(item: GameItem, x: number, y: number): Phaser.GameObjects.Container {
    const accent = hexToNumber(this.stage.accentColor);
    const card = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 112, 52, 0xffffff, 0.96).setStrokeStyle(2, accent, 0.2);
    const symbol = this.add
      .text(-36, 0, item.symbol, {
        align: 'center',
        color: this.stage.accentColor,
        fontFamily: 'Inter, Arial, sans-serif',
        fontSize: '13px',
        fontStyle: '900',
      })
      .setOrigin(0.5);
    const label = this.add
      .text(4, 0, item.label, {
        color: '#1f2b23',
        fontFamily: 'Inter, Arial, sans-serif',
        fontSize: '12px',
        fontStyle: '800',
        wordWrap: { width: 70 },
      })
      .setOrigin(0, 0.5);

    card.add([bg, symbol, label]);
    card.setSize(112, 52);
    card.setData('category', item.category);
    card.setData('points', item.points);
    card.setData('label', item.label);
    card.setInteractive({ cursor: 'grab' });
    this.input.setDraggable(card);

    return card;
  }

  private handleDrop(
    card: Phaser.GameObjects.Container,
    dropZone: Phaser.GameObjects.GameObject,
  ): void {
    if (card.getData('classified') || this.finished) {
      return;
    }

    const targetZone = dropZone as Phaser.GameObjects.Zone;
    const expected = card.getData('category') as string;
    const received = dropZone.getData('zoneId') as string;

    if (expected === received) {
      this.correct += 1;
      this.score += Number(card.getData('points') ?? 100);
      card.setData('classified', true);
      card.disableInteractive();

      this.tweens.add({
        targets: card,
        x: targetZone.x,
        y: targetZone.y,
        alpha: 0.42,
        scale: 0.84,
        duration: 160,
        ease: 'Quad.easeOut',
      });

      this.syncHud();

      if (this.correct === this.stage.items.length) {
        this.finishLevel();
      }

      return;
    }

    this.mistakes += 1;
    this.score = Math.max(0, this.score - 35);
    this.syncHud();
    this.returnHome(card);
  }

  private returnHome(card: Phaser.GameObjects.Container): void {
    this.tweens.add({
      targets: card,
      x: Number(card.getData('homeX')),
      y: Number(card.getData('homeY')),
      duration: 220,
      ease: 'Back.easeOut',
    });
  }

  private createTimer(): void {
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.finished) {
          return;
        }

        this.remainingSeconds -= 1;

        if (this.remainingSeconds <= 0) {
          this.remainingSeconds = 0;
          this.finishLevel();
          return;
        }

        this.syncHud();
      },
    });
  }

  private finishLevel(): void {
    if (this.finished) {
      return;
    }

    this.finished = true;
    this.timerEvent?.remove(false);

    const timeBonus = this.remainingSeconds * 10;
    const accuracyBonus = Math.max(0, this.correct - this.mistakes) * 15;
    this.score += timeBonus + accuracyBonus;

    this.add
      .rectangle(
        this.scale.width / 2,
        this.scale.height / 2,
        this.scale.width - 42,
        132,
        0xffffff,
        0.94,
      )
      .setStrokeStyle(3, hexToNumber(this.stage.accentColor), 0.28);
    this.add
      .text(this.scale.width / 2, this.scale.height / 2 - 30, 'Etapa registrada', {
        align: 'center',
        color: '#19231d',
        fontFamily: 'Inter, Arial, sans-serif',
        fontSize: '24px',
        fontStyle: '900',
      })
      .setOrigin(0.5);
    this.add
      .text(this.scale.width / 2, this.scale.height / 2 + 12, `${this.score} puntos`, {
        align: 'center',
        color: this.stage.accentColor,
        fontFamily: 'Inter, Arial, sans-serif',
        fontSize: '30px',
        fontStyle: '900',
      })
      .setOrigin(0.5);

    this.syncHud();
    this.hooks.onComplete({
      stageId: this.stage.id,
      score: this.score,
      correct: this.correct,
      mistakes: this.mistakes,
      remainingSeconds: this.remainingSeconds,
      completedAt: new Date().toISOString(),
    });
  }

  private syncHud(): void {
    this.hooks.onTick(this.score, this.remainingSeconds, this.correct);
  }
}
