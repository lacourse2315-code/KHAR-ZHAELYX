export interface EnemyDefinition {
  name: string;
  maxHp: number;
  attack: number;
  attackIntervalMs: number;
}

export function getEnemyForStage(stage: number): EnemyDefinition {
  const safeStage = Math.max(1, stage);
  return {
    name: `Abyssal Warden ${safeStage}`,
    maxHp: 75 + (safeStage - 1) * 18,
    attack: 10 + Math.floor((safeStage - 1) * 2.5),
    attackIntervalMs: Math.max(700, 1500 - Math.min(500, (safeStage - 1) * 20)),
  };
}
