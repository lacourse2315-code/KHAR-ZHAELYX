import Phaser from 'phaser';
import { HEROES, HERO_ORDER, type HeroDefinition, type HeroId } from '../data/heroes';
import { applyDamage } from '../combat/combatMath';
import { executeMultiplier, incomingDamageForHero, resolveHeroAttack, resolveHeroSkill } from '../combat/heroCombat';
import { applyDamageToEnemy, buildEnemyGroup, isGroupDefeated, livingEnemies, replaceEnemy, selectHeroTarget, selectSplashTargets, type EnemyCombatant } from '../combat/groupCombat';
import { calculateOfflineReward } from '../systems/idleSystem';
import { buyHeroUpgrade, getHeroLevel, getUpgradedHero, heroUpgradeCost, rewardForStage } from '../systems/progressionSystem';
import { loadSave, saveGame, type SaveData } from '../systems/saveSystem';

export class GameScene extends Phaser.Scene {
  private stage = 1;
  private selectedHero: HeroId = 'warrior';
  private saveData!: SaveData;
  private hero!: HeroDefinition;
  private enemies: EnemyCombatant[] = [];
  private heroHp = 1;
  private warriorShield = 0;
  private heroAttackTimer?: Phaser.Time.TimerEvent;
  private skillTimer?: Phaser.Time.TimerEvent;
  private nextStageTimer?: Phaser.Time.TimerEvent;
  private enemyTimers = new Map<string, Phaser.Time.TimerEvent>();
  private enemySprites = new Map<string, Phaser.GameObjects.Container>();
  private enemyHpTexts = new Map<string, Phaser.GameObjects.Text>();
  private enemyBars = new Map<string, Phaser.GameObjects.Rectangle>();
  private heroHpText?: Phaser.GameObjects.Text;
  private stageText?: Phaser.GameObjects.Text;
  private goldText?: Phaser.GameObjects.Text;
  private levelText?: Phaser.GameObjects.Text;
  private skillText?: Phaser.GameObjects.Text;
  private statusText?: Phaser.GameObjects.Text;
  private targetText?: Phaser.GameObjects.Text;
  private upgradeText?: Phaser.GameObjects.Text;
  private heroBar?: Phaser.GameObjects.Rectangle;
  private heroSprite?: Phaser.GameObjects.Container;
  private enemyLayer?: Phaser.GameObjects.Container;
  private running = false;
  private offlineGold = 0;

  constructor() { super('GameScene'); }

  init(data: { stage?: number; selectedHero?: HeroId }): void {
    const now = Date.now();
    this.saveData = loadSave(undefined, now);
    this.stage = Math.max(1, data.stage ?? this.saveData.stage);
    this.selectedHero = data.selectedHero ?? this.saveData.selectedHero;
    const offline = calculateOfflineReward(this.stage, this.saveData.lastSavedAt, now);
    this.offlineGold = offline.gold;
    this.saveData = { ...this.saveData, stage: this.stage, selectedHero: this.selectedHero, gold: this.saveData.gold + offline.gold };
    saveGame(this.saveData, undefined, now);
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#090c14');
    this.buildUi();
    this.startBattle();
    if (this.offlineGold > 0) this.statusText?.setText(`Offline farming: +${this.offlineGold} Gold from mastered stages.`);
  }

  shutdown(): void {
    this.stopBattleTimers();
    if (this.saveData) saveGame(this.saveData);
  }

