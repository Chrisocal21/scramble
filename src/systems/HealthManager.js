// HealthManager.js -- Tracks HP, lives, coins, and difficulty mode.
// One system, three modes. All game code goes through here.

export const MODES = {
  MODERN: 'modern',   // 3 HP, unlimited lives, restart level on death. No game over.
  CLASSIC: 'classic', // 1 HP, 3 lives, game over when lives run out.
  HYBRID: 'hybrid',   // 3 HP, limited continues, game over when continues run out.
};

const MODE_DEFAULTS = {
  [MODES.MODERN]: { maxHp: 3, lives: Infinity, continues: Infinity },
  [MODES.CLASSIC]: { maxHp: 1, lives: 3, continues: 0 },
  [MODES.HYBRID]: { maxHp: 3, lives: Infinity, continues: 3 },
};

export class HealthManager {
  constructor(scene, mode = MODES.MODERN) {
    this.scene = scene;
    this.mode = mode;

    const defaults = MODE_DEFAULTS[mode];
    this.maxHp = defaults.maxHp;
    this.hp = this.maxHp;
    this.lives = defaults.lives;
    this.continues = defaults.continues;
    this.coins = 0;

    // Invincibility frames tracking
    this.invincible = false;
    this._invincible_timer = null;
  }

  // Called when the player takes damage (enemies, hazards).
  // Returns true if the player actually took damage (not blocked by iframes).
  takeDamage(amount = 1) {
    if (this.invincible) return false;

    this.hp = Math.max(0, this.hp - amount);
    this._startInvincibility();

    if (this.hp <= 0) {
      this._handleDeath();
    }

    return true;
  }

  addCoins(amount = 1) {
    this.coins += amount;
  }

  heal(amount = 1) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  isAlive() {
    return this.hp > 0;
  }

  // Briefly makes the player invincible (called automatically on hit).
  _startInvincibility(duration = 1800) {
    this.invincible = true;
    if (this._invincible_timer) this._invincible_timer.remove();
    this._invincible_timer = this.scene.time.delayedCall(duration, () => {
      this.invincible = false;
    });
  }

  _handleDeath() {
    if (this.mode === MODES.MODERN) {
      // Restart level, full HP, no penalty.
      this.hp = this.maxHp;
      this.scene.time.delayedCall(800, () => {
        this.scene.scene.restart();
      });
    } else if (this.mode === MODES.CLASSIC) {
      this.lives -= 1;
      if (this.lives <= 0) {
        this.scene.time.delayedCall(800, () => {
          this.scene.scene.start('GameOverScene', { level_key: this.scene._current_level_key || 'w1-l1' });
        });
      } else {
        this.hp = this.maxHp;
        this.scene.time.delayedCall(800, () => {
          this.scene.scene.restart();
        });
      }
    } else if (this.mode === MODES.HYBRID) {
      this.hp = this.maxHp;
      this.continues -= 1;
      if (this.continues < 0) {
        this.scene.time.delayedCall(800, () => {
          this.scene.scene.start('GameOverScene', { level_key: this.scene._current_level_key || 'w1-l1' });
        });
      } else {
        this.scene.time.delayedCall(800, () => {
          this.scene.scene.restart();
        });
      }
    }
  }
}
