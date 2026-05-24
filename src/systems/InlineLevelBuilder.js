// InlineLevelBuilder.js -- Builds a playable level from a WORLD_1_LEVELS data entry.
// Returns the same shape as LevelLoader.load() so GameScene can treat both identically.
//
// Tile positions use the same convention as the original _buildLevel():
//   - Solid tiles: rectangle center at (col*T + T/2, row*T + T/2)
//   - One-way tiles: T/4 tall, center at (col*T + T/2, row*T + T/8)
//   - Entities (spawn, goal, enemies, coins): center at (col*T, row*T)

import { PatrolEnemy } from '../entities/PatrolEnemy.js';
import { Collectible }  from '../entities/Collectible.js';
import { GAME_CONFIG }  from '../config/game.js';

const T = GAME_CONFIG.tileSize;

const COLORS = {
  ground:   0x446644,
  platform: 0x446644,
  oneway:   0x558855,
  goal:     0xffdd44,
};

export class InlineLevelBuilder {
  constructor(scene) {
    this.scene = scene;
  }

  // Builds the level and returns a result object matching LevelLoader.load().
  build(data) {
    const scene = this.scene;

    const result = {
      map:             null,
      ground:          scene.physics.add.staticGroup(),
      platforms:       scene.physics.add.staticGroup(),
      oneWayPlatforms: scene.physics.add.staticGroup(),
      hazards:         scene.physics.add.staticGroup(),
      enemies:         [],
      coins:           [],
      checkpoints:     [],
      spawnX:          data.spawn[0] * T,
      spawnY:          data.spawn[1] * T,
      goal:            null,
    };

    // ── Tile spans ────────────────────────────────────────────────────────────
    (data.ground    || []).forEach(([row, c0, c1]) =>
      this._fillSpan(result.ground, row, c0, c1, T, T, COLORS.ground));

    (data.platforms || []).forEach(([row, c0, c1]) =>
      this._fillSpan(result.platforms, row, c0, c1, T, T, COLORS.platform));

    // One-way: thin (T/4 tall), placed at the TOP of the tile row
    (data.oneway    || []).forEach(([row, c0, c1]) =>
      this._fillSpan(result.oneWayPlatforms, row, c0, c1, T, T / 4, COLORS.oneway, /*y_shift*/ 0));

    // ── Goal ──────────────────────────────────────────────────────────────────
    const [gc, gr] = data.goal;
    const goal = scene.add.rectangle(gc * T, gr * T, T, T * 2, COLORS.goal);
    scene.physics.add.existing(goal, true);
    result.goal = goal;

    // ── Enemies: [col, row, patrol_left_col, patrol_right_col] ────────────────
    (data.enemies || []).forEach(([col, row, lc, rc]) => {
      const enemy = new PatrolEnemy(scene, col * T, row * T, lc * T, rc * T);
      result.enemies.push(enemy);
    });

    // ── Coins: [col, row] ─────────────────────────────────────────────────────
    (data.coins || []).forEach(([col, row]) => {
      result.coins.push(new Collectible(scene, col * T, row * T));
    });

    // ── World bounds ──────────────────────────────────────────────────────────
    scene.physics.world.setBounds(0, 0, data.world_w * T, data.world_h * T);

    return result;
  }

  // Creates a row of solid (or thin) tiles from col c0 to c1 inclusive.
  // y_shift moves the tile down within its row (default centers it in the row).
  _fillSpan(group, row, c0, c1, w, h, color, y_shift = null) {
    // Default: center the tile vertically within its row cell
    const effective_shift = y_shift !== null ? y_shift : (T - h) / 2;
    for (let col = c0; col <= c1; col++) {
      const cx = col * T + w / 2;
      const cy = row * T + effective_shift + h / 2;
      const rect = this.scene.add.rectangle(cx, cy, w, h, color);
      this.scene.physics.add.existing(rect, true);
      group.add(rect);
    }
  }
}
