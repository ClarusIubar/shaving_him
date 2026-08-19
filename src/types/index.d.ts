/**
 * Shaving Him - System Type Definitions & Data Transfer Objects (DTO)
 * SDD (Specification-Driven Development) Type Contracts
 */

export interface HairPosition {
    r: number;
    c: number;
}

export type RGBTuple = [number, number, number];
export type RGBATuple = [number, number, number, number];
export type ColorCell = RGBTuple | RGBATuple;

export interface StageDataDTO {
    rows: number;
    cols: number;
    totalHairCount?: number;
    hairPositions: HairPosition[];
    textGrid?: string[];
    colorGrid?: ColorCell[][] | null;
}

export interface FinalScoreResult {
    baseScore: number;
    timeBonus: number;
    allClearBonus: number;
    totalScore: number;
}

export type SessionStatusType = 'INIT' | 'RUNNING' | 'PAUSED' | 'WON' | 'TIMEOUT';

export interface SessionSnapshotDTO {
    status: SessionStatusType;
    timeLeft: number;
    maxTime: number;
    score: number;
    comboCount: number;
    finalResult: FinalScoreResult;
    remainingHairs: number;
    totalHairs: number;
    percentageCleared: number;
}

export interface ShaveResultDTO {
    removed: number;
    dirtyCells: HairPosition[];
}

export interface ReadOnlyHairView {
    has(r: number, c: number): boolean;
}

export interface StateUpdateEventDTO {
    snapshot: SessionSnapshotDTO;
    dirtyCells: HairPosition[] | null;
    isTimerTick: boolean;
    stageData: StageDataDTO | null;
    hairView: ReadOnlyHairView | null;
}

export interface IScoringStrategy {
    calculateMultiplier(streak: number): number;
    calculateTimeBonus(timeLeft: number): number;
    calculateAllClearBonus(remainingHairs: number): number;
}
