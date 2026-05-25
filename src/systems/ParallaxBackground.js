// ParallaxBackground.js — Three procedurally-drawn layers that scroll behind the level.
//
// Layers (all created once, never redrawn — Phaser scrollFactor does the rest):
//   Layer 1 — Star field:        tiny dots, scrollFactor 0.10 (barely moves)
//   Layer 2 — Distant mountains: sine-wave ridge silhouette, scrollFactor 0.25
//   Layer 3 — Near hills:        second ridge silhouette, scrollFactor 0.55
//
// Depths are negative so these layers always sit behind all game objects.

const STAR_COLOR  = 0xffffff;
const MTN1_COLOR  = 0x181838;  // distant peaks — noticeably lighter/bluer than bg
const MTN2_COLOR  = 0x0e1c1c;  // near hills — slightly teal-dark

export class ParallaxBackground {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} world_w  Level width in pixels
   * @param {number} world_h  Level height in pixels
   */
  constructor(scene, world_w, world_h) {
    this._build(scene, world_w, world_h);
  }

  _build(scene, ww, wh) {
    // ── Layer 1: star field ───────────────────────────────────────────────────
    // Deterministic scatter: no Math.random(), layout is stable across reloads.
    const g1 = scene.add.graphics().setDepth(-3).setScrollFactor(0.10);
    const COLS = 28;
    const ROWS = 18;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell_w = ww / COLS;
        const cell_h = wh / ROWS;
        const ox = ((c * 7 + r * 13) % 100) / 100 * cell_w;
        const oy = ((c * 11 + r * 5)  % 100) / 100 * cell_h;
        const big = (c + r) % 7 === 0;
        const alpha = big ? 0.55 : 0.20 + ((c * 3 + r) % 5) * 0.06;
        g1.fillStyle(STAR_COLOR, alpha);
        g1.fillCircle(c * cell_w + ox, r * cell_h + oy, big ? 2 : 1);
      }
    }

    // ── Layer 2: distant mountain ridge ──────────────────────────────────────
    // A continuous polygon whose top edge is a sum of sine waves, filled
    // downward to below the world bottom (game tiles cover the lower area).
    const g2 = scene.add.graphics().setDepth(-2).setScrollFactor(0.25);
    g2.fillStyle(MTN1_COLOR, 1);

    const SAMPLES = 120;
    const pts2 = [];
    for (let i = 0; i <= SAMPLES; i++) {
      const x = (i / SAMPLES) * ww * 1.15;
      // Base sits at 50% of world height; three sine frequencies add mountain detail.
      const y = wh * 0.50
              - wh * 0.20 * Math.sin(x * 0.0030)
              - wh * 0.11 * Math.sin(x * 0.0078 + 1.1)
              - wh * 0.06 * Math.sin(x * 0.0190 + 2.4);
      pts2.push({ x, y });
    }
    pts2.push({ x: ww * 1.15, y: wh * 1.3 });
    pts2.push({ x: 0,         y: wh * 1.3 });
    g2.fillPoints(pts2, true);

    // ── Layer 3: near hill ridge ──────────────────────────────────────────────
    // Slightly larger peaks, different phase — sits lower in the sky.
    const g3 = scene.add.graphics().setDepth(-1).setScrollFactor(0.55);
    g3.fillStyle(MTN2_COLOR, 1);

    const pts3 = [];
    for (let i = 0; i <= SAMPLES; i++) {
      const x = (i / SAMPLES) * ww * 1.25;
      const y = wh * 0.68
              - wh * 0.16 * Math.sin(x * 0.0042 + 0.5)
              - wh * 0.09 * Math.sin(x * 0.0105 + 1.8)
              - wh * 0.05 * Math.sin(x * 0.0270 + 0.9);
      pts3.push({ x, y });
    }
    pts3.push({ x: ww * 1.25, y: wh * 1.3 });
    pts3.push({ x: 0,         y: wh * 1.3 });
    g3.fillPoints(pts3, true);
  }
}
