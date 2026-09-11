export interface CombatantStats {
  hp: number;
  maxHp: number;
  attack: number;
}

export function applyDamage(target: CombatantStats, rawDamage: number): CombatantStats {
  const damage = Math.max(0, Math.floor(rawDamage));
  return { ...target, hp: Math.max(0, target.hp - damage) };
}

export function isDefeated(combatant: CombatantStats): boolean {
  return combatant.hp <= 0;
}

export function scaledSkillDamage(attack: number, multiplier: number): number {
  return Math.max(1, Math.floor(attack * multiplier));
}
