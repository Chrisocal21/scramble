// PatrolEnemy.js -- Walks back and forth between two x boundaries.
// Stomped from above: enemy dies, player gets a bounce.
// Side/bottom contact: player takes damage.
//
// State machine: patrol -> stunned -> dead

import Phaser from 'phaser';

const PATROL_SPEED = 80;
const ENEMY_W = 28;
const ENEMY_H = 28;
const STUN_DURATION = 400; // ms before disappearing after stomp

export class PatrolEnemy extends Phaser.GameObjects.Container {
  constructor(scene, x, y, patrol_left, patrol_right) {
    super(scene, x, y);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.patrol_left = patrol_left;
    this.patrol_right = patrol_right;
    this.state = 'patrol'; // 'patrol' | 'stunned' | 'dead'
    this._direction = 1; // 1 = right, -1 = left
    this.collected = false; // reuse flag name for consistency

    const body = this.body;
    body.setSize(ENEMY_W, ENEMY_H);
    body.setOffset(-ENEMY_W / 2, -ENEMY_H / 2);
    body.setCollideWorldBounds(true);
    body.setGravityY(600);

    this._gfx = scene.add.graphics();
    this.add(this._gfx);
    this._draw();

    // Wire colliders with level geometry from GameScene
    // (GameScene calls addColliders after creating all enemies)
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
    if (this.state !== 'patrol') return;

    const body = this.body;

    // Reverse at boundaries
    if (this.x <= this.patrol_left) {
      this._direction = 1;
    } else if (this.x >= this.patrol_right) {
      this._direction = -1;
    }

    body.velocity.x = PATROL_SPEED * this._direction;

    this._draw();
  }

  // Called by GameScene when the player lands on top.
  stomp(player) {
    if (this.state !== 'patrol') return;
    this.state = 'stunned';
    this.body.velocity.x = 0;
    this._draw();
    player.stompBounce();

    // Squish animation: flatten quickly then fade
    this.scene.tweens.add({
      targets: this,
      scaleY: 0.12,
      scaleX: 1.5,
      duration: 120,
      ease: 'Cubic.Out',
    });
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      delay: 200,
      duration: 200,
      ease: 'Linear',
    });

    this.scene.time.delayedCall(STUN_DURATION, () => {
      this._die();
    });
  }

  // Returns true if the player touched the side or bottom (damaging contact).
  isDangerous() {
    return this.state === 'patrol';
  }

  _die() {
    this.state = 'dead';
    this.destroy();
  }

  _draw() {
    const g = this._gfx;
    g.clear();

    if (this.state === 'stunned') {
      // Tipped over / flat
      g.fillStyle(0xff6644, 1);
      g.fillEllipse(0, 4, ENEMY_W * 1.3, ENEMY_H * 0.6);
      return;
    }

    // Body
    g.fillStyle(0xff6644, 1);
    g.fillRect(-ENEMY_W / 2, -ENEMY_H / 2, ENEMY_W, ENEMY_H);

    // Eyes
    const eye_x = this._direction * 5;
    g.fillStyle(0x222222, 1);
    g.fillCircle(eye_x - 5, -4, 3);
    g.fillCircle(eye_x + 5, -4, 3);

    // Feet hint
    g.fillStyle(0xcc4422, 1);
    g.fillRect(-ENEMY_W / 2, ENEMY_H / 2 - 6, 10, 6);
    g.fillRect(ENEMY_W / 2 - 10, ENEMY_H / 2 - 6, 10, 6);
  }
}
