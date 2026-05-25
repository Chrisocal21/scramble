// ThrowerEnemy.js -- Stationary enemy that launches projectiles at the player.
// Fires every THROW_INTERVAL ms. Stomped from above: dies like PatrolEnemy.
// Side/bottom contact: damages player. Projectiles also damage on contact.
//
// dir parameter in level data: 1 = always fires right, -1 = always fires left,
// 0 = auto-aims at the player each throw.
//
// State machine: idle -> cooldown -> idle  (fires on cooldown expiry)

import Phaser from 'phaser';
import { AudioManager } from '../systems/AudioManager.js';

const THROW_INTERVAL = 2400;  // ms between shots
const PROJ_SPEED     = 240;   // projectile speed px/s
const PROJ_LIFETIME  = 5000;  // ms before auto-destroy

const W = 28;
const H = 28;
const BODY_COLOR  = 0x9933cc;  // purple -- distinct from other enemies
const DARK_COLOR  = 0x6611aa;

// ─────────────────────────────────────────────────────────────────────────────
// Projectile -- a simple physics rectangle fired by ThrowerEnemy.
// Lives in a shared Phaser group owned by the level result object so GameScene
// can check player overlap and add ground colliders in one place.
// ─────────────────────────────────────────────────────────────────────────────

function spawnProjectile(scene, x, y, dir, group) {
  const proj = scene.add.rectangle(x, y, 10, 10, 0xff8800);
  scene.physics.add.existing(proj);
  proj.body.setAllowGravity(false);
  proj.body.velocity.x = dir * PROJ_SPEED;
  proj.body.setCollideWorldBounds(true);
  proj.body.onWorldBounds = true;

  // Tag so GameScene can identify it and skip destroyed objects
  proj._is_projectile = true;
  proj._alive = true;

  // Destroy if it hits the world boundary
  proj.body.world.on('worldbounds', (body) => {
    if (body.gameObject === proj) proj_hit(proj, scene);
  }, proj);

  // Auto-destroy after lifetime
  scene.time.delayedCall(PROJ_LIFETIME, () => {
    if (proj._alive && proj.scene) proj_hit(proj, scene);
  });

  group.add(proj);
  return proj;
}

function proj_hit(proj, scene) {
  if (!proj._alive) return;
  proj._alive = false;

  // Remove world bounds listener before destroying to avoid phantom callbacks
  if (proj.body) proj.body.world.off('worldbounds', undefined, proj);

  scene.tweens.add({
    targets:    proj,
    alpha:      0,
    scaleX:     2.5,
    scaleY:     2.5,
    duration:   140,
    onComplete: () => { if (proj.scene) proj.destroy(); },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ThrowerEnemy
// ─────────────────────────────────────────────────────────────────────────────

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

export class ThrowerEnemy extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {number} dir  1=fires right, -1=fires left, 0=auto-aim at player
   * @param {Phaser.Physics.Arcade.Group} projectile_group  Shared group from level result
   */
  constructor(scene, x, y, dir, projectile_group) {
    super(scene, x, y);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.state = 'idle';  // 'idle' | 'stunned' | 'dead'
    this._dir              = dir;
    this._projectile_group = projectile_group;
    this._throw_timer      = THROW_INTERVAL * 0.5;  // first shot slightly early

    const body = this.body;
    body.setSize(W, H);
    body.setOffset(-W / 2, -H / 2);
    body.setCollideWorldBounds(true);
    body.setGravityY(600);
    body.velocity.x = 0;  // stationary

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

    this._throw_timer -= delta;
    if (this._throw_timer <= 0) {
      this._fire();
      this._throw_timer = THROW_INTERVAL;
    }

    this._draw();
  }

  _fireDir() {
    if (this._dir !== 0) return this._dir;
    const player = this.scene.player;
    if (player) return Math.sign(player.x - this.x) || 1;
    return 1;
  }

  _fire() {
    const dir = this._fireDir();
    // Muzzle at the tip of the cannon arm
    const muzzle_x = this.x + dir * (W / 2 + 8);
    spawnProjectile(this.scene, muzzle_x, this.y, dir, this._projectile_group);

    // Brief recoil squish
    this.scene.tweens.add({
      targets:  this,
      scaleX:   { from: 0.7, to: 1 },
      duration: 120,
      ease:     'Back.Out',
    });
  }

  // Called by GameScene when player lands on top.
  stomp(player) {
    if (this.state === 'dead' || this.state === 'stunned') return;
    this.state = 'stunned';
    this.body.velocity.x = 0;
    player.stompBounce();
    AudioManager.playSfx('stomp');
    _stompBurst(this.scene, this.x, this.y, 0xff6633);

    this.scene.tweens.add({
      targets:  this,
      scaleY:   0.12,
      scaleX:   1.5,
      duration: 120,
      ease:     'Cubic.Out',
    });
    this.scene.tweens.add({
      targets:  this,
      alpha:    0,
      delay:    200,
      duration: 200,
    });
    this.scene.time.delayedCall(420, () => this._die());
  }

  isDangerous() {
    return this.state !== 'dead' && this.state !== 'stunned';
  }

  _die() {
    this.state = 'dead';
    this.destroy();
  }

  _draw() {
    const g = this._gfx;
    g.clear();

    if (this.state === 'stunned') {
      g.fillStyle(BODY_COLOR, 1);
      g.fillEllipse(0, 4, W * 1.3, H * 0.6);
      return;
    }

    const dir = this._fireDir();

    // Body
    g.fillStyle(BODY_COLOR, 1);
    g.fillRect(-W / 2, -H / 2, W, H);

    // Cannon arm pointing in fire direction
    g.fillStyle(DARK_COLOR, 1);
    if (dir > 0) {
      g.fillRect(W / 2 - 2, -5, 12, 10);  // arm to the right
    } else {
      g.fillRect(-W / 2 - 10, -5, 12, 10); // arm to the left
    }

    // Single large eye, facing fire direction
    g.fillStyle(0xffee00, 1);
    g.fillCircle(dir * 6, -4, 6);
    g.fillStyle(0x111111, 1);
    g.fillCircle(dir * 8, -4, 3);
  }
}

// Export proj_hit so GameScene can call it on projectile-player overlap.
export { proj_hit, spawnProjectile };
