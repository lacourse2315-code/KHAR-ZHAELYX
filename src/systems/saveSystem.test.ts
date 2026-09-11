import { describe, expect, it } from 'vitest';
import { DEFAULT_SAVE, clearSave, loadSave, saveGame } from './saveSystem';

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); },
    clear: () => values.clear(),
    key: (index) => [...values.keys()][index] ?? null,
    get length() { return values.size; },
  } as Storage;
}

describe('save system', () => {
  it('returns defaults when no save exists', () => {
    expect(loadSave(memoryStorage())).toEqual(DEFAULT_SAVE);
  });

  it('round-trips stage and hero', () => {
    const storage = memoryStorage();
    saveGame({ stage: 7, selectedHero: 'assassin' }, storage);
    expect(loadSave(storage)).toEqual({ stage: 7, selectedHero: 'assassin' });
  });

  it('clears the save', () => {
    const storage = memoryStorage();
    saveGame({ stage: 4, selectedHero: 'mage' }, storage);
    clearSave(storage);
    expect(loadSave(storage)).toEqual(DEFAULT_SAVE);
  });
});
