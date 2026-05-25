// BossEnemy.js -- King Scramble. The World 1 final boss.
//
// Phase 1 (HP 6–4): PATROL → STOMP → VULNERABLE (1.8 s window)
// Phase 2 (HP 3–1): PATROL → STOMP or CHARGE → VULNERABLE (1.0 s window, shorter)
//
// Damage rule: only stompable during VULNERABLE state.
// Side / bottom contact is always dangerous (full isDangerous() when not vulnerable).

import Phaser from 'phaser';
import { AudioManager } from '../systems/AudioManager.js';

export const BOSS_W = 52;
export const BOSS_H = 64;

// ── Tuning ─────────────────────────────────────────────────────────────────
const STOMP_VY         = -580;   // upward launch (px/s)
const CHARGE_SPEED     = 330;    // horizontal dash (px/s)
const PATROL_SPEED_P1  = 65;
const PATROL_SPEED_P2  = 95;
const PATROL_WAIT_P1   = 2600;   // ms before next attack
const PATROL_WAIT_P2   = 1700;
const VULN_P1          = 1800;   // ms stunned after stomp land (phase 1)
const VULN_P2          = 1000;   // ms stunned (phase 2)
const VULN_BRIEF       = 650;    // ms stunned after charge wall hit

export class BossEnemy extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this._player         = null;   // wired via setPlayer() after player is created
    this.hp              = 6;
    this.state           = 'patrol';
    this._state_timer    = PATROL_WAIT_P1;
    this._facing         = 1;
    this._stomp_in_air   = false;
    this._flash_timer    = 0;
    this._visible_toggle = true;
    this._death_complete = false;

    const body = this.body;
    body.setSize(BOSS_W, BOSS_H);
    body.setOffset(-BOSS_W / 2, -BOSS_H / 2);
    body.setGravityY(1400);          // heavy -- uses Phaser body gravity
    body.setMaxVelocityY(900);
    body.setCollideWorldBounds(true);

    this._gfx = scene.add.graphics();
    this.add(this._gfx);
    this._draw();
  }

  // Called by GameScene once the player object exists.
  setPlayer(player) { this._player = player; }

  addColliders(ground, platforms) {
    this.scene.physics.add.collider(this, ground);
    this.scene.physics.add.collider(this, platforms);
  }

  isDangerous() {
    return this.state !== 'vulnerable' && this.state !== 'dead';
  }

  // Called by GameScene's stomp-detection loop when player falls onto boss.
  stomp(player) {
    player.body.velocity.y = -380;   // always bounce player up
    if (this.state === 'vulnerable') {
      this._takeDamage();
    }
    // else: immune — player just bounces off the crown
  }

  update(time, delta) {
    if (this.state === 'dead') return;

    const phase2 = this.hp <= 3;
    switch (this.state) {
      case 'patrol':     this._updatePatrol(delta, phase2);    break;
      case 'stomp':      this._updateStomp(delta);             break;
      case 'charge':     this._updateCharge(delta);            break;
      case 'vulnerable': this._updateVulnerable(delta, phase2); break;
    }
    this._draw();
  }

  // ── Per-state updates ──────────────────────────────────────────────────────

  _updatePatrol(dt, phase2) {
    const spd = phase2 ? PATROL_SPEED_P2 : PATROL_SPEED_P1;

    // Slowly track player horizontally
    if (this._player) {
      this._facing = this._player.x < this.x ? -1 : 1;
    }
    this.body.velocity.x = this._facing * spd;

    // Reverse at world edges
    if (this.body.blocked.left)  this._facing =  1;
    if (this.body.blocked.right) this._facing = -1;

    this._state_timer -= dt;
    if (this._state_timer <= 0) {
      if (phase2 && Math.random() < 0.5) {
        this._enterCharge();
      } else {
        this._enterStomp();
      }
    }
  }

  _updateStomp(dt) {
    // Track air-time so we know a "real" landing
    if (!this.body.blocked.down) {
      this._stomp_in_air = true;
    }
    // Landed after going airborne → enter vulnerable + emit shake event
    if (this._stomp_in_air && this.body.blocked.down) {
      this.body.velocity.x = 0;
      this._enterVulnerable();
      this.scene.events.emit('boss_stomp_land');
    }
  }

  _updateCharge(dt) {
    if (!this._player) return;
    const dir = this._player.x < this.x ? -1 : 1;
    this._facing = dir;
    this.body.velocity.x = dir * CHARGE_SPEED;

    // Hit a world wall → brief stun
    if (this.body.blocked.left || this.body.blocked.right) {
      this.body.velocity.x = 0;
      this._enterVulnerable(true);
      this.scene.events.emit('boss_stomp_land');
    }
  }

  _updateVulnerable(dt) {
    this.body.velocity.x = 0;

    // Visibility flash
    this._flash_timer += dt;
    if (this._flash_timer >= 80) {
      this._flash_timer = 0;
      this._visible_toggle = !this._visible_toggle;
      this.setVisible(this._visible_toggle);
    }

    // Recover when timer runs out
    this._state_timer -= dt;
    if (this._state_timer <= 0) {
      this.setVisible(true);
      this._visible_toggle = true;
      this._enterPatrol();
    }
  }

  // ── State transitions ──────────────────────────────────────────────────────

  _enterPatrol() {
    const phase2 = this.hp <= 3;
    this.state        = 'patrol';
    this._state_timer = phase2 ? PATROL_WAIT_P2 : PATROL_WAIT_P1;
  }

  _enterStomp() {
    this.state           = 'stomp';
    this._stomp_in_air   = false;
    this.body.velocity.y = STOMP_VY;
    // Slight drift toward player
    if (this._player) {
      const dx = this._player.x - this.x;
      this._facing = Math.sign(dx) || 1;
      this.body.velocity.x = this._facing * 100;
    }
    AudioManager.playSfx('jump');
  }

  _enterCharge() {
    this.state        = 'charge';
    this._state_timer = 0;
  }

  _enterVulnerable(brief = false) {
    const phase2      = this.hp <= 3;
    this.state        = 'vulnerable';
    this._state_timer = brief ? VULN_BRIEF : (phase2 ? VULN_P2 : VULN_P1);
    this._flash_timer = 0;
  }

  // ── Damage & death ─────────────────────────────────────────────────────────

  _takeDamage() {
    this.hp--;
    AudioManager.playSfx('land');
    if (this.hp <= 0) {
      this._die();
    } else {
      this.setVisible(true);
      this._visible_toggle = true;
      this._enterPatrol();
    }
  }

  _die() {
    this.state = 'dead';
    this.body.velocity.x = 0;
    this.body.velocity.y = 0;

    // Explosion burst
    const colors = [0xff2244, 0xffdd44, 0xff8822, 0xffffff];
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const dist  = 30 + (i * 13) % 50;
      const g = this.scene.add.graphics();
      g.fillStyle(colors[i % 4], 1);
      g.fillCircle(0, 0, 3 + (i % 5));
      g.setPosition(this.x, this.y).setDepth(15);
      this.scene.tweens.add({
        targets:  g,
        x:        g.x + Math.cos(angle) * dist,
        y:        g.y + Math.sin(angle) * dist - 12,
        alpha:    0,
        duration: 500 + (i * 11) % 250,
        ease:     'Cubic.Out',
        onComplete: () => g.destroy(),
      });
    }

    // Spin + shrink boss graphic
    this.scene.tweens.add({
      targets:  this,
      angle:    480,
      scaleX:   0,
      scaleY:   0,
      alpha:    0,
      duration: 700,
      ease:     'Cubic.In',
      onComplete: () => {
        this._death_complete = true;
        this.scene.events.emit('boss_defeated');
      },
    });
  }

  // ── Visual ─────────────────────────────────────────────────────────────────

  _draw() {
    const g = this._gfx;
    g.clear();

    // Body colour: white when vulnerable, red-orange low HP, crimson otherwise
    let body_col, outline_col;
    if (this.state === 'vulnerable') {
      body_col    = 0xffffff;
      outline_col = 0xffdd44;
    } else if (this.hp <= 2) {
      body_col    = 0xff4422;
      outline_col = 0xcc2200;
    } else {
      body_col    = 0xcc2233;
      outline_col = 0x880011;
    }

    // Main egg body
    g.fillStyle(body_col, 1);
    g.fillEllipse(0, 0, BOSS_W, BOSS_H);
    g.lineStyle(3, outline_col, 1);
    g.strokeEllipse(0, 0, BOSS_W, BOSS_H);

    // Crown (3 points)
    const cy = -BOSS_H / 2 - 4;
    g.fillStyle(0xffdd44, 1);
    g.fillTriangle(-16, cy, -12, cy - 11, -8, cy);
    g.fillTriangle( -4, cy,   0, cy - 15,  4, cy);
    g.fillTriangle(  8, cy,  12, cy - 11, 16, cy);
    g.lineStyle(1, 0xddaa22, 1);
    g.strokeTriangle(-16, cy, -12, cy - 11, -8, cy);
    g.strokeTriangle( -4, cy,   0, cy - 15,  4, cy);
    g.strokeTriangle(  8, cy,  12, cy - 11, 16, cy);

    // Eyes (facing-aware, menacing)
    const ex      = this._facing * 8;
    const eye_col = this.state === 'vulnerable' ? 0x0055ff : 0x110000;
    g.fillStyle(eye_col, 1);
    g.fillEllipse(ex - 12, -8, 14, 9);
    g.fillEllipse(ex +  2, -8, 14, 9);

    // Angry brows
    if (this.state !== 'vulnerable') {
      g.lineStyle(3, 0x330000, 1);
      g.lineBetween(ex - 18, -16, ex - 8, -11);
      g.lineBetween(ex -  2, -11, ex + 8, -16);
    }

    // "Crack" marks showing HP lost (drawn on the egg body)
    if (this.hp < 6) {
      g.lineStyle(2, 0x000000, 0.45);
      for (let i = 0; i < (6 - this.hp); i++) {
        const a  = (i / 6) * Math.PI - Math.PI / 3;
        const rx = (BOSS_W / 2 - 4) * Math.cos(a);
        const ry = (BOSS_H / 2 - 6) * Math.sin(a);
        g.lineBetween(rx - 5, ry - 4, rx + 5, ry + 4);
      }
    }
  }
}
