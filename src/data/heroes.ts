export type HeroId = 'warrior' | 'mage' | 'ranger' | 'assassin';

export interface HeroDefinition {
  id: HeroId;
  name: string;
  role: string;
  maxHp: number;
  attack: number;
  attackIntervalMs: number;
  skillName: string;
  skillCooldownMs: number;
  skillMultiplier: number;
  skillTargetCount: number;
}

export const HEROES: Record<HeroId, HeroDefinition> = {
  warrior: {
    id: 'warrior', name: 'Warrior', role: 'Tank / défense', maxHp: 180, attack: 18,
    attackIntervalMs: 1200, skillName: 'Shield Break', skillCooldownMs: 5200, skillMultiplier: 1.5, skillTargetCount: 1,
  },
  mage: {
    id: 'mage', name: 'Mage', role: 'Zone / contrôle', maxHp: 110, attack: 28,
    attackIntervalMs: 1500, skillName: 'Arcane Burst', skillCooldownMs: 6000, skillMultiplier: 1.35, skillTargetCount: 1,
  },
  ranger: {
    id: 'ranger', name: 'Ranger', role: 'Distance / critique', maxHp: 125, attack: 25,
    attackIntervalMs: 1100, skillName: 'Deadeye', skillCooldownMs: 5000, skillMultiplier: 2.1, skillTargetCount: 1,
  },
  assassin: {
    id: 'assassin', name: 'Assassin', role: 'Mono-cible / burst', maxHp: 95, attack: 34,
    attackIntervalMs: 900, skillName: 'Shadow Strike', skillCooldownMs: 4500, skillMultiplier: 2.35, skillTargetCount: 1,
  },
};

export const HERO_ORDER: HeroId[] = ['warrior', 'mage', 'ranger', 'assassin'];
