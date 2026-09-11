import { HERO_ORDER, type HeroId } from '../data/heroes';

const SAVE_KEY = 'khar-zhaelyx-save-v2';
const LEGACY_SAVE_KEY = 'khar-zhaelyx-save-v1';
export const SAVE_VERSION = 2;

export type HeroLevels = Record<HeroId, number>;

export interface SaveData {
  version: number;
  stage: number;
  selectedHero: HeroId;
  gold: number;
  heroLevels: HeroLevels;
  lastSavedAt: number;
}

const defaultHeroLevels = (): HeroLevels => ({ warrior: 1, mage: 1, ranger: 1, assassin: 1 });

export const DEFAULT_SAVE: SaveData = {
  version: SAVE_VERSION,
  stage: 1,
  selectedHero: 'warrior',
  gold: 0,
  heroLevels: defaultHeroLevels(),
  lastSavedAt: 0,
};

function isHeroId(value: unknown): value is HeroId {
  return value === 'mage' || value === 'ranger' || value === 'assassin' || value === 'warrior';
}

function sanitize(parsed: Partial<SaveData>, now: number): SaveData {
  const levels = defaultHeroLevels();
  for (const id of HERO_ORDER) {
    const candidate = parsed.heroLevels?.[id];
    if (Number.isFinite(candidate)) levels[id] = Math.max(1, Math.floor(candidate as number));
  }
  return {
    version: SAVE_VERSION,
    stage: Number.isFinite(parsed.stage) ? Math.max(1, Math.floor(parsed.stage as number)) : 1,
    selectedHero: isHeroId(parsed.selectedHero) ? parsed.selectedHero : 'warrior',
    gold: Number.isFinite(parsed.gold) ? Math.max(0, Math.floor(parsed.gold as number)) : 0,
    heroLevels: levels,
    lastSavedAt: Number.isFinite(parsed.lastSavedAt) ? Math.max(0, Math.floor(parsed.lastSavedAt as number)) : now,
  };
}

export function loadSave(
  storage: Storage | undefined = typeof localStorage === 'undefined' ? undefined : localStorage,
  now = Date.now(),
): SaveData {
  if (!storage) return { ...DEFAULT_SAVE, heroLevels: defaultHeroLevels(), lastSavedAt: now };
  try {
    const raw = storage.getItem(SAVE_KEY) ?? storage.getItem(LEGACY_SAVE_KEY);
    if (!raw) return { ...DEFAULT_SAVE, heroLevels: defaultHeroLevels(), lastSavedAt: now };
    return sanitize(JSON.parse(raw) as Partial<SaveData>, now);
  } catch {
    return { ...DEFAULT_SAVE, heroLevels: defaultHeroLevels(), lastSavedAt: now };
  }
}

export function saveGame(
  data: SaveData,
  storage: Storage | undefined = typeof localStorage === 'undefined' ? undefined : localStorage,
  now = Date.now(),
): void {
  if (!storage) return;
  const sanitized = sanitize({ ...data, lastSavedAt: now }, now);
  storage.setItem(SAVE_KEY, JSON.stringify(sanitized));
}

export function clearSave(storage: Storage | undefined = typeof localStorage === 'undefined' ? undefined : localStorage): void {
  storage?.removeItem(SAVE_KEY);
  storage?.removeItem(LEGACY_SAVE_KEY);
}
