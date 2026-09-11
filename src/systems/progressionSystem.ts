import type { HeroDefinition, HeroId } from '../data/heroes';

export const HERO_UPGRADE_POWER_PER_LEVEL = 0.12;

export function rewardForStage(stage: number): number {
  const safeStage = Math.max(1, Math.floor(stage));
  return 12 + safeStage * 4;
}

export function heroUpgradeCost(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level));
  return 40 + (safeLevel - 1) * 30;
}

export function getHeroLevel(levels: Record<HeroId, number>, heroId: HeroId): number {
  return Math.max(1, Math.floor(levels[heroId] ?? 1));
}

export function getUpgradedHero(base: HeroDefinition, level: number): HeroDefinition {
  const safeLevel = Math.max(1, Math.floor(level));
  const multiplier = 1 + (safeLevel - 1) * HERO_UPGRADE_POWER_PER_LEVEL;
  return {
    ...base,
    maxHp: Math.round(base.maxHp * multiplier),
    attack: Math.round(base.attack * multiplier),
  };
}

export interface UpgradeResult {
  success: boolean;
  gold: number;
  level: number;
  cost: number;
}

export function buyHeroUpgrade(gold: number, level: number): UpgradeResult {
  const safeGold = Math.max(0, Math.floor(gold));
  const safeLevel = Math.max(1, Math.floor(level));
  const cost = heroUpgradeCost(safeLevel);
  if (safeGold < cost) return { success: false, gold: safeGold, level: safeLevel, cost };
  return { success: true, gold: safeGold - cost, level: safeLevel + 1, cost };
}
