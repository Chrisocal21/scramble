// MenuScene.js -- Title screen. Shows the game name and a prompt to start.
// Tapping the screen or pressing Enter launches the game.

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/game.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = GAME_CONFIG;
    const cx = width / 2;
    const cy = height / 2;

    // Title
    this.add
      .text(cx, cy - 60, 'SCRAMBLE', {
        fontFamily: 'monospace',
        fontSize: '64px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // Prompt
    const prompt = this.add
      .text(cx, cy + 40, 'TAP TO START', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);

    // Blink the prompt
    this.tweens.add({
      targets: prompt,
      alpha: 0,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Keyboard: Enter key
    this.input.keyboard.once('keydown-ENTER', () => this.startGame());

    // Touch / mouse: any tap
    this.input.once('pointerdown', () => this.startGame());
  }

  startGame() {
    this.scene.start('LevelSelectScene');
  }
}
