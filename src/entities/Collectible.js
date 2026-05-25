// Collectible.js -- A coin. Pulses in place. Collected on player overlap.

import Phaser from 'phaser';

const COIN_RADIUS = 8;
const PULSE_DURATION = 700; // ms for one full pulse cycle

export class Collectible extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    scene.add.existing(this);

    this.collected = false;
    this._pulse_timer = Math.random() * PULSE_DURATION; // stagger start phase

    this._gfx = scene.add.graphics();
    this.add(this._gfx);
    this._draw(1.0);
  }

  update(time, delta) {
    if (this.collected) return;

    this._pulse_timer += delta;
    const t = (this._pulse_timer % PULSE_DURATION) / PULSE_DURATION;
    const scale = 1.0 + 0.15 * Math.sin(t * Math.PI * 2);
    this._draw(scale);
  }

  collect() {
    this.collected = true;

    // Burst: 7 yellow/gold sparks scatter outward
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      const dist  = 22 + (i * 9) % 18;
      const g = this.scene.add.graphics();
      g.fillStyle(i % 2 === 0 ? 0xffdd44 : 0xffa820, 1.0);
      g.fillCircle(0, 0, 2 + (i % 3));
      g.setPosition(this.x, this.y).setDepth(7);
      this.scene.tweens.add({
        targets:  g,
        x:        this.x + Math.cos(angle) * dist,
        y:        this.y + Math.sin(angle) * dist - 6,
        alpha:    0,
        scaleX:   0.1,
        scaleY:   0.1,
        duration: 220 + (i * 15) % 80,
        ease:     'Cubic.Out',
        onComplete: () => g.destroy(),
      });
    }

    // Pop: scale up and fade out, then destroy
    this.scene.tweens.add({
      targets: this,
      scaleX: 2.4,
      scaleY: 2.4,
      alpha: 0,
      duration: 200,
      ease: 'Cubic.Out',
      onComplete: () => this.destroy(),
    });
  }

  _draw(scale) {
    const g = this._gfx;
    g.clear();
    const r = COIN_RADIUS * scale;
    g.fillStyle(0xffdd44, 1);
    g.fillCircle(0, 0, r);
    g.lineStyle(2, 0xddaa22, 1);
    g.strokeCircle(0, 0, r);
    // Inner highlight
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(-2, -2, r * 0.3);
  }

  getBounds() {
    return new Phaser.Geom.Rectangle(
      this.x - COIN_RADIUS,
      this.y - COIN_RADIUS,
      COIN_RADIUS * 2,
      COIN_RADIUS * 2
    );
  }
}
