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
import { AudioManager } from '../systems/AudioManager.js';

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

    // Wall-jump state
    this._on_wall = null;          // 'left' | 'right' | null
    this._wall_jump_lockout = 0;   // ms remaining -- horizontal input locked out
    this._wall_jump_dir = 0;       // 1 (right) or -1 (left) direction of last kick

    // Dash state
    this._dashing = false;
    this._dash_timer = 0;     // ms remaining in the active dash burst
    this._dash_cooldown = 0;  // ms remaining before the next dash is allowed
    this._ghost_timer = 0;    // ms since last trail ghost was spawned
    this._streak_timer = 0;   // ms since last speed-line was spawned

    // Power-up state
    this._speed_boost_timer   = 0;     // ms remaining for speed boost
    this._double_jump_timer   = 0;     // ms remaining for double-jump window
    this._double_jump_used    = false; // consumed once per air-time window

    // Visual state for eye expression
    this._eye_state = 'normal'; // 'normal' | 'wide' | 'wall' | 'dazed'

    // Squash/stretch scale -- lerped each frame, passed into _drawEgg().
    // We never scale the Container itself so the ellipse always renders
    // at native resolution with no bitmap scaling artifacts.
    this._draw_scale_x = 1.0;
    this._draw_scale_y = 1.0;

    // Run cycle animation -- tilt and bob applied to the _gfx child.
    this._run_phase = 0;   // accumulated radians (drives sine)
    this._run_tilt  = 0;   // current gfx rotation in degrees
    this._run_bob   = 0;   // current gfx y-offset in pixels

    // Flash state for invincibility
    this._flash_timer = 0;
    this._visible_toggle = true;

    // Set to true by GameScene._onPlayerDeath(); halts all update logic.
    this._dead = false;

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
    if (this._dead) return;  // frozen after death
    const dt = delta; // milliseconds
    const body = this.body;
    const inp = this.input_manager.state;

    // --- Ground detection ---
    const was_on_ground = this._on_ground;
    this._on_ground = body.blocked.down;

    // Landing impact particles
    if (!was_on_ground && this._on_ground) {
      this._spawnLandingDust();
      AudioManager.playSfx('land');
    }

    // Start coyote timer when walking off a ledge
    if (was_on_ground && !this._on_ground && body.velocity.y >= 0) {
      this._coyote_timer = PHYSICS.coyoteTime;
    }
    if (this._coyote_timer > 0) this._coyote_timer -= dt;

    // Tick jump buffer
    if (this._jump_buffer_timer > 0) this._jump_buffer_timer -= dt;

    // Tick wall jump lockout
    if (this._wall_jump_lockout > 0) this._wall_jump_lockout -= dt;

    // --- Dash timers ---
    if (this._dash_timer > 0) {
      this._dash_timer -= dt;
      if (this._dash_timer <= 0) {
        this._dashing = false;
        this._dash_cooldown = PHYSICS.dashCooldown;
      }
    }
    if (this._dash_cooldown > 0) this._dash_cooldown -= dt;

    // --- Power-up timers ---
    if (this._speed_boost_timer > 0) this._speed_boost_timer -= dt;
    if (this._double_jump_timer  > 0) {
      this._double_jump_timer -= dt;
      if (this._double_jump_timer <= 0) this._double_jump_used = false;
    }
    // Reset double-jump availability on landing
    if (this._on_ground) this._double_jump_used = false;

    // Dash input: can dash when grounded or airborne, not while already dashing.
    const dash_just_pressed = this.input_manager.isDashJustPressed();
    if (dash_just_pressed && !this._dashing && this._dash_cooldown <= 0) {
      this._doDash();
    }

    // --- Wall detection ---
    // Wall-sliding: airborne, pressing into a wall, and not standing on ground.
    if (!this._on_ground && !this._dashing) {
      if (body.blocked.left && inp.left) {
        this._on_wall = 'left';
      } else if (body.blocked.right && inp.right) {
        this._on_wall = 'right';
      } else {
        this._on_wall = null;
      }
    } else {
      this._on_wall = null;
    }

    // --- Horizontal movement ---
    if (this._dashing) {
      // Dash overrides all horizontal input -- velocity is locked in by _doDash().
    } else if (this._wall_jump_lockout > 0) {
      // Locked out after wall jump -- kick-off velocity carries the player.
      // No horizontal input processed; existing velocity decays naturally in air.
    } else if (inp.left) {
      const top_speed = PHYSICS.runSpeed * (this._speed_boost_timer > 0 ? 1.6 : 1.0);
      body.velocity.x = Math.max(
        body.velocity.x - PHYSICS.runAcceleration * (dt / 1000),
        -top_speed
      );
      this._facing = -1;
    } else if (inp.right) {
      const top_speed = PHYSICS.runSpeed * (this._speed_boost_timer > 0 ? 1.6 : 1.0);
      body.velocity.x = Math.min(
        body.velocity.x + PHYSICS.runAcceleration * (dt / 1000),
        top_speed
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

    const can_jump = (this._on_ground || this._coyote_timer > 0) && !this._dashing;
    const buffer_active = this._jump_buffer_timer > 0;

    if ((jump_just_pressed || buffer_active) && can_jump) {
      this._doJump();
    }

    // Wall jump: fires when airborne, pressing into a wall, and not dashing.
    if (jump_just_pressed && this._on_wall && !can_jump && !this._dashing) {
      this._doWallJump(this._on_wall);
    }

    // Double jump: airborne, power-up active, not used yet this air-time.
    if (jump_just_pressed && !this._on_ground && !this._dashing
        && this._double_jump_timer > 0 && !this._double_jump_used
        && !this._on_wall) {
      this._doDoubleJump();
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
    // Skipped during dash -- the burst travels flat.
    if (!this._dashing) {
      const falling = body.velocity.y > 0;
      const gravity_this_frame =
        PHYSICS.gravity * (falling ? PHYSICS.fallMultiplier : 1) * (dt / 1000);
      body.velocity.y = Math.min(
        body.velocity.y + gravity_this_frame,
        PHYSICS.terminalVelocity
      );
    }

    // Zero out vertical velocity when blocked by ceiling
    if (body.blocked.up) {
      body.velocity.y = 0;
      this._jump_holding = false;
    }

    // Wall slide: cap downward speed while pressing into a wall.
    // Applied after gravity so the cap wins every frame during the slide.
    if (this._on_wall && !this._dashing && body.velocity.y > PHYSICS.wallSlideSpeed) {
      body.velocity.y = PHYSICS.wallSlideSpeed;
    }

    // --- Dash trail ghosts + speed lines ---
    if (this._dashing) {
      this._ghost_timer += dt;
      if (this._ghost_timer >= 30) {
        this._ghost_timer = 0;
        this._spawnDashGhost();
      }
      this._streak_timer += dt;
      if (this._streak_timer >= 15) {
        this._streak_timer = 0;
        this._spawnSpeedLine();
      }
    }

    // --- Eye expression based on state ---
    if (this.health_manager.invincible) {
      this._eye_state = 'dazed';
    } else if (this._dashing) {
      this._eye_state = 'wide';
    } else if (this._on_wall) {
      this._eye_state = 'wall';
    } else if (!this._on_ground && body.velocity.y < -80 && Math.abs(body.velocity.y) > 300) {
      this._eye_state = 'wide';   // excited on fast rise
    } else if (!this._on_ground && body.velocity.y > 300) {
      this._eye_state = 'wide';   // alarmed on fast fall
    } else {
      this._eye_state = 'normal';
    }

    // --- Facing direction ---
    // (Eyes position uses this._facing)

    // --- Squash and stretch ---
    // Target scale based on movement state.
    let target_scale_x, target_scale_y;
    if (this._dashing) {
      // Elongate horizontally during the burst.
      target_scale_x = 1.35;
      target_scale_y = 0.78;
    } else if (this._on_wall) {
      // Squished flat against the wall -- compressed x, stretched y.
      target_scale_x = 0.75;
      target_scale_y = 1.15;
    } else {
      target_scale_x = this._on_ground ? 1.14 : (body.velocity.y < 0 ? 0.86 : 1.0);
      target_scale_y = this._on_ground ? 0.88 : (body.velocity.y < 0 ? 1.18 : 1.0);
    }
    // Lerp smoothly toward target. The draw call uses these values directly
    // so the ellipse is always re-rasterised at the correct size.
    this._draw_scale_x = Phaser.Math.Linear(this._draw_scale_x, target_scale_x, 0.25);
    this._draw_scale_y = Phaser.Math.Linear(this._draw_scale_y, target_scale_y, 0.25);

    // --- Run cycle: tilt + bob applied to the graphics child ---
    // The Container (physics body) never moves; only the visual _gfx shifts.
    const spd_abs = Math.abs(body.velocity.x);
    const spd_t   = Math.min(spd_abs / PHYSICS.runSpeed, 1.0);
    let tgt_tilt = 0;
    let tgt_bob  = 0;

    if (this._on_ground && !this._dashing) {
      // Advance step cycle proportional to current speed.
      this._run_phase += dt * 0.020 * spd_t;   // ~20 rad/s at full speed
      const wobble = Math.sin(this._run_phase) * 2.5 * spd_t;  // ±2.5° wobble
      tgt_tilt = this._facing * 5 * spd_t + wobble;            // lean forward
      tgt_bob  = Math.abs(Math.sin(this._run_phase)) * -3 * spd_t; // 0..-3 px up
    } else if (!this._on_ground && !this._dashing) {
      if (body.velocity.y < -80) {
        tgt_tilt = this._facing * -3;    // lean back on rise
      } else if (body.velocity.y > 80) {
        tgt_tilt = this._facing * 4;     // lean forward on fall
      }
    }

    this._run_tilt = Phaser.Math.Linear(this._run_tilt, tgt_tilt, 0.22);
    this._run_bob  = Phaser.Math.Linear(this._run_bob,  tgt_bob,  0.22);
    this._gfx.setAngle(this._run_tilt);
    this._gfx.setY(this._run_bob);

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
    AudioManager.playSfx('jump');
  }

  _doWallJump(wall_side) {
    const dir = wall_side === 'left' ? 1 : -1;  // kick away from the wall
    this.body.velocity.x = dir * PHYSICS.wallJumpVelocityX;
    this.body.velocity.y = PHYSICS.wallJumpVelocityY;
    this._jump_holding = true;
    this._jump_hold_timer = PHYSICS.wallJumpHoldDuration;
    this._coyote_timer = 0;
    this._jump_buffer_timer = 0;
    this._on_wall = null;
    this._wall_jump_lockout = PHYSICS.wallJumpLockout;
    this._wall_jump_dir = dir;
    this._facing = dir;
    AudioManager.playSfx('jump');
  }

  _doDash() {
    this._dashing = true;
    this._dash_timer = PHYSICS.dashDuration;
    this._ghost_timer = 0;
    this._streak_timer = 0;
    this._jump_holding = false;
    this._on_wall = null;
    this.body.velocity.x = PHYSICS.dashVelocity * this._facing;
    this.body.velocity.y = 0;
    this._spawnDashGhost();
    AudioManager.playSfx('dash');
  }

  _doDoubleJump() {
    this.body.velocity.y = PHYSICS.jumpVelocity * 0.85;  // slightly weaker than ground jump
    this._jump_holding = true;
    this._jump_hold_timer = PHYSICS.jumpHoldDuration * 0.7;
    this._double_jump_used = true;
    this._jump_buffer_timer = 0;

    // Cyan sparkle burst at player feet
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const g = this.scene.add.graphics();
      g.fillStyle(0x44ffcc, 0.9);
      g.fillCircle(0, 0, 2 + (i % 2));
      g.setPosition(this.x, this.y + 14).setDepth(5);
      this.scene.tweens.add({
        targets:  g,
        x:        g.x + Math.cos(angle) * 18,
        y:        g.y + Math.sin(angle) * 10 - 4,
        alpha:    0,
        duration: 200,
        ease:     'Cubic.Out',
        onComplete: () => g.destroy(),
      });
    }
    AudioManager.playSfx('jump');
  }

  // Called by GameScene when a speed power-up is collected.
  activateSpeedBoost(duration_ms = 8000) {
    this._speed_boost_timer = duration_ms;
  }

  // Called by GameScene when a double-jump power-up is collected.
  activateDoubleJump(duration_ms = 15000) {
    this._double_jump_timer = duration_ms;
    this._double_jump_used  = false;
  }

  // Emits a fading ghost copy of the egg at the current world position.
  _spawnDashGhost() {
    const g = this.scene.add.graphics();
    g.setDepth(4);  // behind the player
    g.fillStyle(0xffffff, 0.30);
    g.fillEllipse(this.x, this.y,
      EGG_W * this._draw_scale_x * 0.92,
      EGG_H * this._draw_scale_y * 0.92);
    this.scene.tweens.add({
      targets: g,
      alpha: 0,
      duration: 260,
      ease: 'Linear',
      onComplete: () => g.destroy(),
    });
  }

  // Emits 3 short horizontal streaks behind the egg during a dash.
  _spawnSpeedLine() {
    const tail_x = this.x - this._facing * EGG_W * 0.4;
    for (let i = 0; i < 3; i++) {
      const oy  = (i - 1) * 6 + ((i * 7) % 5 - 2);  // -8, 0, +8 roughly
      const len = 20 + (i * 11) % 30;                 // 20-48 px

      const g = this.scene.add.graphics();
      g.setDepth(4);
      g.lineStyle(1, 0x88ccff, 0.60);
      g.beginPath();
      g.moveTo(tail_x, this.y + oy);
      g.lineTo(tail_x - this._facing * len, this.y + oy);
      g.strokePath();

      this.scene.tweens.add({
        targets: g,
        alpha: 0,
        duration: 90 + i * 25,
        ease: 'Linear',
        onComplete: () => g.destroy(),
      });
    }
  }

  // Emits small dust puffs at the player's feet on landing.
  _spawnLandingDust() {
    const foot_x = this.x;
    const foot_y = this.y + EGG_H * this._draw_scale_y * 0.5;
    const count  = 6;

    for (let i = 0; i < count; i++) {
      // Spread left and right from centre
      const side    = i % 2 === 0 ? 1 : -1;
      const spread  = side * (4 + Math.floor(i / 2) * 7);
      const dest_y  = foot_y - (10 + (i * 9) % 16);
      const size    = 2 + (i * 5) % 3;

      const g = this.scene.add.graphics();
      g.setDepth(5);
      g.x = foot_x + spread * 0.2;
      g.y = foot_y;
      g.fillStyle(0xccbbaa, 0.65);
      g.fillCircle(0, 0, size);

      this.scene.tweens.add({
        targets:  g,
        x:        foot_x + spread,
        y:        dest_y,
        alpha:    0,
        duration: 220 + (i * 7) % 120,
        ease:     'Cubic.Out',
        onComplete: () => g.destroy(),
      });
    }
  }

  // Fraction 0 (just dashed / on cooldown) → 1 (ready to dash).
  get dashCooldownFraction() {
    if (this._dashing) return 0;
    if (this._dash_cooldown <= 0) return 1;
    return 1 - (this._dash_cooldown / PHYSICS.dashCooldown);
  }

  // Returns true if this container's bounds overlap another game object.
  overlaps(other) {
    // Player always uses its physics body for accurate AABB bounds.
    const pb = this.body;
    const pRect = new Phaser.Geom.Rectangle(pb.x, pb.y, pb.width, pb.height);

    // Other: prefer physics body (enemies, hazards, goal, projectiles).
    // Fall back to getBounds() for objects without a body (Collectible, Checkpoint).
    let oRect;
    if (other.body) {
      const ob = other.body;
      oRect = new Phaser.Geom.Rectangle(ob.x, ob.y, ob.width, ob.height);
    } else {
      oRect = other.getBounds();
    }

    return Phaser.Geom.Intersects.RectangleToRectangle(pRect, oRect);
  }

  _drawEgg(sx = 1.0, sy = 1.0) {
    const g = this._gfx;
    g.clear();

    const w = EGG_W * sx;
    const h = EGG_H * sy;

    // Shield glow ring (drawn behind the egg)
    if (this.health_manager.shielded) {
      const pulse = 0.55 + 0.35 * Math.sin(Date.now() * 0.006);
      g.lineStyle(4, 0x44aaff, pulse);
      g.strokeEllipse(0, 0, w + 10, h + 10);
    }

    // Speed boost tint pulse (orange ring)
    if (this._speed_boost_timer > 0) {
      const pulse = 0.4 + 0.3 * Math.sin(Date.now() * 0.010);
      g.lineStyle(3, 0xff8822, pulse);
      g.strokeEllipse(0, 0, w + 6, h + 6);
    }

    // Double jump aura (cyan, only while available and airborne)
    if (this._double_jump_timer > 0 && !this._double_jump_used && !this._on_ground) {
      const pulse = 0.35 + 0.25 * Math.sin(Date.now() * 0.012);
      g.lineStyle(2, 0x44ffcc, pulse);
      g.strokeEllipse(0, 0, w + 4, h + 4);
    }

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
    } else if (this._eye_state === 'wall') {
      // Wide eyes with pupils glancing toward the wall (in _facing direction).
      const eye_r = 4;
      g.fillStyle(0x222222, 1);
      g.fillCircle(left_eye_x, eye_y, eye_r);
      g.fillCircle(right_eye_x, eye_y, eye_r);
      // Pupils shifted sideways toward the wall
      const px = this._facing * 1.5;
      g.fillStyle(0xffffff, 1);
      g.fillCircle(left_eye_x + px, eye_y - 1, 1);
      g.fillCircle(right_eye_x + px, eye_y - 1, 1);
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
