import Phaser from 'phaser';
import { HEROES, HERO_ORDER, type HeroId } from '../data/heroes';
import { loadSave, saveGame } from '../systems/saveSystem';

export class TitleScene extends Phaser.Scene {
  private selectedHero: HeroId = 'warrior';
  private selectedLabel?: Phaser.GameObjects.Text;

  constructor() { super('TitleScene'); }

  create(): void {
    const save = loadSave();
    this.selectedHero = save.selectedHero;
    this.cameras.main.setBackgroundColor('#080a10');

    this.add.text(480, 64, 'KHAR ZHAELYX', {
      fontFamily: 'Georgia, serif', fontSize: '48px', color: '#f4f0e6', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(480, 108, 'IDLE RPG • ENEMY GROUPS', {
      fontSize: '14px', color: '#9fa8bb', letterSpacing: 4,
    }).setOrigin(0.5);
    this.add.text(480, 145, `Stage ${save.stage}  •  ${save.gold} Gold`, {
      fontSize: '17px', color: '#e5c77a',
    }).setOrigin(0.5);

    this.add.text(480, 185, 'Choose your combat identity', { fontSize: '22px', color: '#e5c77a' }).setOrigin(0.5);

    HERO_ORDER.forEach((id, index) => {
      const x = 190 + index * 195;
      const hero = HEROES[id];
      const card = this.add.rectangle(x, 285, 170, 155, 0x141925, 1).setStrokeStyle(2, 0x3d465a).setInteractive({ useHandCursor: true });
      const glyph = this.add.circle(x, 238, 25, 0x2c3345);
      this.add.text(x, 280, `${hero.name} • Lv ${save.heroLevels[id]}`, { fontSize: '17px', color: '#f4f0e6', fontStyle: 'bold' }).setOrigin(0.5);
      this.add.text(x, 306, hero.role, { fontSize: '11px', color: '#9fa8bb', align: 'center', wordWrap: { width: 145 } }).setOrigin(0.5);
      this.add.text(x, 337, hero.identity, { fontSize: '9px', color: '#71809d', align: 'center', wordWrap: { width: 150 } }).setOrigin(0.5);
      card.on('pointerdown', () => { this.selectedHero = id; this.updateSelection(save.heroLevels[id]); });
      glyph.setInteractive({ useHandCursor: true }).on('pointerdown', () => { this.selectedHero = id; this.updateSelection(save.heroLevels[id]); });
    });

    this.selectedLabel = this.add.text(480, 397, '', { fontSize: '16px', color: '#e5c77a' }).setOrigin(0.5);
    this.updateSelection(save.heroLevels[this.selectedHero]);

    const start = this.add.rectangle(480, 470, 250, 62, 0x6d4a24, 1).setStrokeStyle(2, 0xe5c77a).setInteractive({ useHandCursor: true });
    this.add.text(480, 470, 'CONTINUE EXPEDITION', { fontSize: '18px', color: '#fff4d0', fontStyle: 'bold' }).setOrigin(0.5);
    start.on('pointerover', () => start.setFillStyle(0x8b602c));
    start.on('pointerout', () => start.setFillStyle(0x6d4a24));
    start.on('pointerdown', () => {
      saveGame({ ...save, selectedHero: this.selectedHero });
      this.scene.start('GameScene', { stage: save.stage, selectedHero: this.selectedHero });
    });
  }

  private updateSelection(level: number): void {
    const hero = HEROES[this.selectedHero];
    this.selectedLabel?.setText(`Selected: ${hero.name} • Level ${level} • ${hero.skillName}`);
  }
}
