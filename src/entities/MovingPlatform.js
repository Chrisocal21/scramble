// MovingPlatform.js
// A platform that travels back and forth between two tile positions.
// Horizontal or vertical path is auto-detected from the given endpoints.
//
// Level data format entry: [tx0, ty0, tx1, ty1, speed]
//   tx0, ty0  -- start column and row (tile coords)
//   tx1, ty1  -- end column and row
//   speed     -- travel speed in pixels per second

import { GAME_CONFIG } from '../config/game.js';

const T      = GAME_CONFIG.tileSize;
const PLAT_W = T * 4;                  // 4 tiles wide
const PLAT_H = Math.round(T / 4);      // thin, same height as one-way platforms
const COLOR  = 0x7799ee;               // blue -- distinct from static green platforms

export class MovingPlatform {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} tx0   Start column (tile units)
   * @param {number} ty0   Start row (tile units)
   * @param {number} tx1   End column (tile units)
   * @param {number} ty1   End row (tile units)
   * @param {number} speed Travel speed in px/s
   */
  constructor(scene, tx0, ty0, tx1, ty1, speed) {
    this.scene = scene;

    // Pixel center of the platform at each endpoint.
    this._px0 = tx0 * T + PLAT_W / 2;
    this._py0 = ty0 * T + PLAT_H / 2;
    this._px1 = tx1 * T + PLAT_W / 2;
    this._py1 = ty1 * T + PLAT_H / 2;

    this._cx    = this._px0;
    this._cy    = this._py0;
    this._dx    = 0;   // position delta this frame (used to carry player)
    this._dy    = 0;
    this._speed = speed;
    this._dir   = 1;   // 1 = toward end point, -1 = toward start point
    this._is_h  = Math.abs(tx1 - tx0) >= Math.abs(ty1 - ty0);

    // Static physics rectangle -- repositioned manually each frame.
    this._rect = scene.add.rectangle(this._cx, this._cy, PLAT_W, PLAT_H, COLOR);
    scene.physics.add.existing(this._rect, true /* static */);
  }

  // Call every frame from GameScene.update().
  update(delta) {
    const dt     = delta / 1000;
    const prev_x = this._cx;
    const prev_y = this._cy;

    if (this._is_h) {
      this._cx += this._dir * this._speed * dt;
      const lo = Math.min(this._px0, this._px1);
      const hi = Math.max(this._px0, this._px1);
      if (this._cx >= hi) { this._cx = hi; this._dir = -1; }
      if (this._cx <= lo) { this._cx = lo; this._dir =  1; }
    } else {
      this._cy += this._dir * this._speed * dt;
      const lo = Math.min(this._py0, this._py1);
      const hi = Math.max(this._py0, this._py1);
      if (this._cy >= hi) { this._cy = hi; this._dir = -1; }
      if (this._cy <= lo) { this._cy = lo; this._dir =  1; }
    }

    this._dx = this._cx - prev_x;
    this._dy = this._cy - prev_y;

    this._rect.setPosition(this._cx, this._cy);
    this._rect.body.reset(this._cx, this._cy);
  }

  // If the player is standing on this platform, carry them along with it.
  // Call this in GameScene.update() after update().
  carryPlayer(player) {
    if (!this._dx && !this._dy) return;
    const pb = player.body;
    const mb = this._rect.body;

    // Player feet within a few pixels of the platform top surface.
    const near_top  = pb.bottom >= mb.top - 4 && pb.bottom <= mb.bottom + 4;
    const overlap_x = pb.right  >  mb.left + 2 && pb.left  < mb.right  - 2;

    if (near_top && overlap_x && pb.blocked.down) {
      player.x += this._dx;
      // Only carry upward -- falling is handled by gravity naturally.
      if (this._dy < 0) player.y += this._dy;
    }
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
