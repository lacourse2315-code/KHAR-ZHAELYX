import Phaser from 'phaser';
import { damageAfterArmor, getEnemyForStage, type EnemyDefinition } from '../data/enemies';
import { HEROES, HERO_ORDER, type HeroDefinition, type HeroId } from '../data/heroes';
import { applyDamage, isDefeated } from '../combat/combatMath';
import { executeMultiplier, incomingDamageForHero, resolveHeroAttack, resolveHeroSkill } from '../combat/heroCombat';
import { calculateOfflineReward } from '../systems/idleSystem';
import { buyHeroUpgrade, getHeroLevel, getUpgradedHero, heroUpgradeCost, rewardForStage } from '../systems/progressionSystem';
import { loadSave, saveGame, type SaveData } from '../systems/saveSystem';

export class GameScene extends Phaser.Scene {
  private stage = 1;
  private selectedHero: HeroId = 'warrior';
  private saveData!: SaveData;
  private hero!: HeroDefinition;
  private enemy!: EnemyDefinition;
  private heroHp = 1;
  private enemyHp = 1;
  private warriorShield = 0;
  private heroAttackTimer?: Phaser.Time.TimerEvent;
  private enemyAttackTimer?: Phaser.Time.TimerEvent;
  private skillTimer?: Phaser.Time.TimerEvent;
  private nextStageTimer?: Phaser.Time.TimerEvent;
  private heroHpText?: Phaser.GameObjects.Text;
  private enemyHpText?: Phaser.GameObjects.Text;
  private stageText?: Phaser.GameObjects.Text;
  private goldText?: Phaser.GameObjects.Text;
  private levelText?: Phaser.GameObjects.Text;
  private skillText?: Phaser.GameObjects.Text;
  private statusText?: Phaser.GameObjects.Text;
  private heroBar?: Phaser.GameObjects.Rectangle;
  private enemyBar?: Phaser.GameObjects.Rectangle;
  private heroSprite?: Phaser.GameObjects.Container;
  private enemySprite?: Phaser.GameObjects.Container;
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
    this.add.text(32, 20, 'KHAR ZHAELYX', { fontFamily: 'Georgia, serif', fontSize: '24px', color: '#f4f0e6', fontStyle: 'bold' });
    this.goldText = this.add.text(32, 52, '', { fontSize: '15px', color: '#e5c77a' });
    this.levelText = this.add.text(928, 52, '', { fontSize: '14px', color: '#9fa8bb' }).setOrigin(1, 0);
    this.stageText = this.add.text(928, 20, '', { fontSize: '17px', color: '#e5c77a' }).setOrigin(1, 0);
    this.statusText = this.add.text(480, 82, 'Preparing battle…', { fontSize: '16px', color: '#9fa8bb' }).setOrigin(0.5);

