export type HeroId = 'warrior' | 'mage' | 'ranger' | 'assassin';

export interface HeroDefinition {
  id: HeroId;
  name: string;
  role: string;
  identity: string;
  maxHp: number;
  attack: number;
  attackIntervalMs: number;
  skillName: string;
  skillDescription: string;
  skillCooldownMs: number;
  skillMultiplier: number;
  skillTargetCount: number;
}

export const HEROES: Record<HeroId, HeroDefinition> = {
  warrior: {
    id: 'warrior', name: 'Warrior', role: 'Tank / défense', identity: '32% damage reduction • defensive shield', maxHp: 180, attack: 18,
    attackIntervalMs: 1200, skillName: 'Shield Break', skillDescription: 'Damage + a shield worth 22% max HP.', skillCooldownMs: 5200, skillMultiplier: 1.5, skillTargetCount: 1,
  },
  mage: {
    id: 'mage', name: 'Mage', role: 'Zone / contrôle', identity: 'Arcane splash • enemy delay', maxHp: 110, attack: 28,
    attackIntervalMs: 1500, skillName: 'Arcane Burst', skillDescription: 'Burst + splash damage and delays the next enemy attack.', skillCooldownMs: 6000, skillMultiplier: 1.35, skillTargetCount: 2,
  },
  ranger: {
    id: 'ranger', name: 'Ranger', role: 'Distance / critique', identity: '32% crit chance • precision burst', maxHp: 125, attack: 25,
    attackIntervalMs: 1100, skillName: 'Deadeye', skillDescription: 'Guaranteed precision critical.', skillCooldownMs: 5000, skillMultiplier: 2.1, skillTargetCount: 1,
  },
  assassin: {
    id: 'assassin', name: 'Assassin', role: 'Mono-cible / burst', identity: 'Fast strikes • +45% execute below 35% HP', maxHp: 95, attack: 34,
    attackIntervalMs: 900, skillName: 'Shadow Strike', skillDescription: 'Heavy single-target burst, amplified on wounded enemies.', skillCooldownMs: 4500, skillMultiplier: 2.35, skillTargetCount: 1,
  },
};

export const HERO_ORDER: HeroId[] = ['warrior', 'mage', 'ranger', 'assassin'];
