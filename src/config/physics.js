// physics.js -- All player movement and physics tuning values.
// Tweak these constants to change how the game feels without touching logic.

export const PHYSICS = {
  // --- Horizontal movement ---

  // Top running speed in pixels per second.
  runSpeed: 220,

  // How fast the player accelerates to top speed (pixels/sec/sec).
  runAcceleration: 1400,

  // How fast the player decelerates when no input is held (pixels/sec/sec).
  runDeceleration: 1200,

  // --- Jump ---

  // Upward velocity applied on jump press.
  jumpVelocity: -520,

  // How long (ms) the player can hold jump to extend the arc.
  jumpHoldDuration: 180,

  // Additional upward force applied each frame while jump is held.
  jumpHoldForce: 900,

  // --- Gravity ---

  // Base gravity in pixels/sec/sec (applied every frame while airborne).
  gravity: 1600,

  // Multiplier applied on top of gravity when the player is falling (vy > 0).
  // Values above 1.0 make the fall feel heavier than the rise.
  fallMultiplier: 1.6,

  // Maximum downward velocity (terminal velocity) in pixels per second.
  terminalVelocity: 900,

  // --- Coyote time ---

  // Grace period (ms) after walking off a ledge where jump still fires.
  coyoteTime: 100,

  // --- Jump buffering ---

  // How early (ms) before landing a jump input is remembered and fired on touch.
  jumpBuffer: 120,
 
  // --- Wall slide ---

  // Maximum downward speed (px/s) while pressing into a wall in the air.
  // Much slower than terminal velocity so the player can read the situation.
  wallSlideSpeed: 60,

  // --- Wall jump ---

  // Horizontal kick velocity (px/s) away from the wall on a wall jump.
  wallJumpVelocityX: 300,

  // Upward velocity (px/s) applied on a wall jump. Slightly less than a
  // regular jump so wall-hop chains feel distinct but not overpowered.
  wallJumpVelocityY: -480,

  // How long (ms) the player can hold jump after a wall jump to extend the arc.
  // Shorter than a normal jump hold to keep wall hops snappy.
  wallJumpHoldDuration: 130,

  // How long (ms) after a wall jump that horizontal input is ignored.
  // Ensures the kick-off arc is committed before the player can steer back.
  wallJumpLockout: 200,
  // --- Dash ---

  // Horizontal speed (px/s) during the dash burst.
  dashVelocity: 580,

  // How long (ms) the dash burst lasts. Short and snappy.
  dashDuration: 140,

  // How long (ms) before the player can dash again after the burst ends.
  dashCooldown: 1100,};
