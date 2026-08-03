export interface StageTick {
  readonly score: number;
  readonly remainingSeconds: number;
  readonly completedItems: number;
}

export interface ActiveItemHud {
  readonly id: string;
  readonly label: string;
}

export interface ProductAsset {
  readonly path: string;
  readonly size: number;
}

export type BinVisualState = 'normal' | 'hover' | 'open' | 'error';

export interface BinAssets {
  readonly normal: string;
  readonly hover: string;
  readonly open: string;
  readonly error: string;
}

export interface ImageCrop {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface ImageAsset {
  readonly key: string;
  readonly path: string;
  readonly sourceWidth?: number;
  readonly sourceHeight?: number;
  readonly crop?: ImageCrop;
}

export interface HomeEffect {
  readonly id: number;
  readonly type: 'score' | 'success' | 'error';
  readonly x: number;
  readonly y: number;
  readonly text?: string;
}
