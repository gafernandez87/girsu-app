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
  ViewChild
} from '@angular/core';
import Phaser from 'phaser';

import { DropZone, GameItem, GameStage, StageResult } from '../../core/app.models';

interface SceneHooks {
  readonly onTick: (score: number, remainingSeconds: number, feedback: string) => void;
  readonly onComplete: (result: StageResult) => void;
}

interface ProductAsset {
  readonly key: string;
  readonly path: string;
  readonly size: number;
  readonly offsetY?: number;
}

type BinVisualState = 'normal' | 'hover' | 'open' | 'error';

interface BinAssets {
  readonly normal: string;
  readonly hover: string;
  readonly open: string;
  readonly error: string;
}

const HOME_BACKGROUND_ASSET = {
  key: 'game-1-background',
  path: '/assets/game-1/backgrounds/fondo juego 1.png'
};

const HOME_PRODUCT_ASSETS: Record<string, ProductAsset> = {
  'botella-pet': {
    key: 'product-botella-pet',
    path: '/assets/game-1/products/processed/botella.png',
    size: 102,
    offsetY: -2
  },
  'frasco-vidrio': {
    key: 'product-frasco-vidrio',
    path: '/assets/game-1/products/processed/tarro-vidrio.png',
    size: 102,
    offsetY: -2
  },
  carton: {
    key: 'product-carton',
    path: '/assets/game-1/products/processed/caja-carton.png',
    size: 98,
    offsetY: -4
  },
  cascara: {
    key: 'product-cascara',
    path: '/assets/game-1/products/processed/cascaras.png',
    size: 108,
    offsetY: -2
  },
  yerba: {
    key: 'product-yerba',
    path: '/assets/game-1/products/processed/yerba.png',
    size: 106,
    offsetY: -1
  },
  envoltorio: {
    key: 'product-envoltorio',
    path: '/assets/game-1/products/processed/envoltorio-dulce.png',
    size: 106,
    offsetY: -2
  }
};

const HOME_BIN_ASSETS: Record<string, BinAssets> = {
  reciclables: {
    normal: 'bin-reciclables-normal',
    hover: 'bin-reciclables-hover',
    open: 'bin-reciclables-open',
    error: 'bin-reciclables-error'
  },
  'no-reciclables': {
    normal: 'bin-no-reciclables-normal',
    hover: 'bin-no-reciclables-hover',
    open: 'bin-no-reciclables-open',
    error: 'bin-no-reciclables-error'
  },
  compostables: {
    normal: 'bin-compostables-normal',
    hover: 'bin-compostables-hover',
    open: 'bin-compostables-open',
    error: 'bin-compostables-error'
  }
};

const HOME_BIN_ASSET_PATHS: Record<string, string> = {
  'bin-reciclables-normal': '/assets/game-1/bins/processed/reciclables-normal.png',
  'bin-reciclables-hover': '/assets/game-1/bins/processed/reciclables-hover.png',
  'bin-reciclables-open': '/assets/game-1/bins/processed/reciclables-open.png',
  'bin-reciclables-error': '/assets/game-1/bins/processed/reciclables-error.png',
  'bin-no-reciclables-normal': '/assets/game-1/bins/processed/no-reciclables-normal.png',
  'bin-no-reciclables-hover': '/assets/game-1/bins/processed/no-reciclables-hover.png',
  'bin-no-reciclables-open': '/assets/game-1/bins/processed/no-reciclables-open.png',
  'bin-no-reciclables-error': '/assets/game-1/bins/processed/no-reciclables-error.png',
  'bin-compostables-normal': '/assets/game-1/bins/processed/compostables-normal.png',
  'bin-compostables-hover': '/assets/game-1/bins/processed/compostables-hover.png',
  'bin-compostables-open': '/assets/game-1/bins/processed/compostables-open.png',
  'bin-compostables-error': '/assets/game-1/bins/processed/compostables-error.png'
};

const HOME_EFFECT_ASSETS: Record<string, string> = {
  starburst: '/assets/game-1/effects/processed/starburst.png',
  confetti: '/assets/game-1/effects/processed/confetti.png',
  'green-ring': '/assets/game-1/effects/processed/green-ring.png',
  coin: '/assets/game-1/effects/processed/coin.png',
  medal: '/assets/game-1/effects/processed/medal.png',
  'error-x': '/assets/game-1/effects/processed/error-x.png',
  'error-burst': '/assets/game-1/effects/processed/error-burst.png',
  'drag-hand': '/assets/game-1/effects/processed/drag-hand.png'
};

@Component({
  selector: 'app-game-canvas',
  templateUrl: './game-canvas.component.html',
  styleUrl: './game-canvas.component.scss'
})
export class GameCanvasComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) stage!: GameStage;
  @Output() completed = new EventEmitter<StageResult>();
  @ViewChild('gameHost', { static: true }) private readonly gameHost!: ElementRef<HTMLDivElement>;

  readonly score = signal(0);
  readonly remainingSeconds = signal(0);
  readonly feedback = signal('Arrastra cada tarjeta a su destino.');

  private game?: Phaser.Game;
  private resizeTimer?: ReturnType<typeof setTimeout>;

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

  private createGame(): void {
    if (!this.stage || !this.gameHost?.nativeElement) {
      return;
    }

    const host = this.gameHost.nativeElement;
    const fullScreenStage = this.stage.id === 'separacion-origen';
    const availableWidth = Math.max(320, Math.floor(host.clientWidth || window.innerWidth || 360));
    const availableHeight = Math.max(560, Math.floor(host.clientHeight || window.innerHeight || availableWidth * 1.18));
    const width = fullScreenStage ? availableWidth : Math.min(760, availableWidth);
    const height = fullScreenStage ? availableHeight : Math.min(720, Math.max(560, Math.round(width * 1.18)));

    this.destroyGame();
    host.innerHTML = '';
    this.score.set(0);
    this.remainingSeconds.set(this.stage.durationSeconds);
    this.feedback.set('Arrastra cada residuo al tacho correcto.');
    const scene = this.stage.id === 'separacion-origen'
      ? new HomeSortingScene(this.stage, {
          onTick: (score, remainingSeconds, feedback) => {
            this.ngZone.run(() => {
              this.score.set(score);
              this.remainingSeconds.set(remainingSeconds);
              this.feedback.set(feedback);
            });
          },
          onComplete: (result) => {
            this.ngZone.run(() => this.completed.emit(result));
          }
        })
      : new WasteJourneyScene(this.stage, {
          onTick: (score, remainingSeconds, feedback) => {
            this.ngZone.run(() => {
              this.score.set(score);
              this.remainingSeconds.set(remainingSeconds);
              this.feedback.set(feedback);
            });
          },
          onComplete: (result) => {
            this.ngZone.run(() => this.completed.emit(result));
          }
        });

    this.ngZone.runOutsideAngular(() => {
      this.game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: host,
        width,
        height,
        backgroundColor: this.stage.backgroundColor,
        scale: {
          autoCenter: Phaser.Scale.CENTER_BOTH,
          mode: Phaser.Scale.FIT
        },
        scene
      });
    });
  }

  private destroyGame(): void {
    this.game?.destroy(true);
    this.game = undefined;
  }
}

