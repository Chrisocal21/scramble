// Player.js -- The egg. Handles movement, physics, drawing, and visual expression.
//
// How variable-height jumping works:
//   When jump is pressed, an upward velocity is applied.
//   While the jump button is held AND the player is still rising AND hold time remains,
//   a small extra upward force is applied each frame to extend the arc.
//   Releasing early cuts the jump short.
//
// Coyote time:
//   When the player walks off a ledge, a short timer runs. If jump is pressed during
//   that window, the jump fires as if the player were still on the ground.
//
// Jump buffering:
//   If jump is pressed just before landing, the input is stored. On landing, the jump
//   fires immediately instead of being swallowed.

import Phaser from 'phaser';
import { PHYSICS } from '../config/physics.js';

// Egg dimensions
const EGG_W = 28;
const EGG_H = 36;

// Invincibility flash frequency (ms between toggles)
const FLASH_INTERVAL = 100;

export class Player extends Phaser.GameObjects.Container {
  constructor(scene, x, y, input_manager, health_manager) {
    super(scene, x, y);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.input_manager = input_manager;
    this.health_manager = health_manager;

    // Physics body setup
    const body = this.body;
    body.setSize(EGG_W, EGG_H);
    body.setOffset(-EGG_W / 2, -EGG_H / 2);
    body.setGravityY(0); // We apply gravity manually for full control
    body.setMaxVelocityY(PHYSICS.terminalVelocity);
    body.setCollideWorldBounds(true);

    // Jump state
    this._on_ground = false;
    this._coyote_timer = 0;    // ms remaining in coyote window
    this._jump_buffer_timer = 0; // ms remaining in jump buffer window
    this._jump_holding = false;
    this._jump_hold_timer = 0; // ms remaining in jump hold window

    // Direction the player is facing (1 = right, -1 = left)
    this._facing = 1;

    // Visual state for eye expression
    this._eye_state = 'normal'; // 'normal' | 'wide' | 'dazed'

    // Squash/stretch scale -- lerped each frame, passed into _drawEgg().
    // We never scale the Container itself so the ellipse always renders
    // at native resolution with no bitmap scaling artifacts.
    this._draw_scale_x = 1.0;
    this._draw_scale_y = 1.0;

    // Flash state for invincibility
    this._flash_timer = 0;
    this._visible_toggle = true;

    // Build the egg graphics
    this._gfx = scene.add.graphics();
    this.add(this._gfx);
    this._drawEgg(1.0, 1.0);

    // Collision with level geometry is wired in GameScene after Player is created.
    // The GameScene passes its platform groups to _addColliders().
  }

  // Called by GameScene after the level is built.
  addColliders(ground, platforms, oneWayPlatforms) {
    const scene = this.scene;

    scene.physics.add.collider(this, ground);
    scene.physics.add.collider(this, platforms);

    // One-way platforms: only collide when falling down onto them from above.
    scene.physics.add.collider(this, oneWayPlatforms, null, (player, tile) => {
      return this.body.velocity.y >= 0 && this.body.bottom <= tile.body.top + 8;
    });
  }