  private buildUi(): void {
    this.add.rectangle(480, 270, 960, 540, 0x090c14);
    this.add.text(32, 18, 'KHAR ZHAELYX', { fontFamily: 'Georgia, serif', fontSize: '24px', color: '#f4f0e6', fontStyle: 'bold' });
    this.goldText = this.add.text(32, 50, '', { fontSize: '15px', color: '#e5c77a' });
    this.levelText = this.add.text(928, 50, '', { fontSize: '14px', color: '#9fa8bb' }).setOrigin(1, 0);
    this.stageText = this.add.text(928, 18, '', { fontSize: '17px', color: '#e5c77a' }).setOrigin(1, 0);
    this.statusText = this.add.text(480, 78, 'Preparing battle…', { fontSize: '15px', color: '#9fa8bb', align: 'center', wordWrap: { width: 760 } }).setOrigin(0.5);
    this.targetText = this.add.text(480, 103, '', { fontSize: '12px', color: '#71809d' }).setOrigin(0.5);

    this.add.text(170, 125, 'HERO', { fontSize: '13px', color: '#7f899f', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(735, 125, 'ENEMY GROUP', { fontSize: '13px', color: '#7f899f', fontStyle: 'bold' }).setOrigin(0.5);
    this.heroSprite = this.createFighter(170, 220, 0x38506d, 'H', 54);
    this.heroHpText = this.add.text(170, 286, '', { fontSize: '13px', color: '#e8edf7' }).setOrigin(0.5);
    this.heroBar = this.add.rectangle(170, 311, 230, 12, 0x274231).setOrigin(0.5).setStrokeStyle(1, 0x5f8069);
    this.enemyLayer = this.add.container(0, 0);

    this.skillText = this.add.text(480, 342, '', { fontSize: '12px', color: '#b9c8ea', align: 'center', wordWrap: { width: 700 } }).setOrigin(0.5);
    this.add.text(480, 366, 'AUTO COMBAT • AUTO TARGETING', { fontSize: '15px', color: '#e5c77a', fontStyle: 'bold' }).setOrigin(0.5);
    const upgrade = this.add.rectangle(480, 404, 300, 36, 0x4f3c20, 1).setStrokeStyle(1, 0xe5c77a).setInteractive({ useHandCursor: true });
    this.upgradeText = this.add.text(480, 404, '', { fontSize: '13px', color: '#fff4d0', fontStyle: 'bold' }).setOrigin(0.5);
    upgrade.on('pointerdown', () => this.upgradeSelectedHero());

    HERO_ORDER.forEach((id, index) => this.createHeroButton(id, 115 + index * 230));
    const retreat = this.add.text(480, 526, 'Return to title', { fontSize: '12px', color: '#7f899f' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    retreat.on('pointerdown', () => this.scene.start('TitleScene'));
  }

  private createHeroButton(id: HeroId, x: number): void {
    const button = this.add.rectangle(x, 474, 210, 66, 0x151b28, 1).setStrokeStyle(1, 0x3d465a).setInteractive({ useHandCursor: true });
    this.add.text(x, 458, HEROES[id].name, { fontSize: '14px', color: '#f4f0e6', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(x, 477, HEROES[id].role, { fontSize: '10px', color: '#9fa8bb' }).setOrigin(0.5);
    this.add.text(x, 494, HEROES[id].identity, { fontSize: '9px', color: '#6f7c96' }).setOrigin(0.5);
    button.on('pointerdown', () => { if (this.running && id !== this.selectedHero) this.switchHero(id); });
  }

  private createFighter(x: number, y: number, fill: number, letter: string, radius: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    container.add([
      this.add.circle(0, 0, radius, fill).setStrokeStyle(3, 0xb7c0d2),
      this.add.text(0, 0, letter, { fontSize: `${Math.floor(radius * 0.7)}px`, color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5),
    ]);
    return container;
  }

  private startBattle(): void {
    this.stopBattleTimers();
    this.clearEnemyUi();
    const level = getHeroLevel(this.saveData.heroLevels, this.selectedHero);
    this.hero = getUpgradedHero(HEROES[this.selectedHero], level);
    this.enemies = buildEnemyGroup(this.stage);
    this.heroHp = this.hero.maxHp;
    this.warriorShield = 0;
    this.running = true;
    this.stageText?.setText(`Stage ${this.stage} • ${this.enemies.length} foe${this.enemies.length > 1 ? 's' : ''}`);
    this.statusText?.setText(`${this.hero.name} engages ${this.enemies.length > 1 ? 'an enemy group' : this.enemies[0].definition.name}.`);
    this.buildEnemyUi();
    this.updateUi();
    this.heroAttackTimer = this.time.addEvent({ delay: this.hero.attackIntervalMs, loop: true, callback: () => this.heroAttack() });
    this.enemies.forEach((enemy) => this.scheduleEnemyAttack(enemy.id, enemy.definition.attackIntervalMs));
    this.skillTimer = this.time.addEvent({ delay: this.hero.skillCooldownMs, loop: true, callback: () => this.useSkill() });
  }

  private buildEnemyUi(): void {
    const livingCount = this.enemies.length;
    const positions = livingCount === 1 ? [735] : livingCount === 2 ? [670, 800] : [620, 735, 850];
    this.enemies.forEach((enemy, index) => {
      const x = positions[index];
      const sprite = this.createFighter(x, 210, 0x623c3c, `${index + 1}`, 40);
      const hpText = this.add.text(x, 263, '', { fontSize: '10px', color: '#e8edf7', align: 'center' }).setOrigin(0.5);
      const bar = this.add.rectangle(x, 284, 105, 8, 0x4b2929).setOrigin(0.5).setStrokeStyle(1, 0x8f5a5a);
      this.enemySprites.set(enemy.id, sprite);
      this.enemyHpTexts.set(enemy.id, hpText);
      this.enemyBars.set(enemy.id, bar);
      this.enemyLayer?.add([sprite, hpText, bar]);
    });
  }

  private clearEnemyUi(): void {
    this.enemySprites.clear();
    this.enemyHpTexts.clear();
    this.enemyBars.clear();
    this.enemyLayer?.removeAll(true);
  }

  private scheduleEnemyAttack(enemyId: string, delay: number): void {
    this.enemyTimers.get(enemyId)?.remove(false);
    const timer = this.time.addEvent({ delay, loop: false, callback: () => {
      this.enemyAttack(enemyId);
      const enemy = this.enemies.find((candidate) => candidate.id === enemyId);
      if (this.running && enemy && enemy.hp > 0) this.scheduleEnemyAttack(enemyId, enemy.definition.attackIntervalMs);
    } });
    this.enemyTimers.set(enemyId, timer);
  }

  private heroAttack(): void {
    if (!this.running) return;
    const target = selectHeroTarget(this.selectedHero, this.enemies);
    if (!target) return;
    const result = resolveHeroAttack(this.hero);
    const execute = executeMultiplier(this.selectedHero, target.hp, target.definition.maxHp);
    const updated = applyDamageToEnemy(target, Math.floor(result.damage * execute));
    const dealt = target.hp - updated.hp;
    this.enemies = replaceEnemy(this.enemies, updated);
    this.flash(this.enemySprites.get(target.id), result.critical ? 1.18 : 1.08);
    if (updated.hp <= 0) this.onEnemyDefeated(updated);
    this.statusText?.setText(`${result.label}${execute > 1 ? ' • EXECUTE' : ''}! ${dealt} damage to ${target.definition.name}.`);
    this.finishAction();
  }

  private useSkill(): void {
    if (!this.running) return;
    const target = selectHeroTarget(this.selectedHero, this.enemies);
    if (!target) return;
    const result = resolveHeroSkill(this.hero);
    const execute = executeMultiplier(this.selectedHero, target.hp, target.definition.maxHp);
    const updatedPrimary = applyDamageToEnemy(target, Math.floor(result.primaryDamage * execute));
    const primaryDamage = target.hp - updatedPrimary.hp;
    this.enemies = replaceEnemy(this.enemies, updatedPrimary);
    if (updatedPrimary.hp <= 0) this.onEnemyDefeated(updatedPrimary);

    let splashTotal = 0;
    const splashHits: string[] = [];
    if (result.splashDamage > 0) {
      const splashTargets = selectSplashTargets(this.enemies, target.id, this.hero.skillTargetCount);
      splashTargets.forEach((secondary) => {
        const updated = applyDamageToEnemy(secondary, result.splashDamage);
        const splashDamage = secondary.hp - updated.hp;
        splashTotal += splashDamage;
        splashHits.push(secondary.definition.name);
        this.enemies = replaceEnemy(this.enemies, updated);
        this.flash(this.enemySprites.get(secondary.id), 1.16);
        this.showSplashFeedback(secondary.id, splashDamage);
        if (updated.hp <= 0) this.onEnemyDefeated(updated);
      });
    }

    if (result.shield > 0) this.warriorShield = Math.max(this.warriorShield, result.shield);
    if (result.enemyDelayMs > 0) {
      livingEnemies(this.enemies).forEach((enemy) => this.scheduleEnemyAttack(enemy.id, enemy.definition.attackIntervalMs + result.enemyDelayMs));
    }
    this.flash(this.enemySprites.get(target.id), result.critical ? 1.22 : 1.14);
    const effects = [
      result.shield > 0 ? `shield +${result.shield}` : '',
      splashHits.length > 0 ? `SPLASH ${splashTotal} → ${splashHits.join(', ')}` : '',
      result.enemyDelayMs > 0 ? `group delay ${result.enemyDelayMs}ms` : '',
      execute > 1 ? 'EXECUTE' : '',
    ].filter(Boolean).join(' • ');
    this.statusText?.setText(`${result.label}! ${primaryDamage} to ${target.definition.name}${effects ? ` • ${effects}` : ''}`);
    this.finishAction();
  }

  private enemyAttack(enemyId: string): void {
    if (!this.running || this.heroHp <= 0) return;
    const enemy = this.enemies.find((candidate) => candidate.id === enemyId && candidate.hp > 0);
    if (!enemy) return;
    let damage = incomingDamageForHero(this.selectedHero, enemy.definition.attack);
    const absorbed = Math.min(this.warriorShield, damage);
    this.warriorShield -= absorbed;
    damage -= absorbed;
    if (damage > 0) this.heroHp = applyDamage({ hp: this.heroHp, maxHp: this.hero.maxHp, attack: this.hero.attack }, damage).hp;
    this.flash(this.heroSprite, absorbed > 0 ? 1.04 : 1.08);
    this.statusText?.setText(absorbed > 0 ? `${enemy.definition.name} attacks • shield absorbs ${absorbed}${damage > 0 ? ` • ${damage} HP` : ''}` : `${enemy.definition.name} hits for ${damage}`);
    this.updateUi();
    if (this.heroHp <= 0) this.handleDefeat();
  }

  private onEnemyDefeated(enemy: EnemyCombatant): void {
    this.enemyTimers.get(enemy.id)?.remove(false);
    this.enemyTimers.delete(enemy.id);
    this.enemySprites.get(enemy.id)?.setAlpha(0.25);
    this.enemyHpTexts.get(enemy.id)?.setText(`${enemy.definition.name}\nDEFEATED`);
  }

  private finishAction(): void {
    this.updateUi();
    if (isGroupDefeated(this.enemies)) this.handleVictory();
  }

  private handleVictory(): void {
    if (!this.running) return;
    this.running = false;
    this.stopBattleTimers();
    const completedStage = this.stage;
    const reward = rewardForStage(completedStage);
    this.stage += 1;
    this.saveData = { ...this.saveData, stage: this.stage, gold: this.saveData.gold + reward, selectedHero: this.selectedHero };
    saveGame(this.saveData);
    this.updateUi();
    this.statusText?.setText(`Group defeated! Stage ${completedStage} mastered • +${reward} Gold • Stage ${this.stage} unlocked`);
    this.nextStageTimer = this.time.delayedCall(1300, () => this.startBattle());
  }

  private handleDefeat(): void {
    if (!this.running) return;
    this.running = false;
    this.stopBattleTimers();
    this.saveData = { ...this.saveData, stage: this.stage, selectedHero: this.selectedHero };
    saveGame(this.saveData);
    this.statusText?.setText('Defeat. Group state reset — retrying this stage…');
    this.nextStageTimer = this.time.delayedCall(1600, () => this.startBattle());
  }

  private upgradeSelectedHero(): void {
    const level = getHeroLevel(this.saveData.heroLevels, this.selectedHero);
    const result = buyHeroUpgrade(this.saveData.gold, level);
    if (!result.success) { this.statusText?.setText(`Need ${result.cost} Gold to upgrade ${HEROES[this.selectedHero].name}.`); return; }
    this.saveData = { ...this.saveData, gold: result.gold, heroLevels: { ...this.saveData.heroLevels, [this.selectedHero]: result.level } };
    saveGame(this.saveData);
    const hpRatio = this.heroHp / this.hero.maxHp;
    this.hero = getUpgradedHero(HEROES[this.selectedHero], result.level);
    this.heroHp = Math.max(1, Math.round(this.hero.maxHp * hpRatio));
    this.updateUi();
    this.statusText?.setText(`${this.hero.name} upgraded to Level ${result.level}! Combat power increased.`);
  }

  private switchHero(id: HeroId): void {
    this.selectedHero = id;
    this.saveData = { ...this.saveData, stage: this.stage, selectedHero: id };
    saveGame(this.saveData);
    this.startBattle();
  }

  private stopBattleTimers(): void {
    this.heroAttackTimer?.remove(false);
    this.skillTimer?.remove(false);
    this.nextStageTimer?.remove(false);
    this.enemyTimers.forEach((timer) => timer.remove(false));
    this.enemyTimers.clear();
    this.heroAttackTimer = undefined;
    this.skillTimer = undefined;
    this.nextStageTimer = undefined;
  }

  private updateUi(): void {
    const level = getHeroLevel(this.saveData.heroLevels, this.selectedHero);
    const nextCost = heroUpgradeCost(level);
    this.goldText?.setText(`Gold: ${this.saveData.gold}`);
    this.levelText?.setText(`${this.hero.name} • Lv ${level} • ATK ${this.hero.attack} • HP ${this.hero.maxHp}`);
    this.upgradeText?.setText(`UPGRADE ${this.hero.name} → Lv ${level + 1} • ${nextCost} Gold`);
    this.skillText?.setText(`${this.hero.skillName} • ${this.hero.skillCooldownMs / 1000}s • ${this.hero.skillDescription}`);
    this.heroHpText?.setText(`${this.hero.name} ${Math.ceil(this.heroHp)} / ${this.hero.maxHp} HP${this.warriorShield > 0 ? ` • Shield ${this.warriorShield}` : ''}`);
    if (this.heroBar) this.heroBar.width = 230 * Math.max(0, this.heroHp / this.hero.maxHp);

    const target = selectHeroTarget(this.selectedHero, this.enemies);
    this.targetText?.setText(target ? `Auto target: ${target.definition.name} • ${livingEnemies(this.enemies).length}/${this.enemies.length} enemies alive` : 'Enemy group defeated');
    this.enemies.forEach((enemy) => {
      const hpText = this.enemyHpTexts.get(enemy.id);
      const bar = this.enemyBars.get(enemy.id);
      hpText?.setText(enemy.hp > 0 ? `${enemy.definition.name}\n${Math.ceil(enemy.hp)}/${enemy.definition.maxHp} • ${enemy.definition.trait}` : `${enemy.definition.name}\nDEFEATED`);
      if (bar) bar.width = 105 * Math.max(0, enemy.hp / enemy.definition.maxHp);
    });
  }

  private showSplashFeedback(enemyId: string, damage: number): void {
    const sprite = this.enemySprites.get(enemyId);
    if (!sprite || damage <= 0) return;
    const label = this.add.text(sprite.x, sprite.y - 58, `SPLASH -${damage}`, {
      fontSize: '13px', color: '#9fc5ff', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.tweens.add({
      targets: label,
      y: label.y - 24,
      alpha: 0,
      duration: 850,
      onComplete: () => label.destroy(),
    });
  }

  private flash(target?: Phaser.GameObjects.Container, scale = 1.08): void {
    if (!target) return;
    this.tweens.add({ targets: target, scale, duration: 80, yoyo: true });
  }
}
