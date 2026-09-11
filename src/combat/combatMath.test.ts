import { describe, expect, it } from 'vitest';
import { applyDamage, isDefeated, scaledSkillDamage } from './combatMath';

describe('combat math', () => {
  it('applies non-negative integer damage and clamps at zero', () => {
    const target = { hp: 20, maxHp: 20, attack: 5 };
    expect(applyDamage(target, 7).hp).toBe(13);
    expect(applyDamage(target, 999).hp).toBe(0);
    expect(applyDamage(target, -5).hp).toBe(20);
  });

  it('detects defeated combatants', () => {
    expect(isDefeated({ hp: 0, maxHp: 10, attack: 1 })).toBe(true);
    expect(isDefeated({ hp: 1, maxHp: 10, attack: 1 })).toBe(false);
  });

  it('calculates deterministic skill damage', () => {
    expect(scaledSkillDamage(18, 1.5)).toBe(27);
    expect(scaledSkillDamage(1, 0)).toBe(1);
  });
});
