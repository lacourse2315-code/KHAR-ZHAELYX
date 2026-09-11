import { describe, expect, it } from 'vitest';
import { damageAfterArmor, getEnemyForStage } from './enemies';

describe('enemy archetypes', () => {
  it('cycles through brute, raider and bulwark behaviors', () => {
    expect(getEnemyForStage(1).archetype).toBe('brute');
    expect(getEnemyForStage(2).archetype).toBe('raider');
    expect(getEnemyForStage(3).archetype).toBe('bulwark');
  });

  it('raider attacks faster than brute and bulwark has armor', () => {
    const brute = getEnemyForStage(4);
    const raider = getEnemyForStage(5);
    const bulwark = getEnemyForStage(6);
    expect(raider.attackIntervalMs).toBeLessThan(brute.attackIntervalMs);
    expect(bulwark.armor).toBeGreaterThan(0);
    expect(damageAfterArmor(100, bulwark.armor)).toBeLessThan(100);
  });
});
