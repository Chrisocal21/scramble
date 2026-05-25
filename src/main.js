// main.js -- Entry point. Configures Phaser and registers all scenes.

import Phaser from 'phaser';
import { GAME_CONFIG } from './config/game.js';
import { BootScene }        from './scenes/BootScene.js';
import { MenuScene }        from './scenes/MenuScene.js';
import { LevelSelectScene } from './scenes/LevelSelectScene.js';
import { GameScene }        from './scenes/GameScene.js';
import { PauseScene }       from './scenes/PauseScene.js';
import { GameOverScene }    from './scenes/GameOverScene.js';
import { SettingsScene }    from './scenes/SettingsScene.js';

const config = {
  type: Phaser.AUTO, // Prefer WebGL, fall back to Canvas

  width: GAME_CONFIG.width,
  height: GAME_CONFIG.height,

  backgroundColor: GAME_CONFIG.backgroundColor,

  // Scale to fill the screen while keeping aspect ratio.
  // ENVELOP fills the screen fully (may crop a little on mismatched ratios).
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: document.body,
  },

  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 }, // We apply gravity manually in Player.js for fine-grained control
      debug: false,       // Set to true during development to see hitboxes
    },
  },

  input: {
    activePointers: 4, // Support up to 4 simultaneous touch points
  },

  scene: [BootScene, MenuScene, LevelSelectScene, GameScene, PauseScene, GameOverScene, SettingsScene],
};

new Phaser.Game(config);
