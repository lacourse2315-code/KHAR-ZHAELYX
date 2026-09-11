import { describe, expect, it } from 'vitest';
import { HEROES } from '../data/heroes';
import { executeMultiplier, incomingDamageForHero, resolveHeroAttack, resolveHeroSkill } from './heroCombat';

describe('hero combat identities', () => {
  it('Warrior mitigates damage and creates a defensive shield', () => {
    expect(incomingDamageForHero('warrior', 100)).toBe(68);
    expect(resolveHeroSkill(HEROES.warrior).shield).toBeGreaterThan(0);
  });

  it('Mage Arcane Burst deals splash damage and delays the enemy', () => {
    const skill = resolveHeroSkill(HEROES.mage);
    expect(skill.splashDamage).toBeGreaterThan(0);
    expect(skill.enemyDelayMs).toBeGreaterThan(0);
  });

  it('Ranger has a reliable critical specialization and Deadeye crits', () => {
    expect(resolveHeroAttack(HEROES.ranger, 0.1).critical).toBe(true);
    expect(resolveHeroAttack(HEROES.ranger, 0.8).critical).toBe(false);
    expect(resolveHeroSkill(HEROES.ranger).critical).toBe(true);
  });

  it('Assassin gains execute burst against wounded targets', () => {
    expect(executeMultiplier('assassin', 30, 100)).toBe(1.45);
    expect(executeMultiplier('assassin', 80, 100)).toBe(1);
    expect(resolveHeroSkill(HEROES.assassin).primaryDamage).toBeGreaterThan(HEROES.assassin.attack * 2);
  });
});
