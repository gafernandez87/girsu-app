export type UserRole = 'student' | 'teacher';

export type StageKind = 'sorting' | 'conveyor' | 'compost' | 'landfill';

export interface UserProfile {
  readonly id: string;
  readonly name: string;
  readonly role: UserRole;
  readonly school: string;
  readonly course: string;
}

export interface DropZone {
  readonly id: string;
  readonly label: string;
  readonly shortLabel: string;
  readonly color: string;
  readonly description: string;
}

export interface GameItem {
  readonly id: string;
  readonly label: string;
  readonly symbol: string;
  readonly category: string;
  readonly detail: string;
  readonly points: number;
}

export interface GameStage {
  readonly id: string;
  readonly order: number;
  readonly title: string;
  readonly shortTitle: string;
  readonly subtitle: string;
  readonly objective: string;
  readonly environment: string;
  readonly introText: string;
  readonly mechanic: string;
  readonly scoring: string;
  readonly kind: StageKind;
  readonly durationSeconds: number;
  readonly accentColor: string;
  readonly backgroundColor: string;
  readonly dropZones: readonly DropZone[];
  readonly items: readonly GameItem[];
}

export interface StageResult {
  readonly stageId: string;
  readonly score: number;
  readonly correct: number;
  readonly mistakes: number;
  readonly remainingSeconds: number;
  readonly completedAt: string;
}

export interface LeaderboardEntry {
  readonly position: number;
  readonly name: string;
  readonly school: string;
  readonly score: number;
  readonly isCurrentUser?: boolean;
}
