import type { GameStage } from './app.models';

export const STAGE_SCORE_TOTAL = 1000;

export function clampStageScore(score: number): number {
  return Math.min(STAGE_SCORE_TOTAL, Math.max(0, Math.round(score)));
}

export function normalizeRawStageScore(score: number, stage: GameStage): number {
  return clampStageScore((Math.max(0, score) / rawScoreCeiling(stage)) * STAGE_SCORE_TOTAL);
}

function rawScoreCeiling(stage: GameStage): number {
  if (stage.kind === 'landfill') {
    return Math.max(STAGE_SCORE_TOTAL, stage.durationSeconds * 60);
  }

  const itemCount = stage.items.length;
  const baseScore = stage.items.reduce((total, item) => total + item.points, 0);
  const comboScore = comboBonusStep(stage.kind) * ((itemCount * Math.max(0, itemCount - 1)) / 2);
  const accuracyScore = itemCount * accuracyBonusStep(stage.kind);
  const timeScore = stage.durationSeconds * 10;

  return Math.max(STAGE_SCORE_TOTAL, baseScore + comboScore + accuracyScore + timeScore);
}

function comboBonusStep(kind: GameStage['kind']): number {
  if (kind === 'sorting') {
    return 15;
  }

  if (kind === 'conveyor') {
    return 18;
  }

  if (kind === 'compost') {
    return 16;
  }

  return 0;
}

function accuracyBonusStep(kind: GameStage['kind']): number {
  if (kind === 'sorting') {
    return 20;
  }

  if (kind === 'conveyor') {
    return 18;
  }

  if (kind === 'compost') {
    return 22;
  }

  return 20;
}
