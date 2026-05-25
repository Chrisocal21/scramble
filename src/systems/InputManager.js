// InputManager.js -- Unified input layer.
// Both keyboard and virtual controls write into the same state object.
// All game code reads from here -- never from Phaser input directly.

import Phaser from 'phaser';

export class InputManager {
  constructor(scene) {
    this.scene = scene;

    // Current frame input state. True = held this frame.
    this.state = {
      left: false,
      right: false,
      down: false,
      jump: false,
      dash: false,
    };

    // Track the raw jump button separately so we can detect the exact press frame.
    this._jump_pressed_this_frame = false;
    this._prev_jump = false;

    // Track the raw dash button separately.
    this._dash_pressed_this_frame = false;
    this._prev_dash = false;

    // Keyboard bindings
    this._keys = scene.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
      jump_up: Phaser.Input.Keyboard.KeyCodes.UP,
      jump_w: Phaser.Input.Keyboard.KeyCodes.W,
      dash_shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      dash_z: Phaser.Input.Keyboard.KeyCodes.Z,
    });

    // Virtual control state (written by VirtualControls.js)
    this._virtual = {
      left: false,
      right: false,
      down: false,
      jump: false,
      dash: false,
    };

    this.disabled = false;
  }

  // Called once per frame from GameScene.update().
  update() {
    if (this.disabled) {
      this.state.left  = false;
      this.state.right = false;
      this.state.down  = false;
      this.state.jump  = false;
      this._jump_pressed_this_frame = false;
      this._prev_jump = false;
      return;
    }
    const k = this._keys;

    this.state.left = k.left.isDown || k.a.isDown || this._virtual.left;
    this.state.right = k.right.isDown || k.d.isDown || this._virtual.right;
    this.state.down = k.down.isDown || k.s.isDown || this._virtual.down;
    this.state.jump =
      k.jump.isDown || k.jump_up.isDown || k.jump_w.isDown || this._virtual.jump;
    this.state.dash =
      k.dash_shift.isDown || k.dash_z.isDown || this._virtual.dash;

    this._jump_pressed_this_frame =
      this.state.jump && !this._prev_jump;
    this._prev_jump = this.state.jump;

    this._dash_pressed_this_frame =
      this.state.dash && !this._prev_dash;
    this._prev_dash = this.state.dash;
  }

  // Returns true only on the frame the jump button was first pressed.
  isJumpJustPressed() {
    return this._jump_pressed_this_frame;
  }

  // Returns true only on the frame the dash button was first pressed.
  isDashJustPressed() {
    return this._dash_pressed_this_frame;
  }

  disable() { this.disabled = true; }
  enable()  { this.disabled = false; }

  // Called by VirtualControls to update virtual button states.
  setVirtual(key, value) {
    if (key in this._virtual) {
      this._virtual[key] = value;
    }
  }
}
