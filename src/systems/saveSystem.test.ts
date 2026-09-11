import { describe, expect, it } from 'vitest';
import { SAVE_VERSION, clearSave, loadSave, saveGame, type SaveData } from './saveSystem';

function memoryStorage(seed: Record<string, string> = {}): Storage {
  const values = new Map<string, string>(Object.entries(seed));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); },
    clear: () => values.clear(),
    key: (index) => [...values.keys()][index] ?? null,
    get length() { return values.size; },
  } as Storage;
}

const sampleSave = (overrides: Partial<SaveData> = {}): SaveData => ({
  version: SAVE_VERSION,
  stage: 7,
  selectedHero: 'assassin',
  gold: 250,
  heroLevels: { warrior: 1, mage: 2, ranger: 1, assassin: 3 },
  lastSavedAt: 1000,
  ...overrides,
});

describe('save system', () => {
  it('returns safe defaults when no save exists', () => {
    const save = loadSave(memoryStorage(), 5000);
    expect(save.stage).toBe(1);
    expect(save.gold).toBe(0);
    expect(save.lastSavedAt).toBe(5000);
  });

  it('round-trips progression data', () => {
    const storage = memoryStorage();
    saveGame(sampleSave(), storage, 2000);
    expect(loadSave(storage, 3000)).toEqual(sampleSave({ lastSavedAt: 2000 }));
  });

  it('migrates a Jalon 001 save without losing stage or hero', () => {
    const storage = memoryStorage({ 'khar-zhaelyx-save-v1': JSON.stringify({ stage: 9, selectedHero: 'mage' }) });
    const migrated = loadSave(storage, 7000);
    expect(migrated.stage).toBe(9);
    expect(migrated.selectedHero).toBe('mage');
    expect(migrated.gold).toBe(0);
    expect(migrated.heroLevels.mage).toBe(1);
  });

  it('sanitizes invalid data', () => {
    const storage = memoryStorage({ 'khar-zhaelyx-save-v2': JSON.stringify({ stage: -50, gold: -3, selectedHero: 'bad', heroLevels: { warrior: 0 } }) });
    const save = loadSave(storage, 9000);
    expect(save.stage).toBe(1);
    expect(save.gold).toBe(0);
    expect(save.selectedHero).toBe('warrior');
    expect(save.heroLevels.warrior).toBe(1);
  });

  it('survives malformed JSON and clear removes both save generations', () => {
    const storage = memoryStorage({ 'khar-zhaelyx-save-v2': '{bad', 'khar-zhaelyx-save-v1': '{}' });
    expect(loadSave(storage, 100).stage).toBe(1);
    clearSave(storage);
    expect(storage.length).toBe(0);
  });
});
