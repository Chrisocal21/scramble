// PauseScene.js -- Translucent overlay while gameplay is frozen.
// Launched on top of GameScene (which stays paused behind it).

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/game.js';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PauseScene' });
  }

  create() {
    const { width, height } = GAME_CONFIG;
    const cx = width / 2;
    const cy = height / 2;

    // Dim overlay
    this.add.rectangle(cx, cy, width, height, 0x000000, 0.6);

    this.add
      .text(cx, cy - 40, 'PAUSED', {
        fontFamily: 'monospace',
        fontSize: '48px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const resume_text = this.add
      .text(cx, cy + 30, 'RESUME', {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#aaffaa',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const quit_text = this.add
      .text(cx, cy + 80, 'QUIT TO MENU', {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#ffaaaa',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    resume_text.on('pointerdown', () => this._resume());
    quit_text.on('pointerdown', () => this._quit());

    // Keyboard shortcuts
    this.input.keyboard.once('keydown-ESC', () => this._resume());
  }

  _resume() {
    this.scene.resume('GameScene');
    this.scene.stop('PauseScene');
  }

  _quit() {
    this.scene.stop('GameScene');
    this.scene.stop('PauseScene');
    this.scene.start('LevelSelectScene');
  }
}
