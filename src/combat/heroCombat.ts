import type { HeroDefinition, HeroId } from '../data/heroes';

export interface HeroAttackResult {
  damage: number;
  critical: boolean;
  label: string;
}

export interface HeroSkillResult {
  primaryDamage: number;
  splashDamage: number;
  enemyDelayMs: number;
  shield: number;
  critical: boolean;
  label: string;
}

export function resolveHeroAttack(hero: HeroDefinition, roll = Math.random()): HeroAttackResult {
  if (hero.id === 'ranger') {
    const critical = roll < 0.32;
    return {
      damage: critical ? Math.floor(hero.attack * 1.9) : hero.attack,
      critical,
      label: critical ? 'Precision Critical' : 'Ranged Shot',
    };
  }
  if (hero.id === 'assassin') {
    const critical = roll < 0.12;
    return {
      damage: critical ? Math.floor(hero.attack * 1.6) : hero.attack,
      critical,
      label: critical ? 'Lethal Opening' : 'Quick Strike',
    };
  }
  return { damage: hero.attack, critical: false, label: hero.id === 'warrior' ? 'Guarded Strike' : 'Arcane Bolt' };
}

export function resolveHeroSkill(hero: HeroDefinition): HeroSkillResult {
  const base = Math.max(1, Math.floor(hero.attack * hero.skillMultiplier));
  switch (hero.id) {
    case 'warrior':
      return { primaryDamage: base, splashDamage: 0, enemyDelayMs: 0, shield: Math.max(1, Math.floor(hero.maxHp * 0.22)), critical: false, label: 'Shield Break' };
    case 'mage':
      return { primaryDamage: base, splashDamage: Math.max(1, Math.floor(base * 0.55)), enemyDelayMs: 950, shield: 0, critical: false, label: 'Arcane Burst' };
    case 'ranger':
      return { primaryDamage: base, splashDamage: 0, enemyDelayMs: 0, shield: 0, critical: true, label: 'Deadeye' };
    case 'assassin':
      return { primaryDamage: base, splashDamage: 0, enemyDelayMs: 0, shield: 0, critical: true, label: 'Shadow Strike' };
  }
}

export function incomingDamageForHero(heroId: HeroId, rawDamage: number): number {
  const mitigation = heroId === 'warrior' ? 0.68 : 1;
  return Math.max(1, Math.floor(Math.max(0, rawDamage) * mitigation));
}

export function executeMultiplier(heroId: HeroId, enemyHp: number, enemyMaxHp: number): number {
  if (heroId !== 'assassin' || enemyMaxHp <= 0) return 1;
  return enemyHp / enemyMaxHp <= 0.35 ? 1.45 : 1;
}
