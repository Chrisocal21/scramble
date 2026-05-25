// JumperEnemy.js -- Stationary enemy that hops at intervals.
// Idles for HOP_INTERVAL ms, then launches upward toward the player if they
// are within range. Harder to stomp than PatrolEnemy because it moves
// unpredictably in the air.
//
// State machine: idle -> jumping -> idle

import Phaser from 'phaser';
import { AudioManager } from '../systems/AudioManager.js';

const HOP_INTERVAL  = 1800;   // ms between hops
const HOP_VY        = -460;   // upward velocity on hop
const HOP_VX        = 85;     // horizontal speed toward player when in range
const DETECT_RANGE  = 8 * 32; // pixel radius to seek the player

const W = 26;
const H = 26;
const COLOR_BODY = 0x66dd22;  // lime green -- distinct from patrol orange
const COLOR_DARK = 0x44aa11;

// Shared burst helper -- radiates colored puffs from an enemy on stomp.
function _stompBurst(scene, x, y, color) {
  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI * 2;
    const dist  = 40 + (i * 17) % 30;
    const g = scene.add.graphics();
    g.fillStyle(color, 0.9);
    g.fillCircle(0, 0, 3 + (i % 3));
    g.setPosition(x, y).setDepth(8);
    scene.tweens.add({
      targets:  g,
      x:        x + Math.cos(angle) * dist,
      y:        y + Math.sin(angle) * dist,
      alpha:    0,
      scaleX:   0.15,
      scaleY:   0.15,
      duration: 260 + (i * 20) % 80,
      ease:     'Cubic.Out',
      onComplete: () => g.destroy(),
    });
  }
}

export class JumperEnemy extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.state = 'idle';  // 'idle' | 'jumping' | 'stunned' | 'dead'
    this._hop_timer = HOP_INTERVAL;
    this._was_grounded = false;

    const body = this.body;
    body.setSize(W, H);
    body.setOffset(-W / 2, -H / 2);
    body.setCollideWorldBounds(true);
    body.setGravityY(800);

    this._gfx = scene.add.graphics();
    this.add(this._gfx);
    this._draw();
  }

  addColliders(ground, platforms, oneWayPlatforms) {
    const scene = this.scene;
    scene.physics.add.collider(this, ground);
    scene.physics.add.collider(this, platforms);
    scene.physics.add.collider(this, oneWayPlatforms, null, (enemy, tile) => {
      return this.body.velocity.y >= 0 && this.body.bottom <= tile.body.top + 8;
    });
  }

  update(time, delta) {
    if (this.state === 'dead' || this.state === 'stunned') return;

    const grounded = this.body.blocked.down;

    // Detect landing: transition jumping -> idle
    if (this.state === 'jumping' && grounded && this._was_grounded === false) {
      this.state = 'idle';
      this._hop_timer = HOP_INTERVAL;
      this.body.velocity.x = 0;
      // Quick squash on landing
      this.scene.tweens.add({
        targets: this,
        scaleY:  0.65,
        scaleX:  1.4,
        yoyo:    true,
        duration: 90,
        ease:    'Sine.Out',
      });
    }

    this._was_grounded = grounded;

    if (this.state === 'idle') {
      this.body.velocity.x = 0;
      this._hop_timer -= delta;
      if (this._hop_timer <= 0) this._hop();
    }

    this._draw();
  }

  _hop() {
    this.state = 'jumping';

    // Seek player if within range
    const player = this.scene.player;
    let vx = 0;
    if (player) {
      const dx = player.x - this.x;
      if (Math.abs(dx) <= DETECT_RANGE) {
        vx = Math.sign(dx) * HOP_VX;
      }
    }

    this.body.velocity.y = HOP_VY;
    this.body.velocity.x = vx;

    // Stretch upward on launch
    this.scene.tweens.add({
      targets:  this,
      scaleY:   1.35,
      scaleX:   0.75,
      duration: 80,
      yoyo:     true,
      ease:     'Sine.Out',
    });
  }

  // Called by GameScene when the player lands on top.
  stomp(player) {
    if (this.state === 'dead' || this.state === 'stunned') return;
    this.state = 'stunned';
    this.body.velocity.x = 0;
    this.body.velocity.y = 0;
    player.stompBounce();
    AudioManager.playSfx('stomp');
    _stompBurst(this.scene, this.x, this.y, 0xff9944);

    this.scene.tweens.add({
      targets:  this,
      scaleY:   0.1,
      scaleX:   1.6,
      duration: 110,
      ease:     'Cubic.Out',
    });
    this.scene.tweens.add({
      targets:  this,
      alpha:    0,
      delay:    180,
      duration: 200,
    });
    this.scene.time.delayedCall(400, () => this._die());
  }

  // Returns true when this enemy can hurt the player on contact.
  isDangerous() {
    return this.state === 'idle' || this.state === 'jumping';
  }

  _die() {
    this.state = 'dead';
    this.destroy();
  }

  _draw() {
    const g = this.scene === null ? null : this._gfx;
    if (!g) return;
    g.clear();

    if (this.state === 'stunned') {
      g.fillStyle(COLOR_BODY, 1);
      g.fillEllipse(0, 4, W * 1.5, H * 0.5);
      return;
    }

    // Round body
    g.fillStyle(COLOR_BODY, 1);
    g.fillEllipse(0, 0, W, H);

    // Eyes -- look up when jumping (ready to track player), forward when idle
    const eye_offset_y = this.state === 'jumping' ? -7 : -3;
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(-5, eye_offset_y, 3);
    g.fillCircle(5,  eye_offset_y, 3);

    // Legs hint (only visible on ground)
    if (this.state === 'idle') {
      g.fillStyle(COLOR_DARK, 1);
      g.fillRect(-9, H / 2 - 5, 5, 5);
      g.fillRect(4,  H / 2 - 5, 5, 5);
    }
  }
}
