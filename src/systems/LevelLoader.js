// LevelLoader.js -- Reads a Tiled JSON tilemap and spawns all level entities.
//
// LAYER CONVENTIONS (must match exactly in Tiled):
//
//   Tile layers (drawn tiles):
//     "ground"       -- solid tiles, full collision
//     "platforms"    -- solid tiles, full collision (semantically a platform)
//     "oneway"       -- one-way platforms (land on top, pass through from below)
//     "hazards"      -- spike tiles, damage on contact
//     "decorations"  -- visual only, no collision
//
//   Object layers (Tiled objects):
//     "entities"     -- spawns enemies, coins, checkpoints, start, goal
//
// ENTITY OBJECT PROPERTIES (set in Tiled Object Properties panel):
//
//   type: "player_start"  -- spawn point (one per level)
//   type: "goal"          -- level end trigger
//   type: "coin"          -- collectible coin
//   type: "checkpoint"    -- mid-level checkpoint
//   type: "patrol_enemy"  -- patrol walker enemy
//     property: patrol_left  (number, world x of left boundary)
//     property: patrol_right (number, world x of right boundary)
//   type: "jumper_enemy"  -- Phase 2.4
//   type: "thrower_enemy" -- Phase 2.4
//
// HOW TO SET UP TILED:
//   1. New Map: Orientation = Orthogonal, Tile size = 32x32
//   2. Infinite map OR fixed size (recommend 60x17 tiles for World 1 levels)
//   3. Create tile layers named exactly as above
//   4. Create one object layer named "entities"
//   5. Export as JSON (File > Export As > JSON map files)
//   6. Save to public/assets/tilemaps/

import { PatrolEnemy } from '../entities/PatrolEnemy.js';
import { Collectible } from '../entities/Collectible.js';
import { GAME_CONFIG } from '../config/game.js';

const T = GAME_CONFIG.tileSize;

// Tile colors used when drawing tiles programmatically.
// Replace with actual tileset textures in Phase 3.
const TILE_COLORS = {
  ground:      0x446644,
  platforms:   0x446644,
  oneway:      0x558855,
  hazards:     0xcc3333,
  decorations: 0x335533,
};

export class LevelLoader {
  constructor(scene) {
    this.scene = scene;
  }

  // Loads a previously-added Tiled JSON tilemap by its Phaser cache key.
  // Returns an object with all the spawned groups and entity references.
  load(map_key) {
    const scene = this.scene;
    const map = scene.make.tilemap({ key: map_key });

    // We draw tiles programmatically for now (no tileset image needed).
    // When real tile art is added, swap this for map.addTilesetImage().

    const result = {
      map,
      ground:          scene.physics.add.staticGroup(),
      platforms:       scene.physics.add.staticGroup(),
      oneWayPlatforms: scene.physics.add.staticGroup(),
      hazards:         scene.physics.add.staticGroup(),
      enemies:         [],
      coins:           [],
      checkpoints:     [],
      spawnX:          T * 2,
      spawnY:          T * 13,
      goal:            null,
    };

    // --- Tile layers ---
    this._loadTileLayer(map, 'ground',      result.ground,          TILE_COLORS.ground);
    this._loadTileLayer(map, 'platforms',   result.platforms,       TILE_COLORS.platforms);
    this._loadTileLayer(map, 'oneway',      result.oneWayPlatforms, TILE_COLORS.oneway, T / 4);
    this._loadTileLayer(map, 'hazards',     result.hazards,         TILE_COLORS.hazards);
    this._loadTileLayer(map, 'decorations', null,                   TILE_COLORS.decorations);

    // --- Entity object layer ---
    const entity_layer = map.getObjectLayer('entities');
    if (entity_layer) {
      entity_layer.objects.forEach((obj) => this._spawnEntity(obj, result));
    }

    // Set world bounds to match the map size
    scene.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    return result;
  }

  // Reads a tile layer by name and creates static physics rectangles for each tile.
  _loadTileLayer(map, layer_name, group, color, tile_height = T) {
    const layer = map.getLayer(layer_name);
    if (!layer) return; // Layer is optional -- skip if not present in this map

    layer.data.forEach((row, row_index) => {
      row.forEach((tile, col_index) => {
        if (!tile || tile.index === -1) return; // Empty tile

        const x = col_index * T;
        const y = row_index * T + (T - tile_height); // Bottom-align short tiles (one-way)
        const rect = this.scene.add.rectangle(
          x + T / 2,
          y + tile_height / 2,
          T,
          tile_height,
          color
        );
        this.scene.physics.add.existing(rect, true);
        if (group) group.add(rect);
      });
    });
  }

  // Spawns a single entity from a Tiled object definition.
  _spawnEntity(obj, result) {
    const scene = this.scene;
    const type = obj.type || (obj.properties && this._getProp(obj, 'type')) || '';

    // Tiled object x/y is the top-left corner of the object rectangle.
    const cx = obj.x + (obj.width  || T) / 2;
    const cy = obj.y + (obj.height || T) / 2;

    switch (type) {
      case 'player_start':
        result.spawnX = cx;
        result.spawnY = cy;
        break;

      case 'goal': {
        const goal = scene.add.rectangle(cx, cy, obj.width || T, obj.height || T * 2, 0xffdd44);
        scene.physics.add.existing(goal, true);
        result.goal = goal;
        break;
      }

      case 'coin':
        result.coins.push(new Collectible(scene, cx, cy));
        break;

      case 'checkpoint':
        result.checkpoints.push({ x: cx, y: cy, activated: false });
        break;

      case 'patrol_enemy': {
        const left  = this._getProp(obj, 'patrol_left')  ?? cx - T * 3;
        const right = this._getProp(obj, 'patrol_right') ?? cx + T * 3;
        const enemy = new PatrolEnemy(scene, cx, cy, left, right);
        result.enemies.push(enemy);
        break;
      }

      default:
        // Unknown type -- skip silently. Log in dev if needed.
        break;
    }
  }

  // Reads a custom property value from a Tiled object.
  _getProp(obj, name) {
    if (!obj.properties) return undefined;
    const prop = obj.properties.find((p) => p.name === name);
    return prop ? prop.value : undefined;
  }
}
