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

    this.add.text(480, 72, 'KHAR ZHAELYX', {
      fontFamily: 'Georgia, serif', fontSize: '52px', color: '#f4f0e6', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(480, 124, 'IDLE RPG • FOUNDATION BUILD', {
      fontSize: '15px', color: '#9fa8bb', letterSpacing: 4,
    }).setOrigin(0.5);

    this.add.text(480, 180, 'Choose your hero', { fontSize: '22px', color: '#e5c77a' }).setOrigin(0.5);

    HERO_ORDER.forEach((id, index) => {
      const x = 190 + index * 195;
      const hero = HEROES[id];
      const card = this.add.rectangle(x, 280, 170, 145, 0x141925, 1).setStrokeStyle(2, 0x3d465a).setInteractive({ useHandCursor: true });
      const glyph = this.add.circle(x, 245, 25, 0x2c3345);
      this.add.text(x, 292, hero.name, { fontSize: '20px', color: '#f4f0e6', fontStyle: 'bold' }).setOrigin(0.5);
      this.add.text(x, 319, hero.role, { fontSize: '12px', color: '#9fa8bb', align: 'center', wordWrap: { width: 145 } }).setOrigin(0.5);
      card.on('pointerdown', () => { this.selectedHero = id; this.updateSelection(); });
      glyph.setInteractive({ useHandCursor: true }).on('pointerdown', () => { this.selectedHero = id; this.updateSelection(); });
    });

    this.selectedLabel = this.add.text(480, 390, '', { fontSize: '16px', color: '#e5c77a' }).setOrigin(0.5);
    this.updateSelection();

    const start = this.add.rectangle(480, 470, 250, 62, 0x6d4a24, 1).setStrokeStyle(2, 0xe5c77a).setInteractive({ useHandCursor: true });
    this.add.text(480, 470, 'BEGIN ADVENTURE', { fontSize: '19px', color: '#fff4d0', fontStyle: 'bold' }).setOrigin(0.5);
    start.on('pointerover', () => start.setFillStyle(0x8b602c));
    start.on('pointerout', () => start.setFillStyle(0x6d4a24));
    start.on('pointerdown', () => {
      saveGame({ stage: save.stage, selectedHero: this.selectedHero });
      this.scene.start('GameScene', { stage: save.stage, selectedHero: this.selectedHero });
    });
  }

  private updateSelection(): void {
    this.selectedLabel?.setText(`Selected: ${HEROES[this.selectedHero].name}`);
  }
}
