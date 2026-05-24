// BootScene.js -- First scene to run. Preloads assets, then hands off to MenuScene.
// For Phase 1, there are no image assets to load (everything is drawn in code),
// so this scene just starts immediately.

import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Phase 1: no external assets. All visuals are drawn programmatically.
    // Add asset loading here in later phases.
  }

  create() {
    this.scene.start('MenuScene');
  }
}