class HomeSortingScene extends Phaser.Scene {
  private readonly binMap = new Map<string, Phaser.GameObjects.Container>();
  private readonly progressDots: Phaser.GameObjects.Arc[] = [];
  private pendingItems: GameItem[] = [];
  private activeCard?: Phaser.GameObjects.Container;
  private score = 0;
  private correct = 0;
  private mistakes = 0;
  private streak = 0;
  private remainingSeconds = 0;
  private finished = false;
  private feedbackText?: Phaser.GameObjects.Text;
  private scoreText?: Phaser.GameObjects.Text;
  private timeText?: Phaser.GameObjects.Text;
  private timerEvent?: Phaser.Time.TimerEvent;

  constructor(
    private readonly stage: GameStage,
    private readonly hooks: SceneHooks
  ) {
    super({ key: `home-sorting-${stage.id}` });
  }

  preload(): void {
    if (!this.textures.exists(HOME_BACKGROUND_ASSET.key)) {
      this.load.image(HOME_BACKGROUND_ASSET.key, HOME_BACKGROUND_ASSET.path);
    }

    Object.values(HOME_PRODUCT_ASSETS).forEach((asset) => {
      if (!this.textures.exists(asset.key)) {
        this.load.image(asset.key, asset.path);
      }
    });

    Object.entries(HOME_BIN_ASSET_PATHS).forEach(([key, path]) => {
      if (!this.textures.exists(key)) {
        this.load.image(key, path);
      }
    });

    Object.entries(HOME_EFFECT_ASSETS).forEach(([key, path]) => {
      if (!this.textures.exists(key)) {
        this.load.image(key, path);
      }
    });
  }

  create(): void {
    this.remainingSeconds = this.stage.durationSeconds;
    this.drawKitchen();
    this.drawHud();
    this.createBins();
    this.createProducts();
    this.createDragHandlers();
    this.createTimer();
    this.publish('Arrastra cada residuo al tacho correcto.');
  }

  private drawKitchen(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    if (this.textures.exists(HOME_BACKGROUND_ASSET.key)) {
      this.addCoverImage(HOME_BACKGROUND_ASSET.key, width / 2, height / 2, width, height);
      this.add.rectangle(width / 2, 88, width, 176, 0x2a170d, 0.14);
      this.add.rectangle(width / 2, height - 96, width, 192, 0x2a170d, 0.1);
      this.add.text(22, 22, 'Juego 1', {
        color: '#fff1c6',
        fontFamily: 'Inter, Arial, sans-serif',
        fontSize: '14px',
        fontStyle: '900'
      });
      this.add.text(22, 43, 'Separacion en origen', {
        color: '#ffffff',
        fontFamily: 'Inter, Arial, sans-serif',
        fontSize: width < 390 ? '23px' : '28px',
        fontStyle: '900',
        wordWrap: { width: Math.min(360, width * 0.62) },
        shadow: { color: '#4d2917', blur: 8, fill: true, offsetX: 0, offsetY: 2 }
      });

      return;
    }

    this.add.rectangle(width / 2, height / 2, width, height, 0xffce79);
    this.add.rectangle(width / 2, height * 0.65, width, height * 0.7, 0xef8a3d);
    this.add.rectangle(width / 2, height * 0.66, width, 8, 0xa94f2f, 0.44);
    this.add.rectangle(width * 0.17, height * 0.18, width * 0.28, height * 0.3, 0xff7f50, 0.22).setRotation(-0.12);
    this.add.rectangle(width * 0.83, height * 0.2, width * 0.22, height * 0.34, 0xfff0a8, 0.26).setRotation(0.2);

    this.drawWindow(width * 0.62, 104, Math.min(250, width * 0.42), 118);
    this.drawBacksplash(width, height);
    this.drawCounter(width, height);
    this.drawDecor(width, height);

    this.add.text(22, 22, 'Juego 1', {
      color: '#5f3b23',
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '14px',
      fontStyle: '800'
    });

    this.add.text(22, 43, 'Separacion en origen', {
      color: '#24160e',
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: width < 390 ? '23px' : '28px',
      fontStyle: '900',
      wordWrap: { width: Math.min(360, width * 0.62) }
    });
  }

  private addCoverImage(
    key: string,
    x: number,
    y: number,
    targetWidth: number,
    targetHeight: number
  ): Phaser.GameObjects.Image {
    const image = this.add.image(x, y, key).setOrigin(0.5);
    const scale = Math.max(targetWidth / image.width, targetHeight / image.height);
    image.setScale(scale);

    return image;
  }

  private drawWindow(x: number, y: number, width: number, height: number): void {
    const frame = this.add.graphics();
    frame.fillStyle(0x8f4b28, 1);
    frame.fillRoundedRect(x - width / 2 - 8, y - height / 2 - 8, width + 16, height + 16, 10);
    frame.fillStyle(0x9ee9ff, 1);
    frame.fillRoundedRect(x - width / 2, y - height / 2, width, height, 8);
    frame.fillStyle(0xfff0a8, 0.82);
    frame.fillRect(x - width / 2, y - height / 2, width, height * 0.38);
    frame.fillStyle(0xff9f8e, 0.94);
    frame.fillTriangle(x - width / 2, y + height / 2, x - width * 0.16, y - 8, x + width * 0.08, y + height / 2);
    frame.fillStyle(0xb66ee8, 0.84);
    frame.fillTriangle(x - width * 0.08, y + height / 2, x + width * 0.22, y - 18, x + width / 2, y + height / 2);
    frame.fillStyle(0x8b552f, 1);
    frame.fillRect(x - 3, y - height / 2, 6, height);
    frame.fillRect(x - width / 2, y - 3, width, 6);

    this.add.circle(x + width * 0.32, y - height * 0.24, 16, 0xffefb7, 0.88);
  }

