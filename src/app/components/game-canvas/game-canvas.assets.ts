import type { BinAssets, ImageAsset, ProductAsset } from './game-canvas.types';

export const HOME_BACKGROUND_ASSET = {
  path: '/assets/game-1/backgrounds/fondo juego 1.png',
};

export const HOME_PRODUCT_ASSETS: Record<string, ProductAsset> = {
  'botella-pet': {
    path: '/assets/game-1/products/processed/botella.png',
    size: 102,
  },
  'frasco-vidrio': {
    path: '/assets/game-1/products/processed/tarro-vidrio.png',
    size: 102,
  },
  carton: {
    path: '/assets/game-1/products/processed/caja-carton.png',
    size: 98,
  },
  cascara: {
    path: '/assets/game-1/products/processed/cascaras.png',
    size: 108,
  },
  yerba: {
    path: '/assets/game-1/products/processed/yerba.png',
    size: 106,
  },
  envoltorio: {
    path: '/assets/game-1/products/processed/envoltorio-dulce.png',
    size: 106,
  },
};

export const INDUSTRIAL_PRODUCT_ASSETS: Record<string, ProductAsset> = {
  'pet-planta': {
    path: '/assets/game-1/products/processed/botella.png',
    size: 82,
  },
  caja: {
    path: '/assets/game-1/products/processed/caja-carton.png',
    size: 84,
  },
  'botella-vidrio': {
    path: '/assets/game-1/products/processed/tarro-vidrio.png',
    size: 82,
  },
};

export const COMPOST_PRODUCT_ASSETS: Record<string, ProductAsset> = {
  'restos-verdura': {
    path: '/assets/game-1/products/processed/cascaras.png',
    size: 58,
  },
  'cascaras-fruta': {
    path: '/assets/game-1/products/processed/cascaras.png',
    size: 58,
  },
  'yerba-compost': {
    path: '/assets/game-1/products/processed/yerba.png',
    size: 58,
  },
  'carton-sin-tinta': {
    path: '/assets/game-1/products/processed/caja-carton.png',
    size: 56,
  },
  'carton-trocitos': {
    path: '/assets/game-1/products/processed/caja-carton.png',
    size: 54,
  },
};

export const HOME_BIN_ASSETS: Record<string, BinAssets> = {
  reciclables: {
    normal: 'bin-reciclables-normal',
    hover: 'bin-reciclables-hover',
    open: 'bin-reciclables-open',
    error: 'bin-reciclables-error',
  },
  'no-reciclables': {
    normal: 'bin-no-reciclables-normal',
    hover: 'bin-no-reciclables-hover',
    open: 'bin-no-reciclables-open',
    error: 'bin-no-reciclables-error',
  },
  compostables: {
    normal: 'bin-compostables-normal',
    hover: 'bin-compostables-hover',
    open: 'bin-compostables-open',
    error: 'bin-compostables-error',
  },
};

export const HOME_BIN_ASSET_PATHS: Record<string, string> = {
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
  'bin-compostables-error': '/assets/game-1/bins/processed/compostables-error.png',
};

export const HOME_EFFECT_ASSETS: Record<string, string> = {
  starburst: '/assets/game-1/effects/processed/starburst.png',
  confetti: '/assets/game-1/effects/processed/confetti.png',
  'green-ring': '/assets/game-1/effects/processed/green-ring.png',
  coin: '/assets/game-1/effects/processed/coin.png',
  medal: '/assets/game-1/effects/processed/medal.png',
  'error-x': '/assets/game-1/effects/processed/error-x.png',
  'error-burst': '/assets/game-1/effects/processed/error-burst.png',
  'drag-hand': '/assets/game-1/effects/processed/drag-hand.png',
};

export const INDUSTRIAL_BACKGROUND_ASSET: ImageAsset = {
  key: 'industrial-background',
  path: '/assets/game-2/backgrounds/fondo-juego-2.png',
};

export const COMPOST_BACKGROUND_ASSET: ImageAsset = {
  key: 'compost-background',
  path: '/assets/game-3/backgrounds/fondo-compostera.png',
};

export const INDUSTRIAL_CONVEYOR_ASSETS: Record<'base' | 'belt', ImageAsset> = {
  base: {
    key: 'industrial-conveyor-base',
    path: '/assets/game-2/conveyor/cinta-base-full.svg',
  },
  belt: {
    key: 'industrial-conveyor-belt',
    path: '/assets/game-2/conveyor/cinta-banda-loop.svg',
  },
};

export const INDUSTRIAL_BIN_ASSETS: Record<string, ImageAsset> = {
  plastico: {
    key: 'industrial-bin-plastico',
    path: '/assets/game-2/bins/tacho-azul-plastico.png',
    sourceWidth: 1024,
    sourceHeight: 1536,
    crop: { x: 72, y: 384, width: 878, height: 614 },
  },
  'papel-carton': {
    key: 'industrial-bin-papel-carton',
    path: '/assets/game-2/bins/tacho-amarillo-papel-carton.png',
    sourceWidth: 1024,
    sourceHeight: 1536,
    crop: { x: 58, y: 406, width: 902, height: 720 },
  },
  vidrio: {
    key: 'industrial-bin-vidrio',
    path: '/assets/game-2/bins/tacho-verde-vidrio.png',
    sourceWidth: 1024,
    sourceHeight: 1536,
    crop: { x: 72, y: 403, width: 880, height: 605 },
  },
  metal: {
    key: 'industrial-bin-metal',
    path: '/assets/game-2/bins/tacho-rojo-metal.png',
    sourceWidth: 1024,
    sourceHeight: 1536,
    crop: { x: 48, y: 354, width: 926, height: 671 },
  },
  descarte: {
    key: 'industrial-bin-descarte',
    path: '/assets/game-2/bins/tacho-gris-descarte.png',
    sourceWidth: 1024,
    sourceHeight: 1536,
    crop: { x: 51, y: 422, width: 921, height: 670 },
  },
};
