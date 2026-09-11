import Phaser from 'phaser';
import { getEnemyForStage, type EnemyDefinition } from '../data/enemies';
import { HEROES, HERO_ORDER, type HeroDefinition, type HeroId } from '../data/heroes';
import { applyDamage, isDefeated, scaledSkillDamage } from '../combat/combatMath';
import { loadSave, saveGame } from '../systems/saveSystem';

export class GameScene extends Phaser.Scene {
  private stage = 1;
  private selectedHero: HeroId = 'warrior';
  private hero!: HeroDefinition;
  private enemy!: EnemyDefinition;
  private heroHp = 1;
  private enemyHp = 1;
  private heroAttackTimer?: Phaser.Time.TimerEvent;
  private enemyAttackTimer?: Phaser.Time.TimerEvent;
  private skillTimer?: Phaser.Time.TimerEvent;
  private nextStageTimer?: Phaser.Time.TimerEvent;
  private heroHpText?: Phaser.GameObjects.Text;
  private enemyHpText?: Phaser.GameObjects.Text;
  private stageText?: Phaser.GameObjects.Text;
  private statusText?: Phaser.GameObjects.Text;
  private heroBar?: Phaser.GameObjects.Rectangle;
  private enemyBar?: Phaser.GameObjects.Rectangle;
  private heroSprite?: Phaser.GameObjects.Container;
  private enemySprite?: Phaser.GameObjects.Container;
  private running = false;

  constructor() { super('GameScene'); }

  init(data: { stage?: number; selectedHero?: HeroId }): void {
    const save = loadSave();
    this.stage = Math.max(1, data.stage ?? save.stage);
    this.selectedHero = data.selectedHero ?? save.selectedHero;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#090c14');
    this.buildUi();
    this.startBattle();
  }

  shutdown(): void {
    this.stopBattleTimers();
  }

