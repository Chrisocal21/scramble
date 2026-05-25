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

    const W       = GAME_CONFIG.width;
    const isTouch = scene.sys.game.device.input.touch;
    const PW      = isTouch ? GAME_CONFIG.controlPanelWidth : 0;
    const GL      = PW;           // game-view left edge
    const GR      = W - PW;       // game-view right edge
    const GCX     = (GL + GR) / 2;
    const TY      = HUD_STRIP_Y + HUD_STRIP_H / 2;

    // Dark background band
    const bg = scene.add.graphics().setScrollFactor(0).setDepth(9);
    bg.fillStyle(0x000000, 0.72);
    bg.fillRect(GL, HUD_STRIP_Y, GR - GL, HUD_STRIP_H);
    bg.lineStyle(1, 0xffffff, 0.18);
    bg.lineBetween(GL, HUD_STRIP_Y, GR, HUD_STRIP_Y);

    // --- HP hearts (left side) ---
    // One ♥ per max-HP. Full = bright red, lost = dark crimson.
    this._hearts = [];
    const HEART_SPACING = 24;
    for (let i = 0; i < health_manager.maxHp; i++) {
      const heart = scene.add.text(GL + 14 + i * HEART_SPACING, TY, '♥', {
        fontFamily: 'monospace',
        fontSize:   '22px',
        color:      '#ff2244',
        stroke:     '#330011',
        strokeThickness: 2,
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(10);
      this._hearts.push(heart);
    }

    // --- Dash cooldown indicator (right of hearts) ---
    const dash_x = GL + 14 + health_manager.maxHp * HEART_SPACING + 8;
    this._dash_text = scene.add.text(dash_x, TY, 'DASH', {
      fontFamily: 'monospace', fontSize: '13px', color: '#44aaff',
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(10);
    this._dash_cooldown_fraction = 1;

    // --- Mute indicator (right of DASH, hidden by default) ---
    this._mute_text = scene.add.text(dash_x + 46, TY, 'MUTE', {
      fontFamily: 'monospace', fontSize: '13px', color: '#ff6666',
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(10).setAlpha(0);

    // --- Level label (center) ---
    this._level_text = scene.add.text(GCX, TY, 'LEVEL ' + level, {
      fontFamily: 'monospace', fontSize: '18px', color: '#dddddd',
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(10);

    // --- Coin counter (right side): diamond icon + count ---
    this._coin_text = scene.add.text(GR - 14, TY, '◆ 0', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffdd44',
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(10);

    // --- Power-up indicators (right of mute, above HUD) ---
    // Three small labels that appear when a power-up is active.
    const pu_x = dash_x + 46 + 52;
    this._pu_shield = scene.add.text(pu_x,      TY, 'SHLD', {
      fontFamily: 'monospace', fontSize: '12px', color: '#88ccff',
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(10).setAlpha(0);
    this._pu_speed  = scene.add.text(pu_x + 42, TY, 'FAST', {
      fontFamily: 'monospace', fontSize: '12px', color: '#ffcc44',
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(10).setAlpha(0);
    this._pu_jump   = scene.add.text(pu_x + 84, TY, '\u00d72', {
      fontFamily: 'monospace', fontSize: '12px', color: '#44ffcc',
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(10).setAlpha(0);
  }

  setLevel(n) {
    this._level = n;
    this._level_text.setText('LEVEL ' + n);
  }

  // Called by GameScene when M is pressed. Shows/hides the mute indicator.
  setMuted(muted) {
    this._mute_text.setAlpha(muted ? 1 : 0);
  }

  // Called from GameScene.update() with fraction 0 (just dashed) → 1 (ready).
  setDashCooldown(fraction) {
    this._dash_cooldown_fraction = fraction;
    this._dash_text.setAlpha(0.25 + 0.75 * fraction);
  }

  // Animate the heart that was just lost. Called immediately after hp decreases.
  flashDamage() {
    const hp = this.health_manager.hp;  // new (reduced) value
    // The heart at index `hp` is the one that just became empty.
    const lost = this._hearts[hp];
    if (lost) {
      this.scene.tweens.add({
        targets:  lost,
        scaleX:   0,
        scaleY:   0,
        duration: 160,
        ease:     'Back.In',
        onComplete: () => {
          if (!lost.scene) return;
          lost.setColor('#3a0018');
          lost.setScale(1);
        },
      });
    }
    // Remaining full hearts do a quick horizontal jitter to feel the impact.
    this._hearts.slice(0, hp).forEach((h, i) => {
      this.scene.tweens.add({
        targets:  h,
        x:        h.x + 3,
        duration: 60,
        ease:     'Linear',
        yoyo:     true,
        repeat:   1,
        delay:    i * 20,
      });
    });
  }

  // Scale-pop the coin counter. Call when a coin is collected.
  pulseCoin() {
    this.scene.tweens.add({
      targets:  this._coin_text,
      scaleX:   1.55,
      scaleY:   1.55,
      duration: 75,
      ease:     'Cubic.Out',
      yoyo:     true,
    });
  }

  update(player) {
    const hm = this.health_manager;
    this._coin_text.setText('◆ ' + hm.coins);

    // Sync heart fill colours (handles healing or scene restarts).
    for (let i = 0; i < this._hearts.length; i++) {
      this._hearts[i].setColor(i < hm.hp ? '#ff2244' : '#3a0018');
    }

    // Power-up indicators
    if (player) {
      this._pu_shield.setAlpha(hm.shielded ? 1 : 0);
      this._pu_speed.setAlpha(player._speed_boost_timer > 0 ? 1 : 0);
      this._pu_jump.setAlpha(
        (player._double_jump_timer > 0 && !player._double_jump_used) ? 1 : 0
      );
    }
  }
}
