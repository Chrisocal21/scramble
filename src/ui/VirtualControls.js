// VirtualControls.js -- On-screen controls for mobile.
//
// Layout: two solid side panels flank the game view.
//   Left panel  (x 0–160):  D-pad cross  — left half = move left, right half = move right
//   Right panel (x 976–1136): A button   — anywhere in panel = jump
//
// No overlap with the game view whatsoever.

import { GAME_CONFIG } from '../config/game.js';

const PW = GAME_CONFIG.controlPanelWidth; // 160 — panel width
const CW = GAME_CONFIG.width;             // 1136
const CH = GAME_CONFIG.height;            // 540

// --- D-pad geometry (centered in left panel) ---
const DP_CX    = PW / 2;   // 80
const DP_CY    = CH / 2;   // 270
const DP_THICK = 44;
const DP_LEN   = 46;       // arm length (fits within 160px panel)
const DP_RAD   = 8;

// --- A button geometry (centered in right panel) ---
const A_CX = CW - PW / 2;  // 1056
const A_CY = CH / 2;        // 270
const A_R  = 46;

// --- Hit areas: full-height half-panel splits so the whole panel is tappable ---
// Left half of left panel  = move left
// Right half of left panel = move right
// Entire right panel       = jump
const BTN = {
  left:  { x: PW * 0.25,      y: CH / 2, w: PW * 0.5, h: CH },
  right: { x: PW * 0.75,      y: CH / 2, w: PW * 0.5, h: CH },
  jump:  { x: CW - PW * 0.5,  y: CH / 2, w: PW,        h: CH },
};

// --- Colors ---
const DPAD_IDLE  = 0.22;
const DPAD_PRESS = 0.80;
const A_IDLE     = 0.22;
const A_PRESS    = 0.80;
const A_COLOR    = 0xdd3333;

export class VirtualControls {
  constructor(scene, input_manager) {
    this.scene         = scene;
    this.input_manager = input_manager;

    this._pointer_map = new Map();

    if (!scene.sys.game.device.input.touch) return;

    // Left panel — solid black (touch/mobile only)
    scene.add.rectangle(PW / 2, CH / 2, PW, CH, 0x000000, 1)
      .setScrollFactor(0).setDepth(19);
    // Right panel — solid black
    scene.add.rectangle(CW - PW / 2, CH / 2, PW, CH, 0x000000, 1)
      .setScrollFactor(0).setDepth(19);
    // Inner edge lines
    const edges = scene.add.graphics().setScrollFactor(0).setDepth(19);
    edges.lineStyle(1, 0xffffff, 0.18);
    edges.lineBetween(PW,      0, PW,      CH);
    edges.lineBetween(CW - PW, 0, CW - PW, CH);

    this._create();
  }

  _create() {
    const scene = this.scene;

    // Static d-pad background -- up/down arms + center square, always visible
    const dpad_bg = scene.add.graphics().setScrollFactor(0).setDepth(20);
    this._drawDpadBg(dpad_bg, 0.18);
    this._dpad_bg = dpad_bg;

    // Per-button gfx for interactive arm highlights
    this._btns = {};
    for (const name of ['left', 'right', 'jump']) {
      const gfx = scene.add.graphics().setScrollFactor(0).setDepth(21);
      this._btns[name] = { gfx, pressed: false };
      this._draw(name, false);
    }

    // "A" label on the jump button
    this._a_label = scene.add.text(A_CX, A_CY, 'A', {
      fontSize: '38px', color: '#ffffff', fontFamily: 'sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(22).setAlpha(0.90);

    scene.input.on('pointerdown', (p) => this._onDown(p));
    scene.input.on('pointermove', (p) => this._onMove(p));
    scene.input.on('pointerup',   (p) => this._onUp(p));
    scene.input.on('pointerout',  (p) => this._onUp(p));
  }

  // Static d-pad skeleton: vertical bar (up/down) + center square
  _drawDpadBg(gfx, alpha) {
    gfx.clear();
    gfx.fillStyle(0xffffff, alpha);
    // Vertical bar (up + down arms + center)
    gfx.fillRoundedRect(DP_CX - DP_THICK / 2, DP_CY - DP_LEN - DP_THICK / 2,
                        DP_THICK, DP_LEN * 2 + DP_THICK, DP_RAD);
    // Horizontal bar (left + right arms + center, drawn on top)
    gfx.fillRoundedRect(DP_CX - DP_LEN - DP_THICK / 2, DP_CY - DP_THICK / 2,
                        DP_LEN * 2 + DP_THICK, DP_THICK, DP_RAD);
  }

  _draw(name, pressed) {
    const gfx = this._btns[name].gfx;
    gfx.clear();

    if (name === 'left' || name === 'right') {
      // Highlight only the relevant horizontal arm
      const alpha = pressed ? DPAD_PRESS : 0;
      if (alpha === 0) return;
      gfx.fillStyle(0xffffff, alpha);
      const arm_x = name === 'left'
        ? DP_CX - DP_LEN - DP_THICK / 2   // left arm start
        : DP_CX + DP_THICK / 2;            // right arm start
      gfx.fillRoundedRect(arm_x, DP_CY - DP_THICK / 2, DP_LEN, DP_THICK, DP_RAD);
    } else {
      // A button circle
      const alpha  = pressed ? A_PRESS : A_IDLE;
      const color  = pressed ? A_COLOR : 0xffffff;
      gfx.fillStyle(color, alpha);
      gfx.fillCircle(A_CX, A_CY, A_R);
      gfx.lineStyle(2, 0xffffff, pressed ? 0.90 : 0.40);
      gfx.strokeCircle(A_CX, A_CY, A_R);
    }
  }

  _hit(x, y) {
    for (const [name, b] of Object.entries(BTN)) {
      if (x >= b.x - b.w / 2 && x <= b.x + b.w / 2 &&
          y >= b.y - b.h / 2 && y <= b.y + b.h / 2) return name;
    }
    return null;
  }

  _onDown(ptr) {
    const name = this._hit(ptr.x, ptr.y);
    if (!name) return;
    this._pointer_map.set(ptr.id, name);
    this._press(name);
  }

  _onMove(ptr) {
    const prev = this._pointer_map.get(ptr.id);
    if (!prev) return;
    const next = this._hit(ptr.x, ptr.y);
    if (next === prev) return;
    this._release(prev);
    this._pointer_map.delete(ptr.id);
    if (next) {
      this._pointer_map.set(ptr.id, next);
      this._press(next);
    }
  }

  _onUp(ptr) {
    const name = this._pointer_map.get(ptr.id);
    if (!name) return;
    this._pointer_map.delete(ptr.id);
    this._release(name);
  }

  _press(name) {
    this._btns[name].pressed = true;
    this._draw(name, true);
    this.input_manager.setVirtual(name, true);
  }

  _release(name) {
    this._btns[name].pressed = false;
    this._draw(name, false);
    this.input_manager.setVirtual(name, false);
  }

  update() {}
}



