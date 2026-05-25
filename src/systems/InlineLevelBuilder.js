// InlineLevelBuilder.js -- Builds a playable level from a WORLD_1_LEVELS data entry.
// Returns the same shape as LevelLoader.load() so GameScene can treat both identically.
//
// Tile positions use the same convention as the original _buildLevel():
//   - Solid tiles: rectangle center at (col*T + T/2, row*T + T/2)
//   - One-way tiles: T/4 tall, center at (col*T + T/2, row*T + T/8)
//   - Entities (spawn, goal, enemies, coins): center at (col*T, row*T)

import { PatrolEnemy }      from '../entities/PatrolEnemy.js';
import { Collectible }       from '../entities/Collectible.js';
import { PowerUp }           from '../entities/PowerUp.js';
import { MovingPlatform }    from '../entities/MovingPlatform.js';
import { FallingPlatform }   from '../entities/FallingPlatform.js';
import { JumperEnemy }       from '../entities/JumperEnemy.js';
import { ThrowerEnemy }      from '../entities/ThrowerEnemy.js';
import { Checkpoint }        from '../entities/Checkpoint.js';
import { BossEnemy }         from '../entities/BossEnemy.js';
import { GAME_CONFIG }       from '../config/game.js';

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
      map:              null,
      ground:           scene.physics.add.staticGroup(),
      platforms:        scene.physics.add.staticGroup(),
      oneWayPlatforms:  scene.physics.add.staticGroup(),
      hazards:          scene.physics.add.staticGroup(),
      enemies:          [],
      coins:            [],
      powerups:         [],
      checkpoints:      [],
      boss:             null,
      moving_platforms:  [],
      falling_platforms: [],
      conveyors:         [],  // [{ rect: GameObject, dir: 1|-1 }]
      projectiles:      scene.physics.add.group(),
      spawnX:           data.spawn[0] * T,
      spawnY:           data.spawn[1] * T,
      goal:             null,
    };

    // ── Tile spans ────────────────────────────────────────────────────────────
    (data.ground    || []).forEach(([row, c0, c1]) =>
      this._fillSpan(result.ground, row, c0, c1, T, T, COLORS.ground));

    (data.platforms || []).forEach(([row, c0, c1]) =>
      this._fillSpan(result.platforms, row, c0, c1, T, T, COLORS.platform));

    // One-way: thin (T/4 tall), placed at the TOP of the tile row
    (data.oneway    || []).forEach(([row, c0, c1]) =>
      this._fillSpan(result.oneWayPlatforms, row, c0, c1, T, T / 4, COLORS.oneway, /*y_shift*/ 0));

    // ── Vertical walls: [col, row_start, row_end] ─────────────────────────────
    // Used for wall-jump shafts. Placed into the platforms group (solid, full tile).
    (data.walls || []).forEach(([col, r0, r1]) =>
      this._fillColumn(result.platforms, col, r0, r1));

    // ── Spikes: [col, row] ────────────────────────────────────────────────────
    // row is the SURFACE row (same as the ground/platform the spike sits on).
    // The spike visual points up from the surface and the hitbox overlaps
    // the player's feet when walking past.
    (data.spikes || []).forEach(([col, row]) =>
      this._buildSpike(result.hazards, col, row));

    // ── Moving platforms: [tx0, ty0, tx1, ty1, speed] ─────────────────────────
    (data.moving_platforms || []).forEach(([tx0, ty0, tx1, ty1, speed]) =>
      result.moving_platforms.push(new MovingPlatform(scene, tx0, ty0, tx1, ty1, speed)));

    // ── Falling platforms: [row, c0, c1] ─────────────────────────────────────
    (data.falling_platforms || []).forEach(([row, c0, c1]) =>
      result.falling_platforms.push(new FallingPlatform(scene, row, c0, c1)));

    // ── Conveyor belts: [row, c0, c1, dir]  dir: 1=right, -1=left ────────────
    (data.conveyor || []).forEach(([row, c0, c1, dir]) =>
      this._buildConveyor(result, row, c0, c1, dir));

    // ── Goal (optional -- boss levels have goal: null) ──────────────────────────
    if (data.goal) {
      const [gc, gr] = data.goal;
      const goal = scene.add.rectangle(gc * T, gr * T, T, T * 2, COLORS.goal);
      scene.physics.add.existing(goal, true);
      result.goal = goal;
    }

    // ── Patrol enemies: [col, row, patrol_left_col, patrol_right_col] ─────────
    (data.enemies || []).forEach(([col, row, lc, rc]) => {
      result.enemies.push(new PatrolEnemy(scene, col * T, row * T, lc * T, rc * T));
    });

    // ── Jumper enemies: [col, row] ────────────────────────────────────────────
    (data.jumpers || []).forEach(([col, row]) => {
      result.enemies.push(new JumperEnemy(scene, col * T, row * T));
    });

    // ── Thrower enemies: [col, row, dir]  dir: 1=right, -1=left, 0=auto-aim ──
    (data.throwers || []).forEach(([col, row, dir]) => {
      result.enemies.push(new ThrowerEnemy(scene, col * T, row * T, dir, result.projectiles));
    });

    // ── Coins: [col, row] ─────────────────────────────────────────────────────
    (data.coins || []).forEach(([col, row]) => {
      result.coins.push(new Collectible(scene, col * T, row * T));
    });

    // ── Checkpoints: [col, row] ───────────────────────────────────────────
    (data.checkpoints || []).forEach(([col, row]) => {
      result.checkpoints.push(new Checkpoint(scene, col, row));
    });

    // ── Power-ups: [col, row, type]  type: 'shield'|'speed'|'jump' ───────────
    (data.powerups || []).forEach(([col, row, type]) => {
      result.powerups.push(new PowerUp(scene, col * T, row * T, type));
    });

    // ── Boss: [col, row] ─────────────────────────────────────────────────────
    if (data.boss) {
      const [bc, br] = data.boss;
      const boss = new BossEnemy(scene, bc * T, br * T);
      result.boss = boss;
      result.enemies.push(boss);   // joins the standard enemy overlap loop
    }

    // ── World bounds ──────────────────────────────────────────────────────────
    // Disable the bottom wall so the player can fall into pits; GameScene
    // checks player.y against world_h * T + T to detect pit death.
    scene.physics.world.setBounds(
      0, 0, data.world_w * T, data.world_h * T,
      /*left*/true, /*right*/true, /*up*/true, /*down*/false
    );

    result.world_h = data.world_h;
    result.world_w = data.world_w;
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

  // Creates a column of solid full tiles from row r0 to r1 inclusive.
  // Used for vertical walls in wall-jump shafts.
  _fillColumn(group, col, r0, r1) {
    for (let row = r0; row <= r1; row++) {
      const cx = col * T + T / 2;
      const cy = row * T + T / 2;
      const rect = this.scene.add.rectangle(cx, cy, T, T, COLORS.platform);
      this.scene.physics.add.existing(rect, true);
      group.add(rect);
    }
  }

  // Builds a spike at [col, row].
  // The spike base sits flush with the TOP of the tile row (the surface the
  // player walks on), with triangular tips pointing upward into the player's space.
  _buildSpike(hazard_group, col, row) {
    const scene    = this.scene;
    const base_y   = row * T;           // top of the tile row = walking surface
    const tip_y    = base_y - T / 2;    // tips reach half a tile above the surface
    const num      = 3;                 // spikes per tile
    const sw       = T / num;

    const gfx = scene.add.graphics();
    gfx.fillStyle(0xff3333);
    for (let i = 0; i < num; i++) {
      const x0  = col * T + i * sw + 1;
      const x1  = col * T + (i + 1) * sw - 1;
      const mid = (x0 + x1) / 2;
      gfx.fillTriangle(x0, base_y, x1, base_y, mid, tip_y);
    }

    // Hitbox covers the upper half of the tile row -- overlaps player feet.
    const hx     = col * T + T / 2;
    const hy     = base_y - T / 4;  // center of the hitbox
    const hitbox = scene.add.rectangle(hx, hy, T - 4, T / 2, 0xff0000, 0);
    scene.physics.add.existing(hitbox, true);
    hazard_group.add(hitbox);
  }

  // Builds a conveyor belt spanning col c0 to c1 on the given row.
  // dir: 1 = pushes right, -1 = pushes left.
  // The conveyor is a solid tile that the player can stand on; GameScene
  // applies the push force each frame while the player is on it.
  _buildConveyor(result, row, c0, c1, dir) {
    const scene = this.scene;
    const w     = (c1 - c0 + 1) * T;
    const cx    = c0 * T + w / 2;
    const cy    = row * T + T / 2;

    // Base tile (teal/cyan -- distinct from standard green ground)
    const rect = scene.add.rectangle(cx, cy, w, T, 0x227788);
    scene.physics.add.existing(rect, true);
    result.ground.add(rect);  // player can stand on it

    // Arrow visuals drawn on top
    const gfx    = scene.add.graphics();
    const arr_y  = cy;           // vertical center of tile
    const arr_h  = T * 0.35;    // half-height of arrowhead
    const arr_w  = T * 0.45;    // width of arrowhead
    const step   = T * 1.5;     // one arrow every 1.5 tiles
    const x_start = c0 * T + step / 2;
    const x_end   = (c1 + 1) * T;

    gfx.fillStyle(0x55ccee);
    for (let x = x_start; x < x_end; x += step) {
      if (dir > 0) {
        // Right-pointing: ▶
        gfx.fillTriangle(x - arr_w / 2, arr_y - arr_h, x - arr_w / 2, arr_y + arr_h, x + arr_w / 2, arr_y);
      } else {
        // Left-pointing: ◀
        gfx.fillTriangle(x + arr_w / 2, arr_y - arr_h, x + arr_w / 2, arr_y + arr_h, x - arr_w / 2, arr_y);
      }
    }

    result.conveyors.push({ rect, dir });
  }
}
