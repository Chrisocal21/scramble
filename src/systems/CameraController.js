// CameraController.js -- Smooth camera follow with movement lead and world clamping.

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/game.js';

// How far ahead of the player the camera leads (pixels).
const LEAD_DISTANCE = 80;

// Lerp factor per frame -- higher = snappier, lower = floatier.
const LERP = 0.08;

export class CameraController {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;

    const cam = scene.cameras.main;
    cam.setBounds(0, 0, 60 * GAME_CONFIG.tileSize, 24 * GAME_CONFIG.tileSize);

    // Start camera centered on the player immediately (no lerp on first frame)
    cam.centerOn(player.x, player.y);
  }

  update(delta) {
    const player = this.player;
    const cam = this.scene.cameras.main;

    // Target x slightly ahead of the player in the direction they are moving.
    const lead_x = player.body ? player.body.velocity.x * 0.12 : 0;
    const target_x = player.x + Phaser.Math.Clamp(lead_x, -LEAD_DISTANCE, LEAD_DISTANCE);
    const target_y = player.y;

    // Lerp the camera scroll position toward the target.
    cam.scrollX += (target_x - cam.width / 2 - cam.scrollX) * LERP;
    cam.scrollY += (target_y - cam.height / 2 - cam.scrollY) * LERP;
  }
}
