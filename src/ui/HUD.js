// HUD.js -- Coin count and health display. Fixed to the camera (not scrolled).
// Positioned to avoid the virtual control zones on mobile.

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/game.js';

// Height of the bottom HUD strip (matches bottom of canvas)
const HUD_STRIP_Y = 450;
const HUD_STRIP_H = 540 - HUD_STRIP_Y;

export class HUD {
  constructor(scene, health_manager, level = 1) {
    this.scene = scene;
    this.health_manager = health_manager;
    this._level = level;

    const W  = GAME_CONFIG.width;
    const isTouch = scene.sys.game.device.input.touch;
    const PW = isTouch ? GAME_CONFIG.controlPanelWidth : 0; // no panels on desktop
    const GL = PW;           // game-view left edge
    const GR = W - PW;       // game-view right edge
    const GCX = (GL + GR) / 2;
    const style = { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' };
    const TY = HUD_STRIP_Y + HUD_STRIP_H / 2;

    // Dark background band — only within the game view area
    const bg = scene.add.graphics().setScrollFactor(0).setDepth(9);
    bg.fillStyle(0x000000, 0.68);
    bg.fillRect(GL, HUD_STRIP_Y, GR - GL, HUD_STRIP_H);
    bg.lineStyle(1, 0xffffff, 0.15);
    bg.lineBetween(GL, HUD_STRIP_Y, GR, HUD_STRIP_Y);

    // HP -- left of game view
    this._hp_text = scene.add
      .text(GL + 16, TY, 'HP: 3', style)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(10);

    // Level -- center of game view
    this._level_text = scene.add
      .text(GCX, TY, 'LEVEL ' + level, style)
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(10);

    // Coins -- right of game view
    this._coin_text = scene.add
      .text(GR - 16, TY, 'COINS: 0', style)
      .setOrigin(1, 0.5)
      .setScrollFactor(0)
      .setDepth(10);
  }

  setLevel(n) {
    this._level = n;
    this._level_text.setText('LEVEL ' + n);
  }

  update() {
    const hm = this.health_manager;
    this._coin_text.setText('COINS: ' + hm.coins);
    this._hp_text.setText('HP: ' + hm.hp);
  }
}
