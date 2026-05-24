// LevelSelectScene.js -- World 1 level select screen.
// Shows four level cards. Locked levels are dimmed; completed levels show a CLEAR badge.
// Tap/click an unlocked card to start that level.

import Phaser from 'phaser';
import { GAME_CONFIG }      from '../config/game.js';
import { WORLD_1_LEVELS, getProgress } from '../config/levels.js';

const { width, height } = GAME_CONFIG;
const CX = width  / 2;
const CY = height / 2;

// Card layout
const CARD_W    = 190;
const CARD_H    = 160;
const CARD_GAP  = 28;
const CARD_Y    = CY - 10;
const TOTAL_W   = WORLD_1_LEVELS.length * CARD_W + (WORLD_1_LEVELS.length - 1) * CARD_GAP;
const CARD_X0   = CX - TOTAL_W / 2 + CARD_W / 2; // center of first card

// Card palette
const PAL = {
  locked:    { bg: 0x222222, border: 0x444444, text: '#555555' },
  unlocked:  { bg: 0x1a3a2a, border: 0x44aa66, text: '#ccffcc' },
  completed: { bg: 0x1a2a3a, border: 0x4488cc, text: '#cceeff' },
};

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  create() {
    const progress = getProgress();

    // ── Background ────────────────────────────────────────────────────────────
    this.add.rectangle(CX, CY, width, height, 0x111111);

    // ── Title ─────────────────────────────────────────────────────────────────
    this.add.text(CX, 70, 'SELECT LEVEL', {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(CX, 110, 'WORLD 1', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#888888',
    }).setOrigin(0.5);

    // ── Level cards ───────────────────────────────────────────────────────────
    WORLD_1_LEVELS.forEach((level, i) => {
      const cx  = CARD_X0 + i * (CARD_W + CARD_GAP);
      const is_unlocked  = progress.unlocked.includes(level.key);
      const is_completed = progress.completed.includes(level.key);

      const state = is_completed ? 'completed' : is_unlocked ? 'unlocked' : 'locked';
      const pal   = PAL[state];

      // Card shadow
      this.add.rectangle(cx + 3, CARD_Y + 3, CARD_W, CARD_H, 0x000000, 0.4);

      // Card background
      const card_bg = this.add.rectangle(cx, CARD_Y, CARD_W, CARD_H, pal.bg);

      // Card border (drawn as a slightly larger rect behind)
      this.add.rectangle(cx, CARD_Y, CARD_W + 4, CARD_H + 4, pal.border)
        .setDepth(-1);

      // Level name  e.g. "1-1"
      this.add.text(cx, CARD_Y - 36, level.name, {
        fontFamily: 'monospace',
        fontSize: '42px',
        color: pal.text,
      }).setOrigin(0.5);

      // Status badge
      if (is_completed) {
        this.add.text(cx, CARD_Y + 28, 'CLEAR', {
          fontFamily: 'monospace',
          fontSize: '22px',
          color: '#88ddff',
        }).setOrigin(0.5);
      } else if (!is_unlocked) {
        this.add.text(cx, CARD_Y + 28, 'LOCKED', {
          fontFamily: 'monospace',
          fontSize: '20px',
          color: '#555555',
        }).setOrigin(0.5);
      }

      // Tap hint on unlocked cards
      if (is_unlocked) {
        this.add.text(cx, CARD_Y + 55, 'TAP TO PLAY', {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#44aa66',
        }).setOrigin(0.5);
      }

      // Make unlocked cards interactive
      if (is_unlocked) {
        card_bg.setInteractive({ useHandCursor: true });

        card_bg.on('pointerover', () => {
          card_bg.setFillStyle(0x2a5a3a);
        });
        card_bg.on('pointerout', () => {
          card_bg.setFillStyle(pal.bg);
        });
        card_bg.on('pointerdown', () => {
          this._startLevel(level.key);
        });
      }
    });

    // ── Back button ───────────────────────────────────────────────────────────
    const back = this.add.text(CX, height - 55, '← BACK TO MENU', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#888888',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    back.on('pointerover',  () => back.setColor('#ffffff'));
    back.on('pointerout',   () => back.setColor('#888888'));
    back.on('pointerdown',  () => this.scene.start('MenuScene'));

    this.input.keyboard.once('keydown-ESC', () => this.scene.start('MenuScene'));
  }

  _startLevel(level_key) {
    this.scene.start('GameScene', { level_key });
  }
}