  private drawBacksplash(width: number, height: number): void {
    const tileTop = height * 0.25;
    const tileHeight = height * 0.2;

    this.add.rectangle(width / 2, tileTop + tileHeight / 2, width, tileHeight, 0xffb35f, 0.92);

    for (let x = 0; x < width + 34; x += 34) {
      for (let y = tileTop; y < tileTop + tileHeight; y += 34) {
        this.add.rectangle(x + 17, y + 17, 32, 32, 0xffe4a6, 0.58).setStrokeStyle(1, 0xc95236, 0.34);
        if ((x + y) % 68 === 0) {
          this.add.line(x + 17, y + 17, -7, 0, 7, 0, 0x2f8f4e, 0.34).setLineWidth(2);
          this.add.line(x + 17, y + 17, 0, -7, 0, 7, 0x2f80ed, 0.3).setLineWidth(2);
        }
      }
    }
  }

  private drawCounter(width: number, height: number): void {
    const counterY = height * 0.43;
    const counter = this.add.graphics();
    counter.fillStyle(0x8e4b26, 1);
    counter.fillRoundedRect(18, counterY, width - 36, 92, 18);
    counter.fillStyle(0xffa14a, 1);
    counter.fillRoundedRect(24, counterY - 12, width - 48, 28, 12);
    counter.fillStyle(0x5c2d19, 0.24);
    counter.fillRoundedRect(34, counterY + 18, width - 68, 12, 6);

    this.add.ellipse(width * 0.17, counterY + 30, 64, 16, 0x5a311d, 0.18);
    this.add.ellipse(width * 0.74, counterY + 28, 76, 16, 0x5a311d, 0.16);
  }

  private drawDecor(width: number, height: number): void {
    const plant = this.add.container(42, height * 0.47);
    plant.add(this.add.rectangle(0, 40, 34, 36, 0xa35b34));
    plant.add(this.add.ellipse(-16, 8, 18, 52, 0x3f7f45).setRotation(-0.62));
    plant.add(this.add.ellipse(10, 0, 18, 60, 0x529f58).setRotation(0.42));
    plant.add(this.add.ellipse(24, 16, 14, 42, 0x356f40).setRotation(0.84));

    const towel = this.add.graphics();
    towel.fillStyle(0xbd4d39, 0.94);
    towel.fillRoundedRect(width - 74, height * 0.21, 38, 80, 8);
    towel.fillStyle(0xf6c05f, 0.9);
    towel.fillRect(width - 66, height * 0.23, 6, 72);
    towel.fillRect(width - 52, height * 0.23, 6, 72);
  }

  private drawHud(): void {
    const width = this.scale.width;

    const panel = this.add.graphics();
    const panelWidth = Math.min(270, width - 92);

    panel.fillStyle(0xffffff, 0.9);
    panel.fillRoundedRect(18, 92, panelWidth, 58, 16);
    panel.lineStyle(3, 0xffb23e, 0.38);
    panel.strokeRoundedRect(18, 92, panelWidth, 58, 16);

    this.scoreText = this.add.text(34, 101, '0 pts', {
      color: '#1b5f36',
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '20px',
      fontStyle: '900'
    });
    this.timeText = this.add.text(36, 127, `${this.remainingSeconds}s`, {
      color: '#a94f2f',
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '14px',
      fontStyle: '900'
    });

    const dotStart = Math.min(178, width - 142);
    this.stage.items.forEach((_item, index) => {
      const dot = this.add.circle(dotStart + index * 16, 121, 5, 0xa94f2f, 0.3);
      this.progressDots.push(dot);
    });

    this.feedbackText = this.add.text(width / 2, 170, '', {
      align: 'center',
      color: '#351a10',
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: width < 390 ? '14px' : '16px',
      fontStyle: '900',
      wordWrap: { width: width - 44 }
    }).setOrigin(0.5);
  }

  private createBins(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const gap = width < 420 ? 7 : 14;
    const binWidth = Math.min(150, (width - 34 - gap * 2) / 3);
    const binHeight = this.textures.exists('bin-reciclables-normal') ? binWidth * 1.5 : height < 610 ? 112 : 128;
    const y = height - binHeight / 2 - 22;
    const startX = (width - (binWidth * 3 + gap * 2)) / 2 + binWidth / 2;

    this.stage.dropZones.forEach((zone, index) => {
      const x = startX + index * (binWidth + gap);
      const bin = this.createAssetBin(zone, x, y, binWidth) ?? this.createIllustratedBin(zone, x, y, binWidth, binHeight);
      const bounds = bin.getData('bounds') as { width: number; height: number } | undefined;
      const zoneWidth = bounds?.width ?? binWidth + 10;
      const zoneHeight = bounds?.height ?? binHeight + 16;
      const dropZone = this.add
        .zone(x, y + 8, zoneWidth, zoneHeight)
        .setRectangleDropZone(zoneWidth, zoneHeight)
        .setData('zoneId', zone.id);

      dropZone.setData('bin', bin);
      this.binMap.set(zone.id, bin);
    });
  }

