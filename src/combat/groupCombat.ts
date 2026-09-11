import type { HeroId } from '../data/heroes';
import { damageAfterArmor, getEnemyForStage, type EnemyDefinition } from '../data/enemies';

export interface EnemyCombatant {
  id: string;
  definition: EnemyDefinition;
  hp: number;
}

export function buildEnemyGroup(stage: number): EnemyCombatant[] {
  const safeStage = Math.max(1, Math.floor(stage));
  const size = Math.min(3, safeStage);
  return Array.from({ length: size }, (_, index) => {
    const definition = getEnemyForStage(safeStage + index);
    const hpScale = index === 0 ? 1 : index === 1 ? 0.72 : 0.58;
    const attackScale = index === 0 ? 1 : index === 1 ? 0.42 : 0.28;
    const maxHp = Math.max(1, Math.floor(definition.maxHp * hpScale));
    const attack = Math.max(1, Math.floor(definition.attack * attackScale));
    return {
      id: `stage-${safeStage}-enemy-${index + 1}`,
      definition: { ...definition, maxHp, attack },
      hp: maxHp,
    };
  });
}

export function livingEnemies(group: readonly EnemyCombatant[]): EnemyCombatant[] {
  return group.filter((enemy) => enemy.hp > 0);
}

export function isGroupDefeated(group: readonly EnemyCombatant[]): boolean {
  return group.length > 0 && livingEnemies(group).length === 0;
}

export function selectHeroTarget(heroId: HeroId, group: readonly EnemyCombatant[]): EnemyCombatant | undefined {
  const living = livingEnemies(group);
  if (living.length === 0) return undefined;

  if (heroId === 'ranger') {
    return [...living].sort((a, b) =>
      a.definition.attackIntervalMs - b.definition.attackIntervalMs ||
      a.hp - b.hp ||
      a.id.localeCompare(b.id),
    )[0];
  }

  if (heroId === 'assassin') {
    return [...living].sort((a, b) => {
      const aRatio = a.hp / a.definition.maxHp;
      const bRatio = b.hp / b.definition.maxHp;
      return aRatio - bRatio || a.hp - b.hp || a.id.localeCompare(b.id);
    })[0];
  }

  return living[0];
}

export function selectSplashTargets(
  group: readonly EnemyCombatant[],
  primaryTargetId: string,
  targetCount: number,
): EnemyCombatant[] {
  const secondaryCount = Math.max(0, Math.floor(targetCount) - 1);
  if (secondaryCount === 0) return [];
  return livingEnemies(group)
    .filter((enemy) => enemy.id !== primaryTargetId)
    .slice(0, secondaryCount);
}

export function applyDamageToEnemy(enemy: EnemyCombatant, rawDamage: number): EnemyCombatant {
  const damage = damageAfterArmor(rawDamage, enemy.definition.armor);
  return { ...enemy, hp: Math.max(0, enemy.hp - damage) };
}

export function replaceEnemy(group: readonly EnemyCombatant[], updated: EnemyCombatant): EnemyCombatant[] {
  return group.map((enemy) => enemy.id === updated.id ? updated : enemy);
}
