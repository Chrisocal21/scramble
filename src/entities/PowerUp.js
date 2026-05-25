// PowerUp.js -- Floating orb pickup. Types: 'shield' | 'speed' | 'jump'
//
//  shield  -- absorbs the next 1 hit (blue orb)
//  speed   -- run speed ×1.6 for 8 seconds (orange orb)
//  jump    -- grants one extra mid-air jump for 15 seconds (cyan orb)

import Phaser from 'phaser';

const RADIUS = 10;
const BOB_DURATION = 900;   // ms for one full bob cycle

const TYPE_COLORS = {
  shield: { main: 0x44aaff, glow: 0x88ccff },
  speed:  { main: 0xff8822, glow: 0xffcc44 },
  jump:   { main: 0x44ffcc, glow: 0x88ffee },
};

export class PowerUp extends Phaser.GameObjects.Container {
  constructor(scene, x, y, type) {
    super(scene, x, y);
    scene.add.existing(this);

    this.type      = type;
    this.collected = false;

    this._bob_timer = Math.random() * BOB_DURATION;   // stagger phase

    this._gfx = scene.add.graphics();
    this.add(this._gfx);
    this._draw(0);
  }

  update(time, delta) {
    if (this.collected) return;
    this._bob_timer += delta;
    const t = (this._bob_timer % BOB_DURATION) / BOB_DURATION;
    this._draw(Math.sin(t * Math.PI * 2));
  }

  collect() {
    this.collected = true;
    const cols = TYPE_COLORS[this.type] || TYPE_COLORS.shield;

    // Burst: 8 colored sparks
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const dist  = 24 + (i * 7) % 16;
      const g = this.scene.add.graphics();
      g.fillStyle(i % 2 === 0 ? cols.main : cols.glow, 1.0);
      g.fillCircle(0, 0, 3);
      g.setPosition(this.x, this.y).setDepth(7);

      this.scene.tweens.add({
        targets:  g,
        x:        this.x + Math.cos(angle) * dist,
        y:        this.y + Math.sin(angle) * dist - 8,
        alpha:    0,
        scaleX:   0.1,
        scaleY:   0.1,
        duration: 260 + (i * 13) % 80,
        ease:     'Cubic.Out',
        onComplete: () => g.destroy(),
      });
    }

    // Scale-pop + fade out
    this.scene.tweens.add({
      targets:  this,
      scaleX:   2.2,
      scaleY:   2.2,
      alpha:    0,
      duration: 200,
      ease:     'Cubic.Out',
      onComplete: () => this.destroy(),
    });
  }

  // Returns an AABB so Player.overlaps() works via the getBounds() path.
  getBounds() {
    return new Phaser.Geom.Rectangle(
      this.x - RADIUS,
      this.y - RADIUS,
      RADIUS * 2,
      RADIUS * 2
    );
  }

  // ── Private ────────────────────────────────────────────────────────────────

  _draw(bob_sin) {
    const g    = this._gfx;
    const cols = TYPE_COLORS[this.type] || TYPE_COLORS.shield;
    const yo   = bob_sin * 3;   // −3…+3 px vertical bob

    g.clear();

    // Outer glow ring
    g.lineStyle(3, cols.glow, 0.45);
    g.strokeCircle(0, yo, RADIUS + 3);

    // Main orb body
    g.fillStyle(cols.main, 1.0);
    g.fillCircle(0, yo, RADIUS);

    // Shine spot
    g.fillStyle(0xffffff, 0.42);
    g.fillCircle(-3, yo - 3, RADIUS * 0.34);

    // Type symbol (white)
    g.fillStyle(0xffffff, 0.92);
    if (this.type === 'shield') {
      // Shield chevron
      g.fillTriangle(-4, yo - 2,  4, yo - 2,  0, yo + 5);
    } else if (this.type === 'speed') {
      // Lightning bolt (two triangles)
      g.fillTriangle( 2, yo - 5, -1, yo,  2, yo);
      g.fillTriangle(-2, yo,      1, yo + 5, -2, yo + 1);
    } else if (this.type === 'jump') {
      // Double up-arrow
      g.fillTriangle(0, yo - 5, -4, yo,      4, yo);
      g.fillTriangle(0, yo - 1, -3, yo + 4,  3, yo + 4);
    }
  }
}