  private createAssetBin(
    zone: DropZone,
    x: number,
    y: number,
    width: number
  ): Phaser.GameObjects.Container | null {
    const assets = HOME_BIN_ASSETS[zone.id];

    if (!assets || !this.textures.exists(assets.normal)) {
      return null;
    }

    const bin = this.add.container(x, y);
    const image = this.add.image(0, 0, assets.normal).setOrigin(0.5);
    image.setDisplaySize(width, width * 1.5);
    bin.add(image);
    bin.setData('image', image);
    bin.setData('assets', assets);
    bin.setData('state', 'normal');
    bin.setData('bounds', { width: width + 18, height: width * 1.52 });

    const label = this.add.text(0, width * 0.79, zone.shortLabel, {
      align: 'center',
      color: '#ffffff',
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '11px',
      fontStyle: '900',
      shadow: { color: '#000000', blur: 4, fill: true, offsetX: 0, offsetY: 1 }
    }).setOrigin(0.5);
    bin.add(label);

    this.tweens.add({
      targets: bin,
      y: y - 4,
      duration: 1500 + Math.random() * 320,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    return bin;
  }

  private createIllustratedBin(
    zone: DropZone,
    x: number,
    y: number,
    width: number,
    height: number
  ): Phaser.GameObjects.Container {
    const color = hexToNumber(zone.color);
    const bin = this.add.container(x, y);
    const art = this.add.graphics();

    art.fillStyle(0x3a2316, 0.2);
    art.fillEllipse(0, height / 2 + 8, width * 0.92, 16);
    art.fillStyle(color, 1);
    art.fillRoundedRect(-width / 2 + 8, -height / 2 + 22, width - 16, height - 12, 12);
    art.fillStyle(0xffffff, 0.13);
    art.fillRoundedRect(-width / 2 + 16, -height / 2 + 34, width * 0.2, height - 48, 9);
    art.fillStyle(0x000000, 0.13);
    art.fillRoundedRect(width / 2 - width * 0.25, -height / 2 + 34, width * 0.14, height - 48, 9);
    art.fillStyle(darken(color, 0.72), 1);
    art.fillRoundedRect(-width / 2 + 2, -height / 2 + 12, width - 4, 24, 10);
    art.fillStyle(lighten(color, 1.2), 1);
    art.fillRoundedRect(-width / 2 + 14, -height / 2, width - 28, 18, 9);

    const icon = this.createBinIcon(zone.id, color);
    icon.setPosition(0, height * 0.1);

    const label = this.add.text(0, -height * 0.19, zone.label.toUpperCase(), {
      align: 'center',
      color: '#ffffff',
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: width < 118 ? '10px' : '12px',
      fontStyle: '900',
      wordWrap: { width: width - 16 }
    }).setOrigin(0.5);

    const hint = this.add.text(0, height * 0.36, zone.shortLabel, {
      align: 'center',
      color: 'rgba(255,255,255,0.82)',
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '10px',
      fontStyle: '800'
    }).setOrigin(0.5);

    bin.add([art, icon, label, hint]);
    bin.setData('color', color);

    this.tweens.add({
      targets: bin,
      y: y - 3,
      duration: 1450 + Math.random() * 350,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    return bin;
  }

  private createBinIcon(zoneId: string, color: number): Phaser.GameObjects.Container {
    const icon = this.add.container(0, 0);
    const graphics = this.add.graphics();

    graphics.lineStyle(4, 0xffffff, 0.92);
    graphics.fillStyle(0xffffff, 0.92);

    if (zoneId === 'reciclables') {
      graphics.strokeCircle(0, 0, 17);
      graphics.fillTriangle(2, -24, 14, -14, -1, -10);
      graphics.fillTriangle(22, 8, 8, 12, 16, 24);
      graphics.fillTriangle(-22, 8, -14, -8, -26, -3);
    } else if (zoneId === 'compostables') {
      graphics.fillEllipse(-8, 0, 18, 34);
      graphics.fillEllipse(10, 2, 15, 30);
      graphics.lineStyle(2, color, 0.75);
      graphics.lineBetween(-10, 12, 10, -12);
      graphics.lineBetween(7, 13, 17, 24);
    } else {
      graphics.strokeRoundedRect(-14, -12, 28, 30, 4);
      graphics.lineBetween(-19, -16, 19, -16);
      graphics.lineBetween(-7, -22, 7, -22);
      graphics.lineBetween(-6, -5, -6, 11);
      graphics.lineBetween(0, -5, 0, 11);
      graphics.lineBetween(6, -5, 6, 11);
    }

    icon.add(graphics);
    return icon;
  }

  private setBinState(zoneId: string, state: BinVisualState): void {
    const bin = this.binMap.get(zoneId);
    const image = bin?.getData('image') as Phaser.GameObjects.Image | undefined;
    const assets = bin?.getData('assets') as BinAssets | undefined;

    if (!bin || !image || !assets) {
      return;
    }

    const textureKey = assets[state];

    if (textureKey && this.textures.exists(textureKey)) {
      image.setTexture(textureKey);
      bin.setData('state', state);
    }
  }

  private resetBinState(zoneId: string): void {
    this.setBinState(zoneId, 'normal');
  }

  private createProducts(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const tray = this.add.graphics();

    tray.fillStyle(0x4d2917, 0.22);
    tray.fillEllipse(width / 2, height * 0.51 + 54, Math.min(220, width * 0.48), 28);
    tray.fillStyle(0xffd27a, 1);
    tray.fillRoundedRect(width / 2 - Math.min(210, width * 0.46) / 2, height * 0.51 + 30, Math.min(210, width * 0.46), 28, 14);
    tray.lineStyle(3, 0xb65e2b, 0.36);
    tray.strokeRoundedRect(width / 2 - Math.min(210, width * 0.46) / 2, height * 0.51 + 30, Math.min(210, width * 0.46), 28, 14);

    this.pendingItems = [...this.stage.items];
    this.spawnNextProduct();
  }

  private spawnNextProduct(): void {
    if (this.finished || this.activeCard || this.pendingItems.length === 0) {
      return;
    }

    const item = this.pendingItems.shift();

    if (!item) {
      return;
    }

    const width = this.scale.width;
    const height = this.scale.height;
    const x = width / 2;
    const y = height < 650 ? height * 0.48 : height * 0.5;
    const card = this.createProductToken(item, x, y);

    card.setData('homeX', x);
    card.setData('homeY', y);
    card.setScale(0.12);
    card.setAlpha(0);
    card.setAngle(Phaser.Math.Between(-8, 8));
    this.activeCard = card;

    this.tweens.add({
      targets: card,
      alpha: 1,
      scale: 1.28,
      angle: Phaser.Math.Between(-3, 3),
      duration: 480,
      ease: 'Back.easeOut',
      onComplete: () => this.addIdleTween(card, this.correct)
    });
  }

  private createProductToken(item: GameItem, x: number, y: number): Phaser.GameObjects.Container {
    const card = this.add.container(x, y);
    const base = this.add.graphics();

    base.fillStyle(0x3a2316, 0.2);
    base.fillEllipse(0, 42, 86, 18);
    base.fillStyle(0xffffff, 0.98);
    base.fillCircle(0, 0, 46);
    base.fillStyle(0xfff0a8, 0.9);
    base.fillCircle(-14, -13, 14);
    base.lineStyle(5, 0xffffff, 1);
    base.strokeCircle(0, 0, 46);
    base.lineStyle(3, 0xffb23e, 0.72);
    base.strokeCircle(0, 0, 46);

    const art = this.createProductArt(item);
    const label = this.add.text(0, 56, item.label, {
      align: 'center',
      color: '#351a10',
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '13px',
      fontStyle: '900',
      wordWrap: { width: 104 }
    }).setOrigin(0.5);

    card.add([base, art, label]);
    card.setSize(110, 124);
    card.setData('category', item.category);
    card.setData('points', item.points);
    card.setData('label', item.label);
    card.setData('detail', item.detail);
    card.setInteractive({ cursor: 'grab' });
    this.input.setDraggable(card);

    return card;
  }

  private createProductArt(item: GameItem): Phaser.GameObjects.Container {
    const art = this.add.container(0, -4);
    const asset = HOME_PRODUCT_ASSETS[item.id];

    if (asset && this.textures.exists(asset.key)) {
      const image = this.add.image(0, asset.offsetY ?? 0, asset.key).setOrigin(0.5);
      image.setDisplaySize(asset.size, asset.size);
      art.add(image);

      return art;
    }

    if (item.id === 'botella-pet') {
      this.drawPlasticBottle(art);
    } else if (item.id === 'frasco-vidrio') {
      this.drawGlassJar(art);
    } else if (item.id === 'carton') {
      this.drawCardboardBox(art);
    } else if (item.id === 'cascara') {
      this.drawFruitPeel(art);
    } else if (item.id === 'yerba') {
      this.drawYerbaBag(art);
    } else {
      this.drawCandyWrapper(art);
    }

    return art;
  }

  private drawPlasticBottle(parent: Phaser.GameObjects.Container): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x6fc6ee, 0.78);
    graphics.fillRoundedRect(-12, -23, 24, 48, 9);
    graphics.fillStyle(0xbceeff, 0.62);
    graphics.fillRoundedRect(-6, -30, 12, 12, 4);
    graphics.fillStyle(0x2f80ed, 0.9);
    graphics.fillRoundedRect(-8, -36, 16, 8, 3);
    graphics.fillStyle(0xffffff, 0.42);
    graphics.fillRoundedRect(-7, -15, 6, 25, 4);
    graphics.lineStyle(2, 0x2f80ed, 0.55);
    graphics.strokeRoundedRect(-12, -23, 24, 48, 9);
    parent.add(graphics);
  }

  private drawGlassJar(parent: Phaser.GameObjects.Container): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xaee6d1, 0.72);
    graphics.fillRoundedRect(-16, -18, 32, 39, 8);
    graphics.fillStyle(0x6eb49d, 0.85);
    graphics.fillRoundedRect(-12, -29, 24, 10, 4);
    graphics.fillStyle(0xffffff, 0.45);
    graphics.fillRoundedRect(-10, -10, 6, 22, 4);
    graphics.lineStyle(2, 0x3a9152, 0.55);
    graphics.strokeRoundedRect(-16, -18, 32, 39, 8);
    parent.add(graphics);
  }

