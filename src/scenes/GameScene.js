// GameScene.js -- The main gameplay scene. Runs the level, player, enemies, and HUD.
// Phase 2.2: driven by WORLD_1_LEVELS inline data via InlineLevelBuilder.
//   Start with: this.scene.start('GameScene', { level_key: 'w1-l1' })
//   For Tiled maps (Phase 2.1+): this.scene.start('GameScene', { map_key: 'world1-level1' })
//     (map must be preloaded in BootScene)

import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { PatrolEnemy } from '../entities/PatrolEnemy.js';
import { Collectible } from '../entities/Collectible.js';
import { PowerUp } from '../entities/PowerUp.js';
import { BossEnemy } from '../entities/BossEnemy.js';
import { proj_hit } from '../entities/ThrowerEnemy.js';
import { InputManager } from '../systems/InputManager.js';
import { CameraController } from '../systems/CameraController.js';
import { HealthManager, MODES } from '../systems/HealthManager.js';
import { SaveManager } from '../systems/SaveManager.js';
import { LevelLoader } from '../systems/LevelLoader.js';
import { InlineLevelBuilder } from '../systems/InlineLevelBuilder.js';
import { HUD } from '../ui/HUD.js';
import { VirtualControls } from '../ui/VirtualControls.js';
import { GAME_CONFIG } from '../config/game.js';
import { WORLD_1_LEVELS, markComplete } from '../config/levels.js';
import { CheckpointState } from '../systems/CheckpointState.js';
import { ParallaxBackground } from '../systems/ParallaxBackground.js';
import { AudioManager } from '../systems/AudioManager.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this._level_done = false;
    this._level_time_ms   = 0;    // accumulates in update() only while not paused
    this._deaths          = 0;
    this._enemies_stomped = 0;

    // Systems
    this.input_manager = new InputManager(this);
    this.health_manager = new HealthManager(this, SaveManager.get('difficulty', MODES.MODERN));

    // -- Level routing --
    // Priority: map_key (Tiled JSON) > level_key (inline data) > default w1-l1
    const scene_data = this.scene.settings.data || {};
    const map_key   = scene_data.map_key;
    const level_key = scene_data.level_key || 'w1-l1';

    this._current_level_key = level_key;

    // Clear saved checkpoint when entering a different level than last time.
    if (CheckpointState.level_key !== level_key) {
      CheckpointState.level_key = level_key;
      CheckpointState.x = null;
      CheckpointState.y = null;
    }

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

    this.ground           = lvl.ground;
    this.platforms        = lvl.platforms;
    this.oneWayPlatforms  = lvl.oneWayPlatforms;
    this.hazards          = lvl.hazards;
    this.enemies          = lvl.enemies;
    this.coins            = lvl.coins;
    this._total_coins     = lvl.coins.length;
    this.powerups         = lvl.powerups || [];
    this.boss             = lvl.boss || null;
    this.end_goal         = lvl.goal;
    this.spawnX           = lvl.spawnX;
    this.spawnY           = lvl.spawnY;
    this.moving_platforms  = lvl.moving_platforms;
    this.falling_platforms = lvl.falling_platforms;
    this.conveyors         = lvl.conveyors;  // [{rect, dir}]
    this.projectiles       = lvl.projectiles;
    this.checkpoints       = lvl.checkpoints;
    this.world_h           = lvl.world_h;
    this.world_w           = lvl.world_w;

    // Spawn at last activated checkpoint (or level start if none).
    this.spawnX = CheckpointState.x ?? lvl.spawnX;
    this.spawnY = CheckpointState.y ?? lvl.spawnY;

    // Dark background colour + parallax layers (created before player/enemies so
    // they sit at the lowest depth).
    const T = GAME_CONFIG.tileSize;
    const world_w_px = (this.world_w ?? 60) * T;
    const world_h_px = (this.world_h ?? 17) * T;
    this.cameras.main.setBackgroundColor('#0a0a14');
    new ParallaxBackground(this, world_w_px, world_h_px);

    this.enemies.forEach((e) => e.addColliders(this.ground, this.platforms, this.oneWayPlatforms));

    // Player -- spawns at checkpoint position or level start
    this.player = new Player(this, this.spawnX, this.spawnY, this.input_manager, this.health_manager);
    this.player.addColliders(this.ground, this.platforms, this.oneWayPlatforms);

    // Wire up moving / falling platform colliders (one-way, land from above)
    this.moving_platforms.forEach((mp) => mp.addCollider(this.player));
    this.falling_platforms.forEach((fp) => fp.addCollider(this.player));

    // Wire up conveyor colliders (player can stand on them; ground group already has them)
    // Nothing extra needed -- conveyor rects were added to result.ground in InlineLevelBuilder.

    // Hazard overlap (spikes, etc.) -- manual AABB check matches existing overlap pattern
    // (processed in update() alongside enemies/coins)

    // Projectiles: collide with solid level geometry (destroy on hit)
    this.physics.add.collider(this.projectiles, this.ground, (proj) => {
      if (proj._alive) proj_hit(proj, this);
    });
    this.physics.add.collider(this.projectiles, this.platforms, (proj) => {
      if (proj._alive) proj_hit(proj, this);
    });

    // Camera
    this.cam_controller = new CameraController(this, this.player);

    // Boss: give it the player reference and colliders now that both exist
    if (this.boss) {
      this.boss.setPlayer(this.player);
      this.boss.addColliders(this.ground, this.platforms);
      this._createBossHealthBar();

      // Stomp-land: camera shake + flash
      this.events.on('boss_stomp_land', () => {
        this.cameras.main.shake(300, 0.018);
        this.cameras.main.flash(120, 255, 100, 100);
      });

      // Boss defeated: trigger level complete after brief pause
      this.events.once('boss_defeated', () => {
        this.cameras.main.shake(400, 0.022);
        this.cameras.main.flash(200, 255, 255, 100);
        this.time.delayedCall(500, () => this._levelComplete());
      });
    }

    // HUD
    this.hud = new HUD(this, this.health_manager);

    // Virtual controls (mobile only)
    this.virtual_controls = new VirtualControls(this, this.input_manager);

    // Pause input
    this.input.keyboard.on('keydown-ESC', () => this._pause());

    // M key: toggle mute
    this.input.keyboard.on('keydown-M', () => {
      const muted = AudioManager.toggleMute();
      this.hud.setMuted(muted);
    });

    // Pause/resume music with the scene lifecycle.
    this.events.on('pause',  () => AudioManager.pauseMusic());
    this.events.on('resume', () => AudioManager.resumeMusic());

    // Initialise audio (requires prior user gesture — satisfied by MenuScene tap).
    AudioManager.init();
    AudioManager.startMusic();

    // Sync mute indicator to saved state.
    this.hud.setMuted(AudioManager.muted);

    // Fade in from black on every scene start / restart.
    this.cameras.main.fadeIn(280, 0, 0, 0);
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

    // Update moving platforms and carry player if riding one
    this.moving_platforms.forEach((mp) => {
      mp.update(delta);
      mp.carryPlayer(this.player);
    });

    // Falling platforms -- check if player is standing on any
    this.falling_platforms.forEach((fp) => fp.checkPlayer(this.player));

    // Conveyor belt effect: ensure minimum velocity in belt direction
    const CONVEYOR_SPEED = 80;  // px/s minimum push
    let on_conv = null;
    for (const conv of this.conveyors) {
      const pb = this.player.body;
      const cb = conv.rect.body;
      const near_top  = pb.bottom >= cb.top - 4 && pb.bottom <= cb.bottom + 4;
      const overlap_x = pb.right  >  cb.left     && pb.left  <  cb.right;
      if (near_top && overlap_x && pb.blocked.down) {
        on_conv = conv;
        break;
      }
    }
    if (on_conv) {
      const pb = this.player.body;
      if (on_conv.dir > 0 && pb.velocity.x < CONVEYOR_SPEED) {
        pb.velocity.x = Math.min(pb.velocity.x + 400 * (delta / 1000), CONVEYOR_SPEED);
      } else if (on_conv.dir < 0 && pb.velocity.x > -CONVEYOR_SPEED) {
        pb.velocity.x = Math.max(pb.velocity.x - 400 * (delta / 1000), -CONVEYOR_SPEED);
      }
    }

    this.cam_controller.update(delta);
    this.hud.update(this.player);
    if (!this._level_done) this._level_time_ms += delta;

    // Boss health bar sync
    if (this.boss && this.boss.state !== 'dead') {
      this._updateBossHealthBar();
    }

    // Push dash cooldown fraction to HUD and virtual controls each frame.
    const dash_f = this.player.dashCooldownFraction;
    this.hud.setDashCooldown(dash_f);
    this.virtual_controls.setDashCooldown(dash_f);

    // Player vs enemies
    this.enemies.forEach((enemy) => {
      if (!enemy.active || enemy.state === 'dead') return;
      if (!this.player.overlaps(enemy)) return;

      // Stomp: player falling and above the enemy center
      const player_bottom = this.player.y + 18;
      if (this.player.body.velocity.y > 0 && player_bottom < enemy.y) {
        enemy.stomp(this.player);
        this._enemies_stomped++;
      } else if (enemy.isDangerous()) {
        const hit = this.health_manager.takeDamage(1);
        if (hit) this._flashHit();
      }
    });

    // Player vs coins
    this.coins.forEach((coin) => {
      if (!coin.collected && this.player.overlaps(coin)) {
        this.collectCoin(coin);
      }
    });

    // Player vs power-ups
    this.powerups.forEach((pu) => {
      if (!pu.collected && this.player.overlaps(pu)) {
        this.collectPowerUp(pu);
      }
    });

    // Player vs checkpoints
    this.checkpoints.forEach((cp) => {
      if (cp.state === 'inactive' && this.player.overlaps(cp)) {
        cp.activate();
        CheckpointState.x = cp.x;
        CheckpointState.y = cp.y;
      }
    });

    // Player vs hazards (spikes)
    this.hazards.getChildren().forEach((hazard) => {
      if (this.player.overlaps(hazard)) {
        const hit = this.health_manager.takeDamage(1);
        if (hit) this._flashHit();
      }
    });

    // Player vs projectiles
    this.projectiles.getChildren().forEach((proj) => {
      if (proj._alive && this.player.overlaps(proj)) {
        proj_hit(proj, this);
        const hit = this.health_manager.takeDamage(1);
        if (hit) this._flashHit();
      }
    });

    // Check if player reached the end goal
    if (this.end_goal && this.player.overlaps(this.end_goal)) {
      this._levelComplete();
    }

    // Check if player fell into a pit (below the level floor)
    if (this.player.y > (this.world_h ?? 17) * 32 + 64) {
      this.health_manager.takeDamage(this.health_manager.hp); // instant death
    }
  }

  collectCoin(coin) {
    if (coin.collected) return;
    coin.collect();
    this.health_manager.addCoins(1);
    AudioManager.playSfx('coin');
    this.hud.pulseCoin();

    // Floating "+1" score pop at the coin's world position
    const pop = this.add.text(coin.x, coin.y - 8, '+1', {
      fontFamily: 'monospace',
      fontSize:   '15px',
      color:      '#ffdd44',
      stroke:     '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 1).setDepth(25);

    this.tweens.add({
      targets:    pop,
      y:          pop.y - 42,
      alpha:      0,
      duration:   650,
      ease:       'Cubic.Out',
      onComplete: () => pop.destroy(),
    });
  }

  collectPowerUp(pu) {
    if (pu.collected) return;
    pu.collect();
    AudioManager.playSfx('coin');  // repurpose coin sfx; distinct enough

    const LABELS  = { shield: 'SHIELD!', speed: 'FAST!', jump: '×2 JUMP!' };
    const COLORS  = { shield: '#88ccff', speed: '#ffcc44', jump: '#44ffcc' };
    const label   = LABELS[pu.type]  || '';
    const color   = COLORS[pu.type]  || '#ffffff';

    // Apply effect
    if (pu.type === 'shield') {
      this.health_manager.activateShield();
    } else if (pu.type === 'speed') {
      this.player.activateSpeedBoost(8000);
    } else if (pu.type === 'jump') {
      this.player.activateDoubleJump(15000);
    }

    // Floating label pop
    const pop = this.add.text(pu.x, pu.y - 12, label, {
      fontFamily: 'monospace',
      fontSize:   '17px',
      color,
      stroke:     '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 1).setDepth(25);

    this.tweens.add({
      targets:  pop,
      y:        pop.y - 50,
      alpha:    0,
      duration: 800,
      ease:     'Cubic.Out',
      onComplete: () => pop.destroy(),
    });
  }

  // Red camera flash + shake + damage number pop. Called on every hit that lands.
  _flashHit() {
    this.cameras.main.shake(220, 0.011);
    this.cameras.main.flash(180, 255, 40, 40);
    this.hud.flashDamage();

    // Floating "-1" above the player
    const pop = this.add.text(this.player.x, this.player.y - 24, '−1', {
      fontFamily: 'monospace',
      fontSize:   '20px',
      color:      '#ff3355',
      stroke:     '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 1).setDepth(26);
    this.tweens.add({
      targets:  pop,
      y:        pop.y - 44,
      alpha:    0,
      duration: 640,
      ease:     'Cubic.Out',
      onComplete: () => pop.destroy(),
    });
  }

  // ── Boss health bar ────────────────────────────────────────────────────────

  _createBossHealthBar() {
    const W   = GAME_CONFIG.width;
    const CX  = W / 2;
    const BAR_Y = 18;
    const SEG_W = 26;
    const SEG_H = 14;
    const MAX_HP = 6;
    const total_bar_w = MAX_HP * SEG_W + (MAX_HP - 1) * 3;

    // Dark backdrop pill
    const bg = this.add.graphics().setScrollFactor(0).setDepth(11);
    bg.fillStyle(0x000000, 0.72);
    bg.fillRoundedRect(CX - total_bar_w / 2 - 52, BAR_Y - 10, total_bar_w + 104, 34, 6);
    bg.lineStyle(1, 0xaa2244, 0.6);
    bg.strokeRoundedRect(CX - total_bar_w / 2 - 52, BAR_Y - 10, total_bar_w + 104, 34, 6);

    // Boss name
    this.add.text(CX - total_bar_w / 2 - 46, BAR_Y + 7, 'KING SCRAMBLE', {
      fontFamily: 'monospace', fontSize: '11px', color: '#ff6688',
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(12);

    // HP segment graphics (redrawn in _updateBossHealthBar)
    this._boss_bar_gfx = this.add.graphics().setScrollFactor(0).setDepth(12);
    this._boss_bar_cx  = CX;
    this._boss_bar_y   = BAR_Y;
    this._boss_bar_seg_w = SEG_W;
    this._boss_bar_seg_h = SEG_H;
    this._updateBossHealthBar();
  }

  _updateBossHealthBar() {
    const g      = this._boss_bar_gfx;
    const hp     = this.boss.hp;
    const MAX_HP = 6;
    const SEG_W  = this._boss_bar_seg_w;
    const SEG_H  = this._boss_bar_seg_h;
    const total_w = MAX_HP * SEG_W + (MAX_HP - 1) * 3;
    const sx = this._boss_bar_cx - total_w / 2;
    const sy = this._boss_bar_y - SEG_H / 2;

    g.clear();
    for (let i = 0; i < MAX_HP; i++) {
      const x = sx + i * (SEG_W + 3);
      if (i < hp) {
        // Filled segment — red, with a brighter highlight strip on top
        g.fillStyle(0xcc2233, 1);
        g.fillRect(x, sy, SEG_W, SEG_H);
        g.fillStyle(0xff4466, 0.5);
        g.fillRect(x + 2, sy + 2, SEG_W - 4, 3);
      } else {
        // Spent segment — dark
        g.fillStyle(0x330011, 1);
        g.fillRect(x, sy, SEG_W, SEG_H);
      }
      g.lineStyle(1, 0x880011, 0.8);
      g.strokeRect(x, sy, SEG_W, SEG_H);
    }
  }

  // Freezes the player the moment they die so they can’t keep moving during
  // the restart delay. Called by HealthManager._handleDeath().
  _onPlayerDeath() {
    this._deaths++;
    this.player._dead = true;
    this.player.body.velocity.x = 0;
    this.player.body.velocity.y = 0;
    this.input_manager.disable();
    AudioManager.playSfx('death');
    AudioManager.stopMusic();

    this.cameras.main.flash(500, 255, 50, 50);

    this.tweens.add({
      targets:  this.player,
      scaleX:   1.6,
      scaleY:   0.08,
      duration: 300,
      ease:     'Cubic.Out',
    });
  }

  _levelComplete() {
    if (this._level_done) return;
    this._level_done = true;

    markComplete(this._current_level_key);
    AudioManager.playSfx('level_clear');
    AudioManager.stopMusic();

    CheckpointState.x = null;
    CheckpointState.y = null;
    CheckpointState.level_key = null;

    this.input_manager.disable && this.input_manager.disable();

    // ── Compute stats ───────────────────────────────────────────────────────
    const elapsed_s     = this._level_time_ms / 1000;
    const time_str      = elapsed_s < 60
      ? elapsed_s.toFixed(1) + 's'
      : Math.floor(elapsed_s / 60) + ':' + String(Math.floor(elapsed_s % 60)).padStart(2, '0');
    const coins_got     = this.health_manager.coins;
    const coins_total   = this._total_coins;
    const deaths        = this._deaths;
    const stomped       = this._enemies_stomped;

    // Star rating: 3 = flawless + all coins, 2 = no deaths or ≥75% coins, 1 = survived
    const coin_pct  = coins_total > 0 ? coins_got / coins_total : 1;
    const stars     = (deaths === 0 && coin_pct >= 1.0) ? 3
                    : (deaths === 0 || coin_pct >= 0.75) ? 2 : 1;

    // Personal best (time, lower = better)
    const best_key      = 'best_' + this._current_level_key;
    const prev_time     = SaveManager.get(best_key + '_time', null);
    const is_new_best   = prev_time === null || elapsed_s < parseFloat(prev_time);
    if (is_new_best) SaveManager.set(best_key + '_time', elapsed_s.toFixed(2));
    const prev_stars    = parseInt(SaveManager.get(best_key + '_stars', '0'), 10);
    if (stars > prev_stars) SaveManager.set(best_key + '_stars', String(stars));

    // ── Build overlay ───────────────────────────────────────────────────────
    const W  = GAME_CONFIG.width;
    const H  = GAME_CONFIG.height;
    const CX = W / 2;
    const CY = H / 2;
    const D  = 20;

    // Backdrop
    const backdrop = this.add.rectangle(CX, CY, W, H, 0x000000, 0.75)
      .setScrollFactor(0).setDepth(D).setAlpha(0);
    this.tweens.add({ targets: backdrop, alpha: 1, duration: 300 });

    // Panel
    const panel = this.add.graphics().setScrollFactor(0).setDepth(D + 1).setAlpha(0);
    panel.fillStyle(0x0d0d20, 1);
    panel.fillRoundedRect(CX - 240, CY - 148, 480, 296, 12);
    panel.lineStyle(2, 0x4444aa, 0.8);
    panel.strokeRoundedRect(CX - 240, CY - 148, 480, 296, 12);
    this.tweens.add({ targets: panel, alpha: 1, duration: 220, delay: 120 });

    // Title
    const title = this.add.text(CX, CY - 116, 'LEVEL CLEAR', {
      fontFamily: 'monospace', fontSize: '34px', color: '#ffdd44',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(D + 2)
      .setAlpha(0).setY(CY - 136);
    this.tweens.add({ targets: title, alpha: 1, y: CY - 116, duration: 280, delay: 280, ease: 'Cubic.Out' });

    // Separator line
    const sep = this.add.graphics().setScrollFactor(0).setDepth(D + 2).setAlpha(0);
    sep.lineStyle(1, 0x444466, 0.6);
    sep.lineBetween(CX - 200, CY - 88, CX + 200, CY - 88);
    this.tweens.add({ targets: sep, alpha: 1, duration: 200, delay: 360 });

    // Stat row helper
    const _row = (label, value, badge, row_y, delay, val_color) => {
      const lbl = this.add.text(CX - 180, row_y, label, {
        fontFamily: 'monospace', fontSize: '15px', color: '#7777aa',
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 2).setAlpha(0);
      const val = this.add.text(CX + 180, row_y, value, {
        fontFamily: 'monospace', fontSize: '17px', color: val_color || '#ffffff',
      }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(D + 2).setAlpha(0);
      this.tweens.add({ targets: [lbl, val], alpha: 1, duration: 180, delay, ease: 'Linear' });
      if (badge) {
        const b = this.add.text(CX + 188, row_y, badge, {
          fontFamily: 'monospace', fontSize: '12px', color: '#44ff88',
          stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 2).setAlpha(0);
        this.tweens.add({ targets: b, alpha: 1, duration: 180, delay: delay + 100 });
      }
    };

    _row('TIME',    time_str,                            is_new_best ? 'BEST!' : null, CY - 52, 450, '#ffffff');
    _row('COINS',   coins_got + ' / ' + coins_total,     null,                         CY - 16, 580, '#ffdd44');
    _row('STOMPED', stomped + (stomped === 1 ? ' enemy' : ' enemies'), null,            CY + 20, 710, '#ff8844');
    _row('DEATHS',  String(deaths),
      deaths === 0 ? 'FLAWLESS!' : null, CY + 56, 840, deaths === 0 ? '#44ff88' : '#ff5566');

    // Stars
    for (let i = 0; i < 3; i++) {
      const filled = i < stars;
      const star = this.add.text(CX + (i - 1) * 44, CY + 104, '★', {
        fontFamily: 'monospace', fontSize: '34px',
        color: filled ? '#ffdd44' : '#2a2a3a',
        stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 2).setAlpha(0).setScale(0.1);
      this.tweens.add({
        targets: star, alpha: 1, scaleX: 1.3, scaleY: 1.3,
        duration: 200, delay: 1000 + i * 140, ease: 'Back.Out',
        onComplete: () => {
          if (!star.scene) return;
          this.tweens.add({ targets: star, scaleX: 1, scaleY: 1, duration: 120 });
          if (filled) AudioManager.playSfx('coin');
        },
      });
    }

    // CONTINUE button
    const btn = this.add.text(CX, CY + 148, 'TAP TO CONTINUE', {
      fontFamily: 'monospace', fontSize: '16px', color: '#888899',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 2).setAlpha(0);
    this.tweens.add({ targets: btn, alpha: 1, duration: 400, delay: 1500 });
    // Gentle pulse so it's obviously tappable
    this.time.delayedCall(1900, () => {
      if (!btn.scene) return;
      this.tweens.add({
        targets: btn, alpha: 0.4, duration: 700,
        yoyo: true, repeat: -1, ease: 'Sine.InOut',
      });
    });

    const _go = () => {
      if (this._going_next) return;
      this._going_next = true;
      this.cameras.main.fadeOut(350, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('LevelSelectScene');
      });
    };

    this.time.delayedCall(1200, () => {
      this.input.keyboard.once('keydown-ENTER', _go);
      this.input.keyboard.once('keydown-SPACE', _go);
      this.input.on('pointerdown', _go);
    });
  }

  _pause() {
    AudioManager.playSfx('pause');
    this.scene.pause('GameScene');
    this.scene.launch('PauseScene');
  }
}
