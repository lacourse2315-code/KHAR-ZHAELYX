import { rewardForStage } from './progressionSystem';

export const MAX_OFFLINE_MS = 8 * 60 * 60 * 1000;
export const IDLE_KILLS_PER_MINUTE = 0.25;

export interface OfflineReward {
  gold: number;
  elapsedMs: number;
  farmedStage: number;
  simulatedVictories: number;
}

export function calculateOfflineReward(currentStage: number, lastSavedAt: number, now: number): OfflineReward {
  const farmedStage = Math.max(0, Math.floor(currentStage) - 1);
  const elapsedMs = Math.max(0, Math.min(MAX_OFFLINE_MS, now - lastSavedAt));
  if (farmedStage < 1 || !Number.isFinite(elapsedMs) || elapsedMs <= 0) {
    return { gold: 0, elapsedMs: 0, farmedStage, simulatedVictories: 0 };
  }

  const minutes = elapsedMs / 60000;
  const simulatedVictories = Math.floor(minutes * IDLE_KILLS_PER_MINUTE);
  return {
    gold: simulatedVictories * rewardForStage(farmedStage),
    elapsedMs,
    farmedStage,
    simulatedVictories,
  };
}