    this.add.text(220, 112, 'HERO', { fontSize: '13px', color: '#7f899f', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(740, 112, 'ENEMY', { fontSize: '13px', color: '#7f899f', fontStyle: 'bold' }).setOrigin(0.5);
    this.heroSprite = this.createFighter(220, 220, 0x38506d, 'H');
    this.enemySprite = this.createFighter(740, 220, 0x623c3c, 'E');
    this.heroHpText = this.add.text(220, 290, '', { fontSize: '14px', color: '#e8edf7' }).setOrigin(0.5);
    this.enemyHpText = this.add.text(740, 290, '', { fontSize: '14px', color: '#e8edf7' }).setOrigin(0.5);
    this.heroBar = this.add.rectangle(220, 316, 260, 14, 0x274231).setOrigin(0.5).setStrokeStyle(1, 0x5f8069);
    this.enemyBar = this.add.rectangle(740, 316, 260, 14, 0x4b2929).setOrigin(0.5).setStrokeStyle(1, 0x8f5a5a);
    this.skillText = this.add.text(480, 346, '', { fontSize: '13px', color: '#b9c8ea', align: 'center' }).setOrigin(0.5);

    this.add.text(480, 370, 'AUTO COMBAT', { fontSize: '16px', color: '#e5c77a', fontStyle: 'bold' }).setOrigin(0.5);
    const upgrade = this.add.rectangle(480, 408, 300, 38, 0x4f3c20, 1).setStrokeStyle(1, 0xe5c77a).setInteractive({ useHandCursor: true });
    const upgradeText = this.add.text(480, 408, '', { fontSize: '13px', color: '#fff4d0', fontStyle: 'bold' }).setOrigin(0.5);
    upgrade.on('pointerdown', () => this.upgradeSelectedHero());
    this.registry.set('upgradeText', upgradeText);

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

  private createFighter(x: number, y: number, fill: number, letter: string): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    container.add([
      this.add.circle(0, 0, 58, fill).setStrokeStyle(3, 0xb7c0d2),
      this.add.text(0, 0, letter, { fontSize: '40px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5),
    ]);
    return container;
  }

  private startBattle(): void {
    this.stopBattleTimers();
    const level = getHeroLevel(this.saveData.heroLevels, this.selectedHero);
    this.hero = getUpgradedHero(HEROES[this.selectedHero], level);
    this.enemy = getEnemyForStage(this.stage);
    this.heroHp = this.hero.maxHp;
    this.enemyHp = this.enemy.maxHp;
    this.warriorShield = 0;
    this.running = true;
    this.stageText?.setText(`Stage ${this.stage}`);
    this.statusText?.setText(`${this.hero.name} vs ${this.enemy.name} • ${this.enemy.trait}`);
    this.updateUi();
    this.heroAttackTimer = this.time.addEvent({ delay: this.hero.attackIntervalMs, loop: true, callback: () => this.heroAttack() });
    this.scheduleEnemyAttack(this.enemy.attackIntervalMs);
    this.skillTimer = this.time.addEvent({ delay: this.hero.skillCooldownMs, loop: true, callback: () => this.useSkill() });
  }

  private scheduleEnemyAttack(delay: number): void {
    this.enemyAttackTimer?.remove(false);
    this.enemyAttackTimer = this.time.addEvent({ delay, loop: false, callback: () => { this.enemyAttack(); if (this.running) this.scheduleEnemyAttack(this.enemy.attackIntervalMs); } });
  }

  private heroAttack(): void {
    if (!this.running || isDefeated({ hp: this.enemyHp, maxHp: this.enemy.maxHp, attack: this.enemy.attack })) return;
    const result = resolveHeroAttack(this.hero);
    const execute = executeMultiplier(this.selectedHero, this.enemyHp, this.enemy.maxHp);
    const rawDamage = Math.floor(result.damage * execute);
    const damage = damageAfterArmor(rawDamage, this.enemy.armor);
    this.enemyHp = applyDamage({ hp: this.enemyHp, maxHp: this.enemy.maxHp, attack: this.enemy.attack }, damage).hp;
    this.flash(this.enemySprite, result.critical ? 1.18 : 1.08);
    const executeLabel = execute > 1 ? ' • EXECUTE' : '';
    this.statusText?.setText(`${result.label}${executeLabel}! ${damage} damage`);
    this.updateUi();
    if (this.enemyHp <= 0) this.handleVictory();
  }

  private useSkill(): void {
    if (!this.running || this.enemyHp <= 0) return;
    const result = resolveHeroSkill(this.hero);
    const execute = executeMultiplier(this.selectedHero, this.enemyHp, this.enemy.maxHp);
    const rawDamage = Math.floor(result.primaryDamage * execute);
    const damage = damageAfterArmor(rawDamage, this.enemy.armor);
    this.enemyHp = applyDamage({ hp: this.enemyHp, maxHp: this.enemy.maxHp, attack: this.enemy.attack }, damage).hp;
    if (result.shield > 0) this.warriorShield = Math.max(this.warriorShield, result.shield);
    if (result.enemyDelayMs > 0 && this.running) this.scheduleEnemyAttack(this.enemy.attackIntervalMs + result.enemyDelayMs);
    this.flash(this.enemySprite, result.critical ? 1.22 : 1.14);
    const effects = [result.shield > 0 ? `shield +${result.shield}` : '', result.splashDamage > 0 ? `arcane splash ${result.splashDamage}` : '', result.enemyDelayMs > 0 ? `delay ${result.enemyDelayMs}ms` : '', execute > 1 ? 'EXECUTE' : ''].filter(Boolean).join(' • ');
    this.statusText?.setText(`${result.label}! ${damage} damage${effects ? ` • ${effects}` : ''}`);
    this.updateUi();
    if (this.enemyHp <= 0) this.handleVictory();
  }

  private enemyAttack(): void {
    if (!this.running || this.heroHp <= 0) return;
    let damage = incomingDamageForHero(this.selectedHero, this.enemy.attack);
    const absorbed = Math.min(this.warriorShield, damage);
    this.warriorShield -= absorbed;
    damage -= absorbed;
    if (damage > 0) this.heroHp = applyDamage({ hp: this.heroHp, maxHp: this.hero.maxHp, attack: this.hero.attack }, damage).hp;
    this.flash(this.heroSprite, absorbed > 0 ? 1.04 : 1.08);
    this.statusText?.setText(absorbed > 0 ? `${this.enemy.name} hits • shield absorbs ${absorbed}${damage > 0 ? ` • ${damage} HP damage` : ''}` : `${this.enemy.name} hits for ${damage}`);
    this.updateUi();
    if (this.heroHp <= 0) this.handleDefeat();
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
    this.statusText?.setText(`Victory! ${this.enemy.name} defeated • +${reward} Gold • Stage ${this.stage} unlocked`);
    this.nextStageTimer = this.time.delayedCall(1300, () => this.startBattle());
  }

  private handleDefeat(): void {
    if (!this.running) return;
    this.running = false;
    this.stopBattleTimers();
    this.saveData = { ...this.saveData, stage: this.stage, selectedHero: this.selectedHero };
    saveGame(this.saveData);
    this.statusText?.setText('Defeat. Campaign wall held — retrying this stage…');
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
    this.heroAttackTimer?.remove(false); this.enemyAttackTimer?.remove(false); this.skillTimer?.remove(false); this.nextStageTimer?.remove(false);
    this.heroAttackTimer = undefined; this.enemyAttackTimer = undefined; this.skillTimer = undefined; this.nextStageTimer = undefined;
  }

  private updateUi(): void {
    const level = getHeroLevel(this.saveData.heroLevels, this.selectedHero);
    const nextCost = heroUpgradeCost(level);
    this.goldText?.setText(`Gold: ${this.saveData.gold}`);
    this.levelText?.setText(`${this.hero.name} • Lv ${level} • ATK ${this.hero.attack} • HP ${this.hero.maxHp}`);
    const upgradeText = this.registry.get('upgradeText') as Phaser.GameObjects.Text | undefined;
    upgradeText?.setText(`UPGRADE ${this.hero.name} → Lv ${level + 1} • ${nextCost} Gold`);
    this.skillText?.setText(`${this.hero.skillName} • ${this.hero.skillCooldownMs / 1000}s • ${this.hero.skillDescription}`);
    this.heroHpText?.setText(`${this.hero.name} ${Math.ceil(this.heroHp)} / ${this.hero.maxHp} HP${this.warriorShield > 0 ? ` • Shield ${this.warriorShield}` : ''}`);
    this.enemyHpText?.setText(`${this.enemy.name} ${Math.ceil(this.enemyHp)} / ${this.enemy.maxHp} HP • ${this.enemy.trait}`);
    if (this.heroBar) this.heroBar.width = 260 * Math.max(0, this.heroHp / this.hero.maxHp);
    if (this.enemyBar) this.enemyBar.width = 260 * Math.max(0, this.enemyHp / this.enemy.maxHp);
  }

  private flash(target?: Phaser.GameObjects.Container, scale = 1.08): void {
    if (!target) return;
    this.tweens.add({ targets: target, scale, duration: 80, yoyo: true });
  }
}