  update(time, delta) {
    const dt = delta; // milliseconds
    const body = this.body;
    const inp = this.input_manager.state;

    // --- Ground detection ---
    const was_on_ground = this._on_ground;
    this._on_ground = body.blocked.down;

    // Start coyote timer when walking off a ledge
    if (was_on_ground && !this._on_ground && body.velocity.y >= 0) {
      this._coyote_timer = PHYSICS.coyoteTime;
    }
    if (this._coyote_timer > 0) this._coyote_timer -= dt;

    // Tick jump buffer
    if (this._jump_buffer_timer > 0) this._jump_buffer_timer -= dt;

    // --- Horizontal movement ---
    if (inp.left) {
      body.velocity.x = Math.max(
        body.velocity.x - PHYSICS.runAcceleration * (dt / 1000),
        -PHYSICS.runSpeed
      );
      this._facing = -1;
    } else if (inp.right) {
      body.velocity.x = Math.min(
        body.velocity.x + PHYSICS.runAcceleration * (dt / 1000),
        PHYSICS.runSpeed
      );
      this._facing = 1;
    } else if (this._on_ground) {
      // Only decelerate on the ground. Momentum is fully preserved in the air.
      const decel = PHYSICS.runDeceleration * (dt / 1000);
      if (Math.abs(body.velocity.x) < decel) {
        body.velocity.x = 0;
      } else {
        body.velocity.x -= Math.sign(body.velocity.x) * decel;
      }
    }

    // --- Jump input ---
    const jump_just_pressed = this.input_manager.isJumpJustPressed();

    if (jump_just_pressed) {
      // Store in buffer
      this._jump_buffer_timer = PHYSICS.jumpBuffer;
    }

    const can_jump = this._on_ground || this._coyote_timer > 0;
    const buffer_active = this._jump_buffer_timer > 0;

    if ((jump_just_pressed || buffer_active) && can_jump) {
      this._doJump();
    }

    // --- Jump hold (extend arc while button held) ---
    if (this._jump_holding) {
      if (inp.jump && this._jump_hold_timer > 0 && body.velocity.y < 0) {
        body.velocity.y -= PHYSICS.jumpHoldForce * (dt / 1000);
        this._jump_hold_timer -= dt;
      } else {
        this._jump_holding = false;
      }
    }

    // --- Manual gravity ---
    const falling = body.velocity.y > 0;
    const gravity_this_frame =
      PHYSICS.gravity * (falling ? PHYSICS.fallMultiplier : 1) * (dt / 1000);
    body.velocity.y = Math.min(
      body.velocity.y + gravity_this_frame,
      PHYSICS.terminalVelocity
    );

    // Zero out vertical velocity when blocked by ceiling
    if (body.blocked.up) {
      body.velocity.y = 0;
      this._jump_holding = false;
    }

    // --- Eye expression based on state ---
    if (this.health_manager.invincible) {
      this._eye_state = 'dazed';
    } else if (!this._on_ground && body.velocity.y < -80 && Math.abs(body.velocity.y) > 300) {
      this._eye_state = 'wide';
    } else {
      this._eye_state = 'normal';
    }

    // --- Facing direction ---
    // (Eyes position uses this._facing)

    // --- Squash and stretch ---
    // Target scale based on movement state.
    const target_scale_y = this._on_ground ? 0.88 : (body.velocity.y < 0 ? 1.18 : 1.0);
    const target_scale_x = this._on_ground ? 1.14 : (body.velocity.y < 0 ? 0.86 : 1.0);
    // Lerp smoothly toward target. The draw call uses these values directly
    // so the ellipse is always re-rasterised at the correct size.
    this._draw_scale_x = Phaser.Math.Linear(this._draw_scale_x, target_scale_x, 0.25);
    this._draw_scale_y = Phaser.Math.Linear(this._draw_scale_y, target_scale_y, 0.25);

    // --- Invincibility flash ---
    if (this.health_manager.invincible) {
      this._flash_timer += dt;
      if (this._flash_timer >= FLASH_INTERVAL) {
        this._flash_timer = 0;
        this._visible_toggle = !this._visible_toggle;
        this.setVisible(this._visible_toggle);
      }
    } else {
      this.setVisible(true);
      this._flash_timer = 0;
      this._visible_toggle = true;
    }

    // Redraw each frame -- pass current squash/stretch dimensions.
    this._drawEgg(this._draw_scale_x, this._draw_scale_y);
  }

  _doJump() {
    this.body.velocity.y = PHYSICS.jumpVelocity;
    this._jump_holding = true;
    this._jump_hold_timer = PHYSICS.jumpHoldDuration;
    this._coyote_timer = 0;
    this._jump_buffer_timer = 0;
  }

  // Returns true if this container's bounds overlap another game object.
  overlaps(other) {
    return Phaser.Geom.Intersects.RectangleToRectangle(
      this.getBounds(),
      other.getBounds()
    );
  }

  _drawEgg(sx = 1.0, sy = 1.0) {
    const g = this._gfx;
    g.clear();

    const w = EGG_W * sx;
    const h = EGG_H * sy;

    // Body
    g.fillStyle(0xf5f0e8, 1);
    g.fillEllipse(0, 0, w, h);

    // Outline
    g.lineStyle(2, 0xccbbaa, 1);
    g.strokeEllipse(0, 0, w, h);

    // Eyes -- scale position with the egg dimensions so they stay inside
    const eye_offset_x = this._facing * (4 * sx);
    const left_eye_x = eye_offset_x - 7 * sx;
    const right_eye_x = eye_offset_x + 7 * sx;
    const eye_y = -4 * sy;

    if (this._eye_state === 'dazed') {
      // X eyes
      const s = 4;
      g.lineStyle(2, 0x333333, 1);
      g.beginPath();
      g.moveTo(left_eye_x - s, eye_y - s); g.lineTo(left_eye_x + s, eye_y + s);
      g.moveTo(left_eye_x + s, eye_y - s); g.lineTo(left_eye_x - s, eye_y + s);
      g.moveTo(right_eye_x - s, eye_y - s); g.lineTo(right_eye_x + s, eye_y + s);
      g.moveTo(right_eye_x + s, eye_y - s); g.lineTo(right_eye_x - s, eye_y + s);
      g.strokePath();
    } else {
      const eye_r = this._eye_state === 'wide' ? 5 : 3;
      g.fillStyle(0x222222, 1);
      g.fillCircle(left_eye_x, eye_y, eye_r);
      g.fillCircle(right_eye_x, eye_y, eye_r);

      // Pupils (highlight dot)
      g.fillStyle(0xffffff, 1);
      g.fillCircle(left_eye_x + 1, eye_y - 1, 1);
      g.fillCircle(right_eye_x + 1, eye_y - 1, 1);
    }
  }

  // Called by GameScene when an enemy is stomped (player bounced up).
  stompBounce() {
    this.body.velocity.y = PHYSICS.jumpVelocity * 0.65;
  }
}