  private drawCardboardBox(parent: Phaser.GameObjects.Container): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xd49a55, 1);
    graphics.fillRoundedRect(-20, -7, 40, 31, 5);
    graphics.fillStyle(0xf0bf75, 1);
    graphics.fillTriangle(-20, -8, -2, -22, -2, -8);
    graphics.fillTriangle(20, -8, 2, -22, 2, -8);
    graphics.fillStyle(0xb8753a, 0.65);
    graphics.fillRect(-2, -7, 4, 31);
    graphics.lineStyle(2, 0x8a542b, 0.6);
    graphics.strokeRoundedRect(-20, -7, 40, 31, 5);
    parent.add(graphics);
  }

  private drawFruitPeel(parent: Phaser.GameObjects.Container): void {
    const peelA = this.add.ellipse(-9, 1, 16, 48, 0xf6d34f).setRotation(-0.48);
    const peelB = this.add.ellipse(9, 4, 15, 43, 0xffe071).setRotation(0.56);
    const stem = this.add.rectangle(0, -20, 7, 12, 0x75512b).setRotation(0.2);
    const edge = this.add.ellipse(-2, 12, 20, 10, 0xd2962b, 0.62);
    parent.add([peelA, peelB, edge, stem]);
  }

  private drawYerbaBag(parent: Phaser.GameObjects.Container): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x5b9b54, 1);
    graphics.fillRoundedRect(-18, -25, 36, 50, 6);
    graphics.fillStyle(0xe6d8a8, 1);
    graphics.fillRoundedRect(-13, -5, 26, 20, 4);
    graphics.fillStyle(0x2f6b38, 1);
    graphics.fillEllipse(-4, 4, 12, 22);
    graphics.fillEllipse(8, 4, 10, 18);
    graphics.lineStyle(2, 0x2f6b38, 0.5);
    graphics.strokeRoundedRect(-18, -25, 36, 50, 6);
    parent.add(graphics);
  }

  private drawCandyWrapper(parent: Phaser.GameObjects.Container): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xef6f45, 1);
    graphics.fillRoundedRect(-18, -13, 36, 26, 5);
    graphics.fillStyle(0xf9c74f, 1);
    graphics.fillTriangle(-18, 0, -34, -12, -34, 12);
    graphics.fillTriangle(18, 0, 34, -12, 34, 12);
    graphics.fillStyle(0xffffff, 0.35);
    graphics.fillRoundedRect(-11, -7, 22, 6, 3);
    graphics.lineStyle(2, 0xb94b32, 0.65);
    graphics.strokeRoundedRect(-18, -13, 36, 26, 5);
    parent.add(graphics);
  }

  private createDragHandlers(): void {
    this.input.on(
      Phaser.Input.Events.DRAG_START,
      (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
        const card = gameObject as Phaser.GameObjects.Container;
        this.tweens.killTweensOf(card);
        this.children.bringToTop(card);
        card.setScale(1.42);
        card.setAlpha(0.96);
        this.highlightBins(true);
        this.publish(`${card.getData('label')}: ${card.getData('detail')}`);
      }
    );

    this.input.on(
      Phaser.Input.Events.DRAG,
      (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject, dragX: number, dragY: number) => {
        const card = gameObject as Phaser.GameObjects.Container;
        card.x = dragX;
        card.y = dragY;
      }
    );

    this.input.on(
      Phaser.Input.Events.DRAG_END,
      (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject, dropped: boolean) => {
        this.highlightBins(false);
        const card = gameObject as Phaser.GameObjects.Container;

        if (!dropped && !card.getData('classified')) {
          this.returnHome(card);
        }
      }
    );

    this.input.on(
      Phaser.Input.Events.DROP,
      (
        _pointer: Phaser.Input.Pointer,
        gameObject: Phaser.GameObjects.GameObject,
        dropZone: Phaser.GameObjects.GameObject
      ) => this.handleDrop(gameObject as Phaser.GameObjects.Container, dropZone as Phaser.GameObjects.Zone)
    );
  }

  private handleDrop(card: Phaser.GameObjects.Container, dropZone: Phaser.GameObjects.Zone): void {
    if (card.getData('classified') || this.finished) {
      return;
    }

    const expected = card.getData('category') as string;
    const received = dropZone.getData('zoneId') as string;

    if (expected === received) {
      this.correct += 1;
      this.streak += 1;

      const itemPoints = Number(card.getData('points') ?? 100);
      const comboBonus = Math.max(0, this.streak - 1) * 15;
      this.score += itemPoints + comboBonus;
      card.setData('classified', true);
      card.disableInteractive();

      this.markProgressDot();
      this.animateCorrectDrop(card, dropZone, itemPoints + comboBonus);
      this.pulseBin(received);
      this.publish(comboBonus > 0 ? `Combo x${this.streak}. ${card.getData('label')} correcto.` : `${card.getData('label')} correcto.`);
      this.activeCard = undefined;

      if (this.correct === this.stage.items.length) {
        this.time.delayedCall(520, () => this.finishLevel());
      } else {
        this.time.delayedCall(520, () => this.spawnNextProduct());
      }

      return;
    }

    this.mistakes += 1;
    this.streak = 0;
    this.score = Math.max(0, this.score - 40);
    this.showBinError(received);
    this.animateWrongDrop(card);
    this.publish('Ese tacho no corresponde. Mira la pista y vuelve a intentar.');
  }

  private animateCorrectDrop(
    card: Phaser.GameObjects.Container,
    dropZone: Phaser.GameObjects.Zone,
    points: number
  ): void {
    this.tweens.killTweensOf(card);

    this.spawnScorePopup(card.x, card.y - 38, points);
    this.spawnSparkles(dropZone.x, dropZone.y - 18, hexToNumber(this.stage.accentColor));

    this.tweens.add({
      targets: card,
      x: dropZone.x,
      y: dropZone.y - 8,
      scale: 0.42,
      alpha: 0,
      angle: Phaser.Math.Between(-18, 18),
      duration: 340,
      ease: 'Back.easeIn',
      onComplete: () => card.destroy()
    });
  }

  private animateWrongDrop(card: Phaser.GameObjects.Container): void {
    card.setAlpha(1);
    this.cameras.main.shake(120, 0.004);
    this.spawnErrorEffect(card.x, card.y);
    this.tweens.add({
      targets: card,
      x: card.x + 8,
      duration: 45,
      yoyo: true,
      repeat: 3,
      ease: 'Sine.easeInOut',
      onComplete: () => this.returnHome(card)
    });
  }

  private returnHome(card: Phaser.GameObjects.Container): void {
    this.tweens.killTweensOf(card);
    card.setAlpha(1);

    this.tweens.add({
      targets: card,
      x: Number(card.getData('homeX')),
      y: Number(card.getData('homeY')),
      scale: 1.28,
      angle: 0,
      duration: 260,
      ease: 'Back.easeOut',
      onComplete: () => this.addIdleTween(card, Phaser.Math.Between(0, 5))
    });
  }

  private addIdleTween(card: Phaser.GameObjects.Container, index: number): void {
    if (card.getData('classified')) {
      return;
    }

    this.tweens.add({
      targets: card,
      y: Number(card.getData('homeY')) - 5,
      angle: index % 2 === 0 ? 1.4 : -1.4,
      duration: 1200 + index * 90,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private highlightBins(active: boolean): void {
    this.binMap.forEach((bin, zoneId) => {
      this.tweens.killTweensOf(bin);

      if (active) {
        this.setBinState(zoneId, 'hover');
      } else if (bin.getData('state') === 'hover') {
        this.setBinState(zoneId, 'normal');
      }

      this.tweens.add({
        targets: bin,
        scale: active ? 1.035 : 1,
        duration: 120,
        ease: 'Quad.easeOut'
      });
    });
  }

  private pulseBin(zoneId: string): void {
    const bin = this.binMap.get(zoneId);

    if (!bin) {
      return;
    }

    this.tweens.killTweensOf(bin);
    this.setBinState(zoneId, 'open');
    this.tweens.add({
      targets: bin,
      x: bin.x,
      scale: 1.12,
      duration: 120,
      yoyo: true,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(320, () => this.resetBinState(zoneId));
      }
    });
  }

  private showBinError(zoneId: string): void {
    const bin = this.binMap.get(zoneId);

    if (!bin) {
      return;
    }

    this.setBinState(zoneId, 'error');
    this.tweens.killTweensOf(bin);
    const originalX = bin.x;
    this.tweens.add({
      targets: bin,
      x: originalX + 7,
      duration: 48,
      yoyo: true,
      repeat: 4,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        bin.x = originalX;
        this.resetBinState(zoneId);
        this.tweens.add({
          targets: bin,
          y: bin.y - 3,
          duration: 1500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    });
  }

  private markProgressDot(): void {
    const dot = this.progressDots[this.correct - 1];

    if (!dot) {
      return;
    }

    dot.setFillStyle(0x2f7d57, 1);
    this.tweens.add({
      targets: dot,
      scale: 1.8,
      duration: 150,
      yoyo: true,
      ease: 'Back.easeOut'
    });
  }

  private spawnScorePopup(x: number, y: number, points: number): void {
    if (this.textures.exists('coin')) {
      const coin = this.add.image(x - 42, y + 4, 'coin').setOrigin(0.5);
      coin.setDisplaySize(42, 42);
      this.tweens.add({
        targets: coin,
        y: y - 26,
        scale: 1.35,
        alpha: 0,
        duration: 620,
        ease: 'Back.easeOut',
        onComplete: () => coin.destroy()
      });
    }

    const popup = this.add.text(x, y, `+${points}`, {
      color: '#2f7d57',
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '20px',
      fontStyle: '900'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: popup,
      y: y - 34,
      alpha: 0,
      duration: 680,
      ease: 'Quad.easeOut',
      onComplete: () => popup.destroy()
    });
  }

  private spawnSparkles(x: number, y: number, color: number): void {
    if (this.textures.exists('starburst')) {
      const starburst = this.add.image(x, y - 18, 'starburst').setOrigin(0.5);
      starburst.setDisplaySize(170, 142);
      starburst.setAlpha(0.92);
      this.tweens.add({
        targets: starburst,
        scale: 1.25,
        alpha: 0,
        duration: 520,
        ease: 'Quad.easeOut',
        onComplete: () => starburst.destroy()
      });
    }

    if (this.textures.exists('confetti')) {
      const confetti = this.add.image(x, y - 42, 'confetti').setOrigin(0.5);
      confetti.setDisplaySize(188, 142);
      this.tweens.add({
        targets: confetti,
        y: y - 78,
        scale: 1.12,
        alpha: 0,
        duration: 760,
        ease: 'Quad.easeOut',
        onComplete: () => confetti.destroy()
      });
    }

    for (let index = 0; index < 10; index += 1) {
      const angle = Phaser.Math.DegToRad(index * 36);
      const sparkle = this.add.circle(x, y, Phaser.Math.Between(3, 6), index % 2 === 0 ? color : 0xffcf5b, 0.92);
      const distance = Phaser.Math.Between(28, 58);

      this.tweens.add({
        targets: sparkle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        scale: 0.1,
        alpha: 0,
        duration: 460,
        ease: 'Quad.easeOut',
        onComplete: () => sparkle.destroy()
      });
    }
  }

  private spawnErrorEffect(x: number, y: number): void {
    const key = this.textures.exists('error-burst') ? 'error-burst' : this.textures.exists('error-x') ? 'error-x' : null;

    if (!key) {
      return;
    }

    const error = this.add.image(x, y - 8, key).setOrigin(0.5);
    error.setDisplaySize(116, 116);
    error.setAlpha(0.95);
    this.tweens.add({
      targets: error,
      scale: 1.3,
      alpha: 0,
      duration: 460,
      ease: 'Quad.easeOut',
      onComplete: () => error.destroy()
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

        this.publish(this.feedbackText?.text || 'Sigue clasificando.');
      }
    });
  }

  private finishLevel(): void {
    if (this.finished) {
      return;
    }

    this.finished = true;
    this.timerEvent?.remove(false);

    const timeBonus = this.remainingSeconds * 10;
    const accuracyBonus = Math.max(0, this.correct - this.mistakes) * 20;
    this.score += timeBonus + accuracyBonus;
    this.scoreText?.setText(`${this.score} pts`);
    this.spawnFinishPanel(timeBonus, accuracyBonus);
    this.publish(`Nivel completo. Bonus por tiempo: ${timeBonus}.`);
    this.hooks.onComplete({
      stageId: this.stage.id,
      score: this.score,
      correct: this.correct,
      mistakes: this.mistakes,
      remainingSeconds: this.remainingSeconds,
      completedAt: new Date().toISOString()
    });
  }

  private spawnFinishPanel(timeBonus: number, accuracyBonus: number): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const panel = this.add.graphics();

    panel.fillStyle(0x24160e, 0.35);
    panel.fillRect(0, 0, width, height);
    panel.fillStyle(0xffffff, 0.96);
    panel.fillRoundedRect(24, height / 2 - 86, width - 48, 172, 18);
    panel.lineStyle(3, hexToNumber(this.stage.accentColor), 0.26);
    panel.strokeRoundedRect(24, height / 2 - 86, width - 48, 172, 18);

    this.add.text(width / 2, height / 2 - 48, 'Separacion lograda', {
      align: 'center',
      color: '#1e2a22',
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '25px',
      fontStyle: '900'
    }).setOrigin(0.5);

    if (this.textures.exists('medal')) {
      const medal = this.add.image(width / 2, height / 2 - 104, 'medal').setOrigin(0.5);
      medal.setDisplaySize(82, 80);
      medal.setAlpha(0);
      medal.setScale(0.2);
      this.tweens.add({
        targets: medal,
        alpha: 1,
        scale: 1,
        duration: 420,
        ease: 'Back.easeOut'
      });
    }

    this.add.text(width / 2, height / 2 - 6, `${this.score} puntos`, {
      align: 'center',
      color: this.stage.accentColor,
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '34px',
      fontStyle: '900'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 38, `Tiempo +${timeBonus}  |  Precision +${accuracyBonus}`, {
      align: 'center',
      color: '#5f6f64',
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '13px',
      fontStyle: '800'
    }).setOrigin(0.5);
  }

  private publish(feedback: string): void {
    this.feedbackText?.setText(feedback);
    this.scoreText?.setText(`${this.score} pts`);
    this.timeText?.setText(`${this.remainingSeconds}s`);
    this.timeText?.setColor(this.remainingSeconds <= 10 ? '#b8322d' : '#6d4b31');
    this.hooks.onTick(this.score, this.remainingSeconds, feedback);
  }
}

class WasteJourneyScene extends Phaser.Scene {
  private score = 0;
  private correct = 0;
  private mistakes = 0;
  private remainingSeconds = 0;
  private finished = false;
  private feedbackText?: Phaser.GameObjects.Text;
  private timerEvent?: Phaser.Time.TimerEvent;

  constructor(
    private readonly stage: GameStage,
    private readonly hooks: SceneHooks
  ) {
    super({ key: `waste-stage-${stage.id}` });
  }

  create(): void {
    this.remainingSeconds = this.stage.durationSeconds;
    this.drawEnvironment();
    this.createDropZones();
    this.createItems();
    this.createTimer();
    this.publish('Clasifica todos los elementos antes de que termine el tiempo.');
  }

  private drawEnvironment(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const background = hexToNumber(this.stage.backgroundColor);
    const accent = hexToNumber(this.stage.accentColor);

    this.add.rectangle(width / 2, height / 2, width, height, background);
    this.add.circle(width * 0.84, 78, 58, 0xffdc8a, 0.56);
    this.add.polygon(width * 0.5, 126, [
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
      126
    ], 0x8ab17d, 0.36);

    this.add.text(22, 22, `Etapa ${this.stage.order}`, {
      color: '#243026',
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '14px',
      fontStyle: '700'
    });

    this.add.text(22, 44, this.stage.title, {
      color: '#152019',
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '24px',
      fontStyle: '800',
      wordWrap: { width: width - 44 }
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

    this.feedbackText = this.add.text(22, height - 32, '', {
      color: '#223128',
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '13px',
      fontStyle: '700',
      wordWrap: { width: width - 44 }
    });
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

      this.add.rectangle(x, y, zoneWidth, zoneHeight, color, 0.92).setStrokeStyle(2, 0xffffff, 0.92);
      this.add.text(x, y - 8, zone.label, {
        align: 'center',
        color: '#ffffff',
        fontFamily: 'Inter, Arial, sans-serif',
        fontSize: '12px',
        fontStyle: '800',
        wordWrap: { width: zoneWidth - 12 }
      }).setOrigin(0.5);
      this.add.text(x, y + 15, zone.shortLabel, {
        align: 'center',
        color: 'rgba(255,255,255,0.78)',
        fontFamily: 'Inter, Arial, sans-serif',
        fontSize: '10px',
        fontStyle: '700'
      }).setOrigin(0.5);

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
      (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject, dragX: number, dragY: number) => {
        const card = gameObject as Phaser.GameObjects.Container;
        card.x = dragX;
        card.y = dragY;
      }
    );

    this.input.on(
      Phaser.Input.Events.DRAG_END,
      (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject, dropped: boolean) => {
        if (!dropped) {
          this.returnHome(gameObject as Phaser.GameObjects.Container);
        }
      }
    );

    this.input.on(
      Phaser.Input.Events.DROP,
      (
        _pointer: Phaser.Input.Pointer,
        gameObject: Phaser.GameObjects.GameObject,
        dropZone: Phaser.GameObjects.GameObject
      ) => this.handleDrop(gameObject as Phaser.GameObjects.Container, dropZone)
    );
  }

  private createItemCard(item: GameItem, x: number, y: number): Phaser.GameObjects.Container {
    const accent = hexToNumber(this.stage.accentColor);
    const card = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 112, 52, 0xffffff, 0.96).setStrokeStyle(2, accent, 0.2);
    const symbol = this.add.text(-36, 0, item.symbol, {
      align: 'center',
      color: this.stage.accentColor,
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '13px',
      fontStyle: '900'
    }).setOrigin(0.5);
    const label = this.add.text(4, 0, item.label, {
      color: '#1f2b23',
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '12px',
      fontStyle: '800',
      wordWrap: { width: 70 }
    }).setOrigin(0, 0.5);

    card.add([bg, symbol, label]);
    card.setSize(112, 52);
    card.setData('category', item.category);
    card.setData('points', item.points);
    card.setData('label', item.label);
    card.setInteractive({ cursor: 'grab' });
    this.input.setDraggable(card);

    return card;
  }

  private handleDrop(card: Phaser.GameObjects.Container, dropZone: Phaser.GameObjects.GameObject): void {
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
        ease: 'Quad.easeOut'
      });

      this.publish(`Correcto: ${card.getData('label')}.`);

      if (this.correct === this.stage.items.length) {
        this.finishLevel();
      }

      return;
    }

    this.mistakes += 1;
    this.score = Math.max(0, this.score - 35);
    this.publish('Ese destino no corresponde. Intenta otra clasificacion.');
    this.returnHome(card);
  }

  private returnHome(card: Phaser.GameObjects.Container): void {
    this.tweens.add({
      targets: card,
      x: Number(card.getData('homeX')),
      y: Number(card.getData('homeY')),
      duration: 220,
      ease: 'Back.easeOut'
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

        this.publish(this.feedbackText?.text || 'Sigue clasificando.');
      }
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

    this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width - 42,
      132,
      0xffffff,
      0.94
    ).setStrokeStyle(3, hexToNumber(this.stage.accentColor), 0.28);
    this.add.text(this.scale.width / 2, this.scale.height / 2 - 30, 'Etapa registrada', {
      align: 'center',
      color: '#19231d',
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '24px',
      fontStyle: '900'
    }).setOrigin(0.5);
    this.add.text(this.scale.width / 2, this.scale.height / 2 + 12, `${this.score} puntos`, {
      align: 'center',
      color: this.stage.accentColor,
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '30px',
      fontStyle: '900'
    }).setOrigin(0.5);

    this.publish(`Etapa completa. Bonus por tiempo: ${timeBonus}.`);
    this.hooks.onComplete({
      stageId: this.stage.id,
      score: this.score,
      correct: this.correct,
      mistakes: this.mistakes,
      remainingSeconds: this.remainingSeconds,
      completedAt: new Date().toISOString()
    });
  }

  private publish(feedback: string): void {
    this.feedbackText?.setText(feedback);
    this.hooks.onTick(this.score, this.remainingSeconds, feedback);
  }
}

function hexToNumber(hexColor: string): number {
  return Number.parseInt(hexColor.replace('#', ''), 16);
}

function darken(color: number, amount: number): number {
  const red = Math.floor(((color >> 16) & 255) * amount);
  const green = Math.floor(((color >> 8) & 255) * amount);
  const blue = Math.floor((color & 255) * amount);

  return (red << 16) + (green << 8) + blue;
}

function lighten(color: number, amount: number): number {
  const red = Math.min(255, Math.floor(((color >> 16) & 255) * amount));
  const green = Math.min(255, Math.floor(((color >> 8) & 255) * amount));
  const blue = Math.min(255, Math.floor((color & 255) * amount));

  return (red << 16) + (green << 8) + blue;
}
