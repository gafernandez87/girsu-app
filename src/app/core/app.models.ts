export type UserRole = 'player' | 'admin';

export type LocalitySource = 'jujuy_catalog' | 'manual' | 'legacy';

export type StageKind = 'sorting' | 'conveyor' | 'compost' | 'landfill';

export interface UserProfile {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: UserRole;
  readonly birthDate?: string | null;
  readonly province?: string;
  readonly locality?: string;
  readonly localityId?: string | null;
  readonly localitySource?: LocalitySource;
  readonly schoolId?: string | null;
  readonly schoolMembership?: string;
  readonly schoolRole?: string;
  readonly school: string;
  readonly course: string;
  readonly wasteSeparation?: readonly string[];
  readonly composting?: readonly string[];
  readonly isActive: boolean;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export interface JujuyLocality {
  readonly id: string;
  readonly name: string;
}

export interface School {
  readonly id: string;
  readonly sourceCode: string;
  readonly name: string;
  readonly street: string;
  readonly streetNumber: string;
  readonly neighborhood: string;
  readonly locality: string;
  readonly department: string;
  readonly phone: string;
  readonly region: string;
  readonly sector: string;
  readonly scope: string;
  readonly category: string;
  readonly permanence: string;
  readonly operatingPeriod: string;
  readonly email: string;
  readonly isActive: boolean;
  readonly createdAt?: string;
  readonly updatedAt?: string;
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
  readonly rawScore?: number;
  readonly scoreBreakdown?: readonly StageScoreBreakdownItem[];
  readonly correct: number;
  readonly mistakes: number;
  readonly remainingSeconds: number;
  readonly completedAt: string;
}

export interface StageScoreBreakdownItem {
  readonly id: string;
  readonly label: string;
  readonly score: number;
}

export interface LeaderboardEntry {
  readonly position: number;
  readonly userId: string;
  readonly name: string;
  readonly schoolId?: string | null;
  readonly school: string;
  readonly course?: string;
  readonly score: number;
  readonly completedStages?: number;
  readonly lastPlayedAt?: string | null;
  readonly isCurrentUser?: boolean;
}
