export function sanitizeStageScore(score: number): number {
  return Math.max(0, Math.round(score));
}
