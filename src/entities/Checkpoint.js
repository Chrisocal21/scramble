// Checkpoint.js -- A mid-level respawn flag the player activates by touching.
//
// Two visual states:
//   inactive -- dark pole, grey flag (unlit)
//   active   -- lit pole, yellow/gold flag + scale pulse on activation
//
// Overlap check uses player.overlaps(this) which calls this.getBounds().
// A transparent hitzone Rectangle child ensures getBounds() is always valid.

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/game.js';
import { AudioManager } from '../systems/AudioManager.js';

const T = GAME_CONFIG.tileSize;

const COLOR_POLE_OFF  = 0x555555;
const COLOR_POLE_ON   = 0xddaa22;
const COLOR_FLAG_OFF  = 0x444444;
const COLOR_FLAG_ON   = 0xffdd44;
const COLOR_GLOW      = 0xffe066;

const POLE_W     = 4;
const POLE_H     = T * 1.6;  // reaches a bit above player head height
const FLAG_W     = T * 0.65;
const FLAG_H     = T * 0.5;

export class Checkpoint extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} col  tile column
   * @param {number} row  tile row (same row the player walks on)
   */
  constructor(scene, col, row) {
    // Center horizontally in the tile; align bottom of pole to the tile surface.
    // Tile surface = row * T + T/2 (center of tile) - T/2 (top edge) = row * T.
    const x = col * T + T / 2;
    const y = row * T - T / 2;  // visual center sits half a tile above the floor row
    super(scene, x, y);
    scene.add.existing(this);

    this.state = 'inactive';  // 'inactive' | 'active'

    this._gfx = scene.add.graphics();
    this.add(this._gfx);

    // Transparent hitzone so getBounds() covers the flag area.
    this._hitzone = scene.add.rectangle(0, -POLE_H / 2, T, POLE_H, 0x000000, 0);
    this.add(this._hitzone);

    this._draw();
  }

  // Call when the player first touches this checkpoint.
  activate() {
    if (this.state === 'active') return;
    this.state = 'active';
    this._draw();
    AudioManager.playSfx('checkpoint');

    // Pop tween
    this.scene.tweens.add({
      targets:  this,
      scaleX:   1.25,
      scaleY:   1.25,
      duration: 120,
      yoyo:     true,
      ease:     'Sine.Out',
    });
  }

  _draw() {
    const g = this._gfx;
    g.clear();

    const active = this.state === 'active';

    // Pole
    g.fillStyle(active ? COLOR_POLE_ON : COLOR_POLE_OFF, 1);
    g.fillRect(-POLE_W / 2, -POLE_H, POLE_W, POLE_H);

    // Flag (flies to the right)
    if (active) {
      // Bright filled flag
      g.fillStyle(COLOR_FLAG_ON, 1);
      g.fillTriangle(
        POLE_W / 2,          -POLE_H,          // top-left (attached to pole tip)
        POLE_W / 2 + FLAG_W, -POLE_H + FLAG_H / 2,  // right point
        POLE_W / 2,          -POLE_H + FLAG_H   // bottom-left
      );
      // Small highlight dot at top of pole
      g.fillStyle(COLOR_GLOW, 1);
      g.fillCircle(0, -POLE_H, 5);
    } else {
      // Dark unfilled flag
      g.fillStyle(COLOR_FLAG_OFF, 1);
      g.fillTriangle(
        POLE_W / 2,          -POLE_H,
        POLE_W / 2 + FLAG_W, -POLE_H + FLAG_H / 2,
        POLE_W / 2,          -POLE_H + FLAG_H
      );
    }

    // Pole base (small feet so it reads as standing on the ground)
    g.fillStyle(active ? COLOR_POLE_ON : COLOR_POLE_OFF, 1);
    g.fillRect(-T / 4, 0, T / 2, 4);
  }
}
