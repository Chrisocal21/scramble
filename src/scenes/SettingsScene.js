// SettingsScene.js -- Settings overlay. Launched on top of MenuScene or PauseScene.
// The calling scene stays active underneath; stopping this scene reveals it again.
// Data: { from: 'MenuScene' | 'PauseScene' }

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/game.js';
import { MODES } from '../systems/HealthManager.js';
import { AudioManager } from '../systems/AudioManager.js';
import { SaveManager } from '../systems/SaveManager.js';

const W  = GAME_CONFIG.width;
const H  = GAME_CONFIG.height;
const CX = W / 2;
const CY = H / 2;

const DIFF_DESCS = {
  [MODES.MODERN]:  '3 HP  ·  unlimited lives  ·  restart level on death',
  [MODES.CLASSIC]: '1 HP  ·  3 lives  ·  game over when lives run out',
  [MODES.HYBRID]:  '3 HP  ·  3 continues  ·  game over when continues run out',
};

const S = (size, color) => ({ fontFamily: 'monospace', fontSize: `${size}px`, color });

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SettingsScene' });
  }

  create() {
    // ── Background dim ────────────────────────────────────────────────────────
    this.add.rectangle(CX, CY, W, H, 0x000000, 0.74);

    // Panel
    const PW = 620, PH = 304;
    this.add.rectangle(CX, CY, PW, PH, 0x0c0c1e, 1);
    this.add.rectangle(CX, CY, PW, PH).setFillStyle(0, 0).setStrokeStyle(1, 0x2a3a5a, 1);

    // Title
    this.add.text(CX, CY - 128, 'SETTINGS', S(28, '#ffffff')).setOrigin(0.5);

    // Thin rule under title
    this.add.graphics().lineStyle(1, 0x1e2e4a, 1).lineBetween(CX - 260, CY - 108, CX + 260, CY - 108);

    // ── DIFFICULTY ────────────────────────────────────────────────────────────
    this.add.text(CX - 270, CY - 78, 'DIFFICULTY', S(13, '#555577')).setOrigin(0, 0.5);

    this._mode = SaveManager.get('difficulty', MODES.MODERN);

    const modes  = [MODES.MODERN, MODES.CLASSIC, MODES.HYBRID];
    const labels = ['MODERN', 'CLASSIC', 'HYBRID'];
    const xs     = [CX - 165, CX, CX + 165];

    this._diff_els = modes.map((mode, i) => {
      const t = this.add
        .text(xs[i], CY - 48, labels[i], S(20, '#ffffff'))
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => this._setMode(mode));
      t.on('pointerover', () => { if (mode !== this._mode) t.setColor('#888888'); });
      t.on('pointerout',  () => this._refreshDiff());
      return { t, mode };
    });

    this._bar  = this.add.graphics();
    this._desc = this.add.text(CX, CY - 12, '', S(13, '#4a5070')).setOrigin(0.5);
    this._refreshDiff();

    // Rule between sections
    this.add.graphics().lineStyle(1, 0x1e2e4a, 1).lineBetween(CX - 260, CY + 16, CX + 260, CY + 16);

    // ── AUDIO ─────────────────────────────────────────────────────────────────
    this.add.text(CX - 270, CY + 42, 'AUDIO', S(13, '#555577')).setOrigin(0, 0.5);

    this._snd_btn = this.add
      .text(CX, CY + 72, '', S(22, '#aaffaa'))
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this._snd_btn.on('pointerdown', () => { AudioManager.toggleMute(); this._refreshAudio(); });
    this._snd_btn.on('pointerover', () => this._snd_btn.setAlpha(0.75));
    this._snd_btn.on('pointerout',  () => this._snd_btn.setAlpha(1));
    this._refreshAudio();

    // ── BACK ──────────────────────────────────────────────────────────────────
    const back = this.add
      .text(CX, CY + 122, '← BACK', S(22, '#888888'))
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this._close());
    back.on('pointerover', () => back.setColor('#cccccc'));
    back.on('pointerout',  () => back.setColor('#888888'));

    this.input.keyboard.once('keydown-ESC', () => this._close());
  }

  _setMode(mode) {
    this._mode = mode;
    SaveManager.set('difficulty', mode);
    this._refreshDiff();
  }

  _refreshDiff() {
    this._diff_els.forEach(({ t, mode }) => {
      t.setColor(mode === this._mode ? '#ffffff' : '#3a3a55');
    });
    this._desc.setText(DIFF_DESCS[this._mode]);

    // Blue underline under the selected option
    const sel = this._diff_els.find(d => d.mode === this._mode);
    this._bar.clear();
    if (sel) {
      const bx = sel.t.x;
      const by = sel.t.y + sel.t.height / 2 + 5;
      const hw = sel.t.width / 2 + 4;
      this._bar.lineStyle(2, 0x4488ff, 1);
      this._bar.lineBetween(bx - hw, by, bx + hw, by);
    }
  }

  _refreshAudio() {
    const muted = AudioManager.muted;
    this._snd_btn.setText(muted ? 'SOUND: OFF' : 'SOUND: ON ');
    this._snd_btn.setColor(muted ? '#ff6666' : '#aaffaa');
  }

  _close() {
    this.scene.stop('SettingsScene');
  }
}