  private buildUi(): void {
    this.add.rectangle(480, 270, 960, 540, 0x090c14);
    this.add.text(32, 24, 'KHAR ZHAELYX', { fontFamily: 'Georgia, serif', fontSize: '25px', color: '#f4f0e6', fontStyle: 'bold' });
    this.stageText = this.add.text(928, 30, '', { fontSize: '17px', color: '#e5c77a' }).setOrigin(1, 0);
    this.statusText = this.add.text(480, 78, 'Preparing battle…', { fontSize: '16px', color: '#9fa8bb' }).setOrigin(0.5);

    this.add.text(220, 118, 'HERO', { fontSize: '13px', color: '#7f899f', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(740, 118, 'ENEMY', { fontSize: '13px', color: '#7f899f', fontStyle: 'bold' }).setOrigin(0.5);

    this.heroSprite = this.createFighter(220, 235, 0x38506d, 'H');
    this.enemySprite = this.createFighter(740, 235, 0x623c3c, 'E');

    this.heroHpText = this.add.text(220, 310, '', { fontSize: '15px', color: '#e8edf7' }).setOrigin(0.5);
    this.enemyHpText = this.add.text(740, 310, '', { fontSize: '15px', color: '#e8edf7' }).setOrigin(0.5);
    this.heroBar = this.add.rectangle(220, 338, 260, 14, 0x274231).setOrigin(0.5).setStrokeStyle(1, 0x5f8069);
    this.enemyBar = this.add.rectangle(740, 338, 260, 14, 0x4b2929).setOrigin(0.5).setStrokeStyle(1, 0x8f5a5a);

    this.add.text(480, 380, 'AUTO COMBAT', { fontSize: '18px', color: '#e5c77a', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(480, 408, 'Attacks and skills trigger automatically.', { fontSize: '13px', color: '#7f899f' }).setOrigin(0.5);

    const buttons = HERO_ORDER.map((id, index) => this.createHeroButton(id, 115 + index * 230));
    void buttons;

    const retreat = this.add.text(480, 510, 'Return to title', { fontSize: '13px', color: '#7f899f' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    retreat.on('pointerdown', () => this.scene.start('TitleScene'));
  }

  private createHeroButton(id: HeroId, x: number): Phaser.GameObjects.Rectangle {
    const button = this.add.rectangle(x, 462, 200, 55, 0x151b28, 1).setStrokeStyle(1, 0x3d465a).setInteractive({ useHandCursor: true });
    this.add.text(x, 451, HEROES[id].name, { fontSize: '15px', color: '#f4f0e6', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(x, 473, HEROES[id].role, { fontSize: '10px', color: '#7f899f' }).setOrigin(0.5);
    button.on('pointerdown', () => {
      if (this.running && id !== this.selectedHero) this.switchHero(id);
    });
    return button;
  }

  private createFighter(x: number, y: number, fill: number, letter: string): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const body = this.add.circle(0, 0, 62, fill).setStrokeStyle(3, 0xb7c0d2);
    const glyph = this.add.text(0, 0, letter, { fontSize: '42px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    container.add([body, glyph]);
    return container;
  }

  private startBattle(): void {
    this.stopBattleTimers();
    this.hero = HEROES[this.selectedHero];
    this.enemy = getEnemyForStage(this.stage);
    this.heroHp = this.hero.maxHp;
    this.enemyHp = this.enemy.maxHp;
    this.running = true;
    this.stageText?.setText(`Stage ${this.stage}`);
    this.statusText?.setText(`${this.hero.name} vs ${this.enemy.name}`);
    this.updateUi();

    this.heroAttackTimer = this.time.addEvent({ delay: this.hero.attackIntervalMs, loop: true, callback: () => this.heroAttack() });
    this.enemyAttackTimer = this.time.addEvent({ delay: this.enemy.attackIntervalMs, loop: true, callback: () => this.enemyAttack() });
    this.skillTimer = this.time.addEvent({ delay: this.hero.skillCooldownMs, loop: true, callback: () => this.useSkill() });
  }

  private heroAttack(): void {
    if (!this.running || isDefeated({ hp: this.enemyHp, maxHp: this.enemy.maxHp, attack: this.enemy.attack })) return;
    const critical = this.selectedHero === 'ranger' && Math.random() < 0.25;
    const damage = critical ? Math.floor(this.hero.attack * 1.75) : this.hero.attack;
    this.enemyHp = applyDamage({ hp: this.enemyHp, maxHp: this.enemy.maxHp, attack: this.enemy.attack }, damage).hp;
    this.flash(this.enemySprite);
    this.statusText?.setText(critical ? `Critical hit! ${damage} damage` : `${this.hero.name} attacks for ${damage}`);
    this.updateUi();
    if (this.enemyHp <= 0) this.handleVictory();
  }

  private useSkill(): void {
    if (!this.running || this.enemyHp <= 0) return;
    const damage = scaledSkillDamage(this.hero.attack, this.hero.skillMultiplier);
    this.enemyHp = applyDamage({ hp: this.enemyHp, maxHp: this.enemy.maxHp, attack: this.enemy.attack }, damage).hp;
    this.flash(this.enemySprite);
    this.statusText?.setText(`${this.hero.skillName}: ${damage} damage`);
    this.updateUi();
    if (this.enemyHp <= 0) this.handleVictory();
  }

  private enemyAttack(): void {
    if (!this.running || this.heroHp <= 0) return;
    const mitigation = this.selectedHero === 'warrior' ? 0.72 : 1;
    const damage = Math.max(1, Math.floor(this.enemy.attack * mitigation));
    this.heroHp = applyDamage({ hp: this.heroHp, maxHp: this.hero.maxHp, attack: this.hero.attack }, damage).hp;
    this.flash(this.heroSprite);
    this.statusText?.setText(`${this.enemy.name} hits for ${damage}`);
    this.updateUi();
    if (this.heroHp <= 0) this.handleDefeat();
  }

  private handleVictory(): void {
    if (!this.running) return;
    this.running = false;
    this.stopBattleTimers();
    const completedStage = this.stage;
    this.stage += 1;
    saveGame({ stage: this.stage, selectedHero: this.selectedHero });
    this.statusText?.setText(`Victory! Stage ${completedStage} cleared.`);
    this.nextStageTimer = this.time.delayedCall(1300, () => this.startBattle());
  }

  private handleDefeat(): void {
    if (!this.running) return;
    this.running = false;
    this.stopBattleTimers();
    saveGame({ stage: this.stage, selectedHero: this.selectedHero });
    this.statusText?.setText('Defeat. Retrying automatically…');
    this.nextStageTimer = this.time.delayedCall(1600, () => this.startBattle());
  }

  private switchHero(id: HeroId): void {
    this.selectedHero = id;
    saveGame({ stage: this.stage, selectedHero: id });
    this.startBattle();
  }

  private stopBattleTimers(): void {
    this.heroAttackTimer?.remove(false);
    this.enemyAttackTimer?.remove(false);
    this.skillTimer?.remove(false);
    this.nextStageTimer?.remove(false);
    this.heroAttackTimer = undefined;
    this.enemyAttackTimer = undefined;
    this.skillTimer = undefined;
    this.nextStageTimer = undefined;
  }

  private updateUi(): void {
    this.heroHpText?.setText(`${this.hero.name}  ${Math.ceil(this.heroHp)} / ${this.hero.maxHp} HP`);
    this.enemyHpText?.setText(`${this.enemy.name}  ${Math.ceil(this.enemyHp)} / ${this.enemy.maxHp} HP`);
    if (this.heroBar) this.heroBar.width = 260 * Math.max(0, this.heroHp / this.hero.maxHp);
    if (this.enemyBar) this.enemyBar.width = 260 * Math.max(0, this.enemyHp / this.enemy.maxHp);
  }

  private flash(target?: Phaser.GameObjects.Container): void {
    if (!target) return;
    this.tweens.add({ targets: target, scale: 1.08, duration: 70, yoyo: true });
  }
}
