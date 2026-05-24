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
    };

    // Track the raw jump button separately so we can detect the exact press frame.
    this._jump_pressed_this_frame = false;
    this._prev_jump = false;

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
    });

    // Virtual control state (written by VirtualControls.js)
    this._virtual = {
      left: false,
      right: false,
      down: false,
      jump: false,
    };
  }

  // Called once per frame from GameScene.update().
  update() {
    const k = this._keys;

    this.state.left = k.left.isDown || k.a.isDown || this._virtual.left;
    this.state.right = k.right.isDown || k.d.isDown || this._virtual.right;
    this.state.down = k.down.isDown || k.s.isDown || this._virtual.down;
    this.state.jump =
      k.jump.isDown || k.jump_up.isDown || k.jump_w.isDown || this._virtual.jump;

    this._jump_pressed_this_frame =
      this.state.jump && !this._prev_jump;
    this._prev_jump = this.state.jump;
  }

  // Returns true only on the frame the jump button was first pressed.
  isJumpJustPressed() {
    return this._jump_pressed_this_frame;
  }

  // Called by VirtualControls to update virtual button states.
  setVirtual(key, value) {
    if (key in this._virtual) {
      this._virtual[key] = value;
    }
  }
}
