// FallingPlatform.js
// A platform that crumbles after the player stands on it for ~1 second.
// Shakes as a warning then drops and disappears. Respawns after a delay.
//
// Level data format entry: [row, c0, c1]  (same shape as ground/platforms)

import { GAME_CONFIG } from '../config/game.js';

const T             = GAME_CONFIG.tileSize;
const H             = Math.round(T / 4);  // thin, same height as one-way platforms
const COLOR_STABLE  = 0xcc7733;           // orange-brown (distinct from static green)
const COLOR_WARN    = 0xff5500;           // bright orange while shaking
const CRUMBLE_DELAY = 900;               // ms standing on it before it breaks
const RESPAWN_DELAY = 3500;              // ms before it reappears

export class FallingPlatform {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} row  Tile row
   * @param {number} c0   Start column (inclusive)
   * @param {number} c1   End column (inclusive)
   */
  constructor(scene, row, c0, c1) {
    this.scene  = scene;

    const w  = (c1 - c0 + 1) * T;
    const cx = c0 * T + w / 2;
    const cy = row * T + H / 2;   // top of tile row, same as one-way platforms

    this._cx    = cx;
    this._cy    = cy;
    this._state = 'stable';  // 'stable' | 'shaking' | 'broken'

    this._rect = scene.add.rectangle(cx, cy, w, H, COLOR_STABLE);
    scene.physics.add.existing(this._rect, true /* static */);
  }

  // Check each frame whether the player is standing on this platform.
  // Triggers the crumble countdown if they are and the platform is stable.
  checkPlayer(player) {
    if (this._state !== 'stable') return;
    const pb = player.body;
    const mb = this._rect.body;

    const near_top  = pb.bottom >= mb.top - 4 && pb.bottom <= mb.bottom + 4;
    const overlap_x = pb.right  >  mb.left + 2 && pb.left  < mb.right  - 2;

    if (near_top && overlap_x && pb.blocked.down) {
      this._startShaking();
    }
  }

  _startShaking() {
    this._state = 'shaking';
    this._rect.setFillStyle(COLOR_WARN);
    this.scene.tweens.add({
      targets:  this._rect,
      x:        { from: this._cx - 3, to: this._cx + 3 },
      yoyo:     true,
      repeat:   -1,
      duration: 55,
    });
    this.scene.time.delayedCall(CRUMBLE_DELAY, () => this._break());
  }

  _break() {
    if (this._state === 'broken') return;
    this._state = 'broken';
    this.scene.tweens.killTweensOf(this._rect);
    // Snap back to center after shake
    this._rect.setPosition(this._cx, this._cy);
    this._rect.body.reset(this._cx, this._cy);
    // Drop and fade out
    this.scene.tweens.add({
      targets:  this._rect,
      alpha:    0,
      y:        this._cy + T,
      duration: 300,
      ease:     'Power2',
      onComplete: () => {
        this._rect.body.enable = false;
      },
    });
    this.scene.time.delayedCall(RESPAWN_DELAY, () => this._respawn());
  }

  _respawn() {
    this._state = 'stable';
    this._rect.setPosition(this._cx, this._cy);
    this._rect.setFillStyle(COLOR_STABLE);
    this._rect.body.reset(this._cx, this._cy);
    this._rect.body.enable = true;
    this.scene.tweens.add({
      targets:  this._rect,
      alpha:    1,
      duration: 300,
    });
  }

  // Wire up one-way collision: land from above, pass through from below.
  // Call once in GameScene.create() after the level is built.
  addCollider(player) {
    this.scene.physics.add.collider(player, this._rect, null, (p, _plat) => {
      return p.body.velocity.y >= 0 && p.body.bottom <= this._rect.body.top + 8;
    });
  }

  get gameObject() { return this._rect; }
}
