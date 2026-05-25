// PauseScene.js -- Translucent overlay while gameplay is frozen.
// Launched on top of GameScene (which stays paused behind it).

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/game.js';
import { AudioManager } from '../systems/AudioManager.js';

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
      .text(cx, cy - 55, 'PAUSED', {
        fontFamily: 'monospace',
        fontSize: '48px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const resume_text = this.add
      .text(cx, cy + 15, 'RESUME', {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#aaffaa',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const settings_text = this.add
      .text(cx, cy + 60, 'SETTINGS', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#8888aa',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const quit_text = this.add
      .text(cx, cy + 105, 'QUIT TO MENU', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ffaaaa',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    resume_text.on('pointerdown', () => this._resume());
    resume_text.on('pointerover', () => resume_text.setColor('#ffffff'));
    resume_text.on('pointerout',  () => resume_text.setColor('#aaffaa'));

    settings_text.on('pointerdown', () => this.scene.launch('SettingsScene', { from: 'PauseScene' }));
    settings_text.on('pointerover', () => settings_text.setColor('#ccccff'));
    settings_text.on('pointerout',  () => settings_text.setColor('#8888aa'));

    quit_text.on('pointerdown', () => this._quit());
    quit_text.on('pointerover', () => quit_text.setColor('#ffffff'));
    quit_text.on('pointerout',  () => quit_text.setColor('#ffaaaa'));

    // Keyboard shortcuts
    this.input.keyboard.once('keydown-ESC', () => this._resume());
  }

  _resume() {
    this.scene.resume('GameScene');
    this.scene.stop('PauseScene');
  }

  _quit() {
    AudioManager.stopMusic();
    this.scene.stop('GameScene');
    this.scene.stop('PauseScene');
    this.scene.start('LevelSelectScene');
  }
}
