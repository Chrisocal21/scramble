// MenuScene.js -- Title screen. Shows the game name and start / settings buttons.

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/game.js';
import { AudioManager } from '../systems/AudioManager.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = GAME_CONFIG;
    const cx = width / 2;
    const cy = height / 2;

    this._transitioning = false;

    // Title
    this.add
      .text(cx, cy - 65, 'SCRAMBLE', {
        fontFamily: 'monospace',
        fontSize: '64px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // PLAY button
    const play = this.add
      .text(cx, cy + 38, 'PLAY', {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: '#aaffaa',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    play.on('pointerdown', () => this.startGame());
    play.on('pointerover', () => play.setColor('#ffffff'));
    play.on('pointerout',  () => play.setColor('#aaffaa'));

    // SETTINGS button
    const settings = this.add
      .text(cx, cy + 90, 'SETTINGS', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#555566',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    settings.on('pointerdown', () => {
      if (!this._transitioning) this.scene.launch('SettingsScene', { from: 'MenuScene' });
    });
    settings.on('pointerover', () => settings.setColor('#aaaaaa'));
    settings.on('pointerout',  () => settings.setColor('#555566'));

    // Keyboard: Enter key starts game
    this.input.keyboard.on('keydown-ENTER', () => this.startGame());

    // Fade in from black
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  startGame() {
    if (this._transitioning) return;
    this._transitioning = true;
    AudioManager.init();
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('LevelSelectScene');
    });
  }
}
