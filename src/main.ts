import Phaser from 'phaser';
import './styles.css';
import { TitleScene } from './scenes/TitleScene';
import { GameScene } from './scenes/GameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  backgroundColor: '#090c14',
  render: {
    antialias: true,
    roundPixels: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540,
  },
  input: {
    activePointers: 2,
  },
  scene: [TitleScene, GameScene],
};

new Phaser.Game(config);
