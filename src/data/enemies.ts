export type EnemyArchetype = 'brute' | 'raider' | 'bulwark';

export interface EnemyDefinition {
  name: string;
  archetype: EnemyArchetype;
  trait: string;
  maxHp: number;
  attack: number;
  attackIntervalMs: number;
  armor: number;
}

export function getEnemyForStage(stage: number): EnemyDefinition {
  const safeStage = Math.max(1, stage);
  const cycle = (safeStage - 1) % 3;
  const baseHp = 75 + (safeStage - 1) * 18;
  const baseAttack = 10 + Math.floor((safeStage - 1) * 2.5);

  if (cycle === 1) {
    return {
      name: `Abyssal Raider ${safeStage}`,
      archetype: 'raider',
      trait: 'Fast attacker',
      maxHp: Math.floor(baseHp * 0.82),
      attack: Math.max(1, Math.floor(baseAttack * 0.82)),
      attackIntervalMs: Math.max(520, 980 - Math.min(260, (safeStage - 1) * 10)),
      armor: 0,
    };
  }

  if (cycle === 2) {
    return {
      name: `Abyssal Bulwark ${safeStage}`,
      archetype: 'bulwark',
      trait: 'Armored survivor',
      maxHp: Math.floor(baseHp * 1.18),
      attack: baseAttack,
      attackIntervalMs: Math.max(800, 1650 - Math.min(450, (safeStage - 1) * 18)),
      armor: 0.12,
    };
  }

  return {
    name: `Abyssal Brute ${safeStage}`,
    archetype: 'brute',
    trait: 'Heavy hitter',
    maxHp: baseHp,
    attack: Math.floor(baseAttack * 1.15),
    attackIntervalMs: Math.max(850, 1600 - Math.min(450, (safeStage - 1) * 18)),
    armor: 0,
  };
}

export function damageAfterArmor(damage: number, armor: number): number {
  return Math.max(1, Math.floor(Math.max(0, damage) * (1 - Math.min(0.8, Math.max(0, armor)))));
}
