// GameOverScene.js -- Shown when the player exhausts all lives (Classic/Hybrid modes).
// Not reachable in Modern mode.

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/game.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create() {
    const { width, height } = GAME_CONFIG;
    const cx = width / 2;
    const cy = height / 2;

    this.add
      .text(cx, cy - 40, 'GAME OVER', {
        fontFamily: 'monospace',
        fontSize: '56px',
        color: '#ff4444',
      })
      .setOrigin(0.5);

    const retry = this.add
      .text(cx, cy + 40, 'TRY AGAIN', {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#aaffaa',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const level_key = (this.scene.settings.data || {}).level_key || 'w1-l1';
    retry.on('pointerdown', () => this._go('GameScene', { level_key }));
    this.input.keyboard.once('keydown-ENTER', () => this._go('GameScene', { level_key }));

    const quit = this.add
      .text(cx, cy + 90, 'SELECT LEVEL', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#888888',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    quit.on('pointerover',  () => quit.setColor('#ffffff'));
    quit.on('pointerout',   () => quit.setColor('#888888'));
    quit.on('pointerdown',  () => this._go('LevelSelectScene'));

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  _go(key, data) {
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(key, data);
    });
  }
}
