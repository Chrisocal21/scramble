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
};
