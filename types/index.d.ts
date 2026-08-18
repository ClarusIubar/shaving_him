/**
 * Shaving Him - Core TypeScript Type Definitions
 * Schema-Driven Development (SDD) DTOs & Interfaces
 */

export interface CellPosition {
    r: number;
    c: number;
}

export type RGBColor = [number, number, number];
export type RGBAColor = [number, number, number, number];

export interface StageDataDTO {
    cols: number;
    rows: number;
    totalHairCount?: number;
    hairPositions: CellPosition[];
    textGrid?: string[];
    colorGrid?: Array<Array<RGBColor | RGBAColor>> | null;
}

export interface SessionSnapshotDTO {
    score: number;
    shavedHair: number;
    totalHair: number;
    initialHairCount: number;
    remainingHair: number;
    streak: number;
    multiplier: number;
    timeLeft: number;
    isRunning: boolean;
    isEnded: boolean;
    clearPercentage: number;
    victory: boolean;
}

export interface GameConfigDTO {
    cols: number;
    rows: number;
    initialTime: number;
    targetClearRatio: number;
    fontW: number;
    fontH: number;
}

export interface DirtyCell {
    r: number;
    c: number;
}

export interface ParticleItem {
    r: number;
    c: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    char: string;
}
