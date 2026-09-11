import type { HeroId } from '../data/heroes';

const SAVE_KEY = 'khar-zhaelyx-save-v1';

export interface SaveData {
  stage: number;
  selectedHero: HeroId;
}

export const DEFAULT_SAVE: SaveData = { stage: 1, selectedHero: 'warrior' };

export function loadSave(storage: Storage | undefined = typeof localStorage === 'undefined' ? undefined : localStorage): SaveData {
  if (!storage) return { ...DEFAULT_SAVE };
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return { ...DEFAULT_SAVE };
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    const stage = Number.isFinite(parsed.stage) ? Math.max(1, Math.floor(parsed.stage as number)) : 1;
    const selectedHero = parsed.selectedHero === 'mage' || parsed.selectedHero === 'ranger' || parsed.selectedHero === 'assassin' || parsed.selectedHero === 'warrior'
      ? parsed.selectedHero
      : 'warrior';
    return { stage, selectedHero };
  } catch {
    return { ...DEFAULT_SAVE };
  }
}

export function saveGame(data: SaveData, storage: Storage | undefined = typeof localStorage === 'undefined' ? undefined : localStorage): void {
  if (!storage) return;
  storage.setItem(SAVE_KEY, JSON.stringify({
    stage: Math.max(1, Math.floor(data.stage)),
    selectedHero: data.selectedHero,
  }));
}

export function clearSave(storage: Storage | undefined = typeof localStorage === 'undefined' ? undefined : localStorage): void {
  storage?.removeItem(SAVE_KEY);
}
