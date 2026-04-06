import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { Level1Scene } from './scenes/Level1Scene.js';
import { Level2Scene } from './scenes/Level2Scene.js';
import { Level3Scene } from './scenes/Level3Scene.js';
import { Level4Scene } from './scenes/Level4Scene.js';
import { Level5Scene } from './scenes/Level5Scene.js';
import { Level6Scene } from './scenes/Level6Scene.js';
import { Level7Scene } from './scenes/Level7Scene.js';
import { UIScene } from './scenes/UIScene.js';
import { DialogScene } from './scenes/DialogScene.js';
import { PauseScene } from './scenes/PauseScene.js';
import { ThreeRenderer } from './ThreeRenderer.js';

const container = document.getElementById('game-container');

// Initialize Three.js renderer (renders behind Phaser)
const threeRenderer = new ThreeRenderer(container, 1024, 576);

// Make it globally accessible for all scenes
window.__threeRenderer = threeRenderer;

const config = {
  type: Phaser.AUTO,
  width: 1024,
  height: 576,
  parent: 'game-container',
  transparent: true,  // Phaser canvas is transparent so Three.js shows through
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },
      debug: false
    }
  },
  scene: [BootScene, TitleScene, Level1Scene, Level2Scene, Level3Scene, Level4Scene, Level5Scene, Level6Scene, Level7Scene, UIScene, DialogScene, PauseScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

const game = new Phaser.Game(config);
