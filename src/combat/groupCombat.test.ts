import { describe, expect, it } from 'vitest';
import { HEROES } from '../data/heroes';
import { damageAfterArmor } from '../data/enemies';
import { resolveHeroSkill } from './heroCombat';
import { applyDamageToEnemy, buildEnemyGroup, isGroupDefeated, replaceEnemy, selectHeroTarget, selectSplashTargets } from './groupCombat';

describe('enemy groups', () => {
  it('builds deterministic groups of 1, 2 and 3 enemies', () => {
    expect(buildEnemyGroup(1)).toHaveLength(1);
    expect(buildEnemyGroup(2)).toHaveLength(2);
    expect(buildEnemyGroup(3)).toHaveLength(3);
    expect(buildEnemyGroup(8).map((enemy) => enemy.id)).toEqual([
      'stage-8-enemy-1', 'stage-8-enemy-2', 'stage-8-enemy-3',
    ]);
  });

  it('ignores dead enemies and only wins when the whole group is dead', () => {
    const group = buildEnemyGroup(3);
    const firstDead = replaceEnemy(group, { ...group[0], hp: 0 });
    expect(selectHeroTarget('warrior', firstDead)?.id).toBe(group[1].id);
    expect(isGroupDefeated(firstDead)).toBe(false);
    const allDead = firstDead.map((enemy) => ({ ...enemy, hp: 0 }));
    expect(isGroupDefeated(allDead)).toBe(true);
  });

  it('uses deterministic hero targeting rules', () => {
    const group = buildEnemyGroup(3);
    const wounded = replaceEnemy(group, { ...group[2], hp: 1 });
    expect(selectHeroTarget('warrior', wounded)?.id).toBe(group[0].id);
    expect(selectHeroTarget('mage', wounded)?.id).toBe(group[0].id);
    expect(selectHeroTarget('assassin', wounded)?.id).toBe(group[2].id);
    const rangerTarget = selectHeroTarget('ranger', wounded);
    const fastest = [...wounded].sort((a, b) => a.definition.attackIntervalMs - b.definition.attackIntervalMs || a.hp - b.hp || a.id.localeCompare(b.id))[0];
    expect(rangerTarget?.id).toBe(fastest.id);
  });

  it('applies real Arcane Burst primary and splash damage to living enemies', () => {
    let group = buildEnemyGroup(6);
    const mageSkill = resolveHeroSkill(HEROES.mage);
    const primary = selectHeroTarget('mage', group);
    expect(primary).toBeDefined();
    if (!primary) throw new Error('Expected a living primary target');

    const hpBefore = group.map((enemy) => enemy.hp);
    const expectedPrimaryDamage = damageAfterArmor(mageSkill.primaryDamage, group[0].definition.armor);
    const expectedSplashDamage = damageAfterArmor(mageSkill.splashDamage, group[1].definition.armor);
    const updatedPrimary = applyDamageToEnemy(primary, mageSkill.primaryDamage);
    group = replaceEnemy(group, updatedPrimary);

    const splashTargets = selectSplashTargets(group, primary.id, HEROES.mage.skillTargetCount);
    expect(splashTargets).toHaveLength(1);
    for (const secondary of splashTargets) {
      group = replaceEnemy(group, applyDamageToEnemy(secondary, mageSkill.splashDamage));
    }

    expect(hpBefore[0] - group[0].hp).toBe(expectedPrimaryDamage);
    expect(hpBefore[1] - group[1].hp).toBe(expectedSplashDamage);
    expect(group[2].hp).toBe(hpBefore[2]);
    expect(mageSkill.enemyDelayMs).toBe(950);
  });

  it('excludes dead enemies from Arcane Burst splash', () => {
    const mageSkill = resolveHeroSkill(HEROES.mage);
    let group = buildEnemyGroup(6);
    group = replaceEnemy(group, { ...group[1], hp: 0 });
    const primary = selectHeroTarget('mage', group);
    expect(primary).toBeDefined();
    if (!primary) throw new Error('Expected a living primary target');

    const deadHpBefore = group[1].hp;
    const thirdHpBefore = group[2].hp;
    const splashTargets = selectSplashTargets(group, primary.id, HEROES.mage.skillTargetCount);
    expect(splashTargets.map((enemy) => enemy.id)).toEqual([group[2].id]);

    for (const secondary of splashTargets) {
      group = replaceEnemy(group, applyDamageToEnemy(secondary, mageSkill.splashDamage));
    }

    expect(group[1].hp).toBe(deadHpBefore);
    expect(group[2].hp).toBeLessThan(thirdHpBefore);
  });
});
