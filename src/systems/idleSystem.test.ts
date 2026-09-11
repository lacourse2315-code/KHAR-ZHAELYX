import { describe, expect, it } from 'vitest';
import { calculateOfflineReward, MAX_OFFLINE_MS } from './idleSystem';

describe('idle system', () => {
  it('does not farm before a stage has been mastered', () => {
    expect(calculateOfflineReward(1, 0, 60 * 60 * 1000).gold).toBe(0);
  });

  it('farms only the last mastered stage without advancing campaign', () => {
    const result = calculateOfflineReward(4, 0, 60 * 60 * 1000);
    expect(result.farmedStage).toBe(3);
    expect(result.simulatedVictories).toBe(15);
    expect(result.gold).toBeGreaterThan(0);
  });

  it('caps offline time at eight hours', () => {
    const result = calculateOfflineReward(8, 0, 24 * 60 * 60 * 1000);
    expect(result.elapsedMs).toBe(MAX_OFFLINE_MS);
  });
});
