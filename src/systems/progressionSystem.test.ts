import { describe, expect, it } from 'vitest';
import { HEROES } from '../data/heroes';
import { buyHeroUpgrade, getUpgradedHero, heroUpgradeCost, rewardForStage } from './progressionSystem';

describe('progression system', () => {
  it('scales stage rewards deterministically', () => {
    expect(rewardForStage(1)).toBe(16);
    expect(rewardForStage(5)).toBe(32);
  });

  it('increases upgrade cost with level', () => {
    expect(heroUpgradeCost(1)).toBe(40);
    expect(heroUpgradeCost(3)).toBe(100);
  });

  it('spends gold and increases hero level', () => {
    expect(buyHeroUpgrade(75, 1)).toEqual({ success: true, gold: 35, level: 2, cost: 40 });
    expect(buyHeroUpgrade(39, 1).success).toBe(false);
  });

  it('makes upgrades affect real combat stats', () => {
    const upgraded = getUpgradedHero(HEROES.warrior, 2);
    expect(upgraded.attack).toBeGreaterThan(HEROES.warrior.attack);
    expect(upgraded.maxHp).toBeGreaterThan(HEROES.warrior.maxHp);
  });
});
