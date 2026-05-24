// GameScene.js -- The main gameplay scene. Runs the level, player, enemies, and HUD.
// Phase 2.2: driven by WORLD_1_LEVELS inline data via InlineLevelBuilder.
//   Start with: this.scene.start('GameScene', { level_key: 'w1-l1' })
//   For Tiled maps (Phase 2.1+): this.scene.start('GameScene', { map_key: 'world1-level1' })
//     (map must be preloaded in BootScene)

import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { PatrolEnemy } from '../entities/PatrolEnemy.js';
import { Collectible } from '../entities/Collectible.js';
import { InputManager } from '../systems/InputManager.js';
import { CameraController } from '../systems/CameraController.js';
import { HealthManager } from '../systems/HealthManager.js';
import { LevelLoader } from '../systems/LevelLoader.js';
import { InlineLevelBuilder } from '../systems/InlineLevelBuilder.js';
import { HUD } from '../ui/HUD.js';
import { VirtualControls } from '../ui/VirtualControls.js';
import { GAME_CONFIG } from '../config/game.js';
import { WORLD_1_LEVELS, markComplete } from '../config/levels.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this._level_done = false;

    // Systems
    this.input_manager = new InputManager(this);
    this.health_manager = new HealthManager(this);

    // -- Level routing --
    // Priority: map_key (Tiled JSON) > level_key (inline data) > default w1-l1
    const scene_data = this.scene.settings.data || {};
    const map_key   = scene_data.map_key;
    const level_key = scene_data.level_key || 'w1-l1';

    this._current_level_key = level_key;

    let lvl;
    if (map_key) {
      // Tiled JSON map (preloaded in BootScene)
      lvl = new LevelLoader(this).load(map_key);
      this._current_level_key = map_key;
    } else {
      // Inline programmatic level
      const data = WORLD_1_LEVELS.find((l) => l.key === level_key) || WORLD_1_LEVELS[0];
      lvl = new InlineLevelBuilder(this).build(data);
    }

    this.ground          = lvl.ground;
    this.platforms       = lvl.platforms;
    this.oneWayPlatforms = lvl.oneWayPlatforms;
    this.enemies         = lvl.enemies;
    this.coins           = lvl.coins;
    this.end_goal        = lvl.goal;
    this.spawnX          = lvl.spawnX;
    this.spawnY          = lvl.spawnY;

    this.enemies.forEach((e) => e.addColliders(this.ground, this.platforms, this.oneWayPlatforms));

    // Player -- spawns at the level start position
    this.player = new Player(this, this.spawnX, this.spawnY, this.input_manager, this.health_manager);
    this.player.addColliders(this.ground, this.platforms, this.oneWayPlatforms);

    // Camera
    this.cam_controller = new CameraController(this, this.player);

    // HUD
    this.hud = new HUD(this, this.health_manager);

    // Virtual controls (mobile only)
    this.virtual_controls = new VirtualControls(this, this.input_manager);

    // Pause input
    this.input.keyboard.on('keydown-ESC', () => this._pause());
  }

  update(time, delta) {
    this.input_manager.update();
    this.virtual_controls.update();
    this.player.update(time, delta);

    // Update enemies
    this.enemies.forEach((e) => {
      if (e.active) e.update(time, delta);
    });

    // Update coins
    this.coins.forEach((c) => {
      if (!c.collected) c.update(time, delta);
    });

    this.cam_controller.update(delta);
    this.hud.update();

    // Player vs enemies
    this.enemies.forEach((enemy) => {
      if (!enemy.active || enemy.state === 'dead') return;
      if (!this.player.overlaps(enemy)) return;

      // Stomp: player falling and above the enemy center
      const player_bottom = this.player.y + 18;
      if (this.player.body.velocity.y > 0 && player_bottom < enemy.y) {
        enemy.stomp(this.player);
      } else if (enemy.isDangerous()) {
        const hit = this.health_manager.takeDamage(1);
        if (hit) this.cameras.main.shake(220, 0.009);
      }
    });

    // Player vs coins
    this.coins.forEach((coin) => {
      if (!coin.collected && this.player.overlaps(coin)) {
        this.collectCoin(coin);
      }
    });

    // Check if player reached the end goal
    if (this.end_goal && this.player.overlaps(this.end_goal)) {
      this._levelComplete();
    }

    // Check if player fell into a pit (below the level floor)
    if (this.player.y > 16 * 32 + 64) {
      this.health_manager.takeDamage(this.health_manager.hp); // instant death
    }
  }

  collectCoin(coin) {
    if (coin.collected) return;
    coin.collect();
    this.health_manager.addCoins(1);
  }

  _levelComplete() {
    if (this._level_done) return;
    this._level_done = true;

    // Save progress and unlock the next level
    markComplete(this._current_level_key);

    // Freeze player input
    this.input_manager.disable && this.input_manager.disable();

    // Overlay
    const { width, height } = GAME_CONFIG;
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.55)
      .setScrollFactor(0).setDepth(20);

    this.add.text(width / 2, height / 2 - 24, 'LEVEL CLEAR!', {
      fontFamily: 'monospace',
      fontSize: '52px',
      color: '#ffdd44',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(21);

    this.add.text(width / 2, height / 2 + 40, 'Coins: ' + this.health_manager.coins, {
      fontFamily: 'monospace',
      fontSize: '26px',
      color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(21);

    this.time.delayedCall(2200, () => {
      this.scene.start('LevelSelectScene');
    });
  }

  _pause() {
    this.scene.pause('GameScene');
    this.scene.launch('PauseScene');
  }
}
