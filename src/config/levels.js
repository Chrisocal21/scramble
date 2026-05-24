// levels.js -- World 1 level registry and progress helpers.
//
// Each level entry holds all data needed to build the level programmatically.
// Data format:
//   world_w / world_h  -- level size in tiles
//   spawn              -- [col, row] player start (pixel center = col*T, row*T)
//   goal               -- [col, row] end-goal center
//   ground             -- array of [row, col_start, col_end] filled tile spans
//   platforms          -- same format, distinct color
//   oneway             -- same format, thin one-way tiles (land-on-top only)
//   enemies            -- array of [col, row, patrol_left_col, patrol_right_col]
//   coins              -- array of [col, row]
//
// Coordinates are always in tiles; InlineLevelBuilder multiplies by GAME_CONFIG.tileSize.

import { SaveManager } from '../systems/SaveManager.js';

// ─────────────────────────────────────────────────────────────────────────────
// Level data
// ─────────────────────────────────────────────────────────────────────────────

export const WORLD_1_LEVELS = [
  // ── 1-1: The Tutorial ──────────────────────────────────────────────────────
  // Recreates the original hand-built test level. One pit, three patrol enemies,
  // coin trails leading the player up onto each platform.
  {
    key: 'w1-l1',
    name: '1-1',
    world_w: 60,
    world_h: 17,
    spawn: [2, 13],
    goal:  [57, 13],
    ground: [
      [14,  0, 19],   // start section
      [14, 23, 59],   // after pit (gap cols 20-22)
    ],
    platforms: [
      [11,  5,  8],   // low, early
      [ 9, 12, 15],   // mid-height
      [11, 25, 29],   // after pit
      [ 8, 33, 37],   // highest
    ],
    oneway: [
      [12,  8, 10],
    ],
    enemies: [
      [10, 13,  8, 13],   // ground patrol
      [26, 10, 25, 29],   // mid platform
      [35,  7, 33, 37],   // high platform
    ],
    coins: [
      [6,10],[7,10],[8,10],
      [13,8],[14,8],
      [26,10],[27,10],[28,10],
      [34,7],[35,7],[36,7],
      [44,13],[45,13],[46,13],
    ],
  },

  // ── 1-2: First Steps Up ────────────────────────────────────────────────────
  // Introduces a rising-then-falling platform chain. Three pits break up the
  // ground; platforms bridge sections and reward players who stay airborne.
  {
    key: 'w1-l2',
    name: '1-2',
    world_w: 72,
    world_h: 17,
    spawn: [2, 13],
    goal:  [69, 13],
    ground: [
      [14,  0, 16],   // start  (gap cols 17-18)
      [14, 19, 34],   // mid    (gap cols 35-36)
      [14, 37, 54],   // late   (gap cols 55-56)
      [14, 57, 71],   // finish
    ],
    platforms: [
      [11,  4,  8],   // rising step 1
      [ 9, 11, 15],   // step 2
      [11, 20, 24],   // over first gap
      [ 8, 27, 31],   // peak
      [10, 34, 38],   // descend (over second gap)
      [ 8, 43, 47],   // high again
      [11, 51, 55],   // over third gap
      [10, 61, 65],   // near goal
    ],
    oneway: [
      [12,  5,  7],
    ],
    enemies: [
      [ 6, 10,  4,  9],   // platform 1
      [21, 10, 20, 24],   // over gap 1
      [28,  7, 27, 31],   // peak
      [44,  7, 43, 47],   // high platform 2
      [52, 10, 51, 55],   // over gap 3
      [62,  9, 61, 65],   // near goal
    ],
    coins: [
      [5,10],[6,10],[7,10],[8,10],
      [12,8],[13,8],[14,8],[15,8],
      [21,10],[22,10],[23,10],
      [28,7],[29,7],[30,7],
      [35,9],[36,9],[37,9],
      [44,7],[45,7],[46,7],
      [52,10],[53,10],[54,10],
      [62,9],[63,9],[64,9],
      [67,13],[68,13],
    ],
  },

  // ── 1-3: The Climb ─────────────────────────────────────────────────────────
  // Longer level, tighter platform spacing, more enemies (one on nearly every
  // platform). Four pits; some platforms span gaps so the upper route is safer.
  {
    key: 'w1-l3',
    name: '1-3',
    world_w: 82,
    world_h: 17,
    spawn: [2, 13],
    goal:  [79, 13],
    ground: [
      [14,  0, 13],   // (gap cols 14-15)
      [14, 16, 30],   // (gap cols 31-33)
      [14, 34, 49],   // (gap cols 50-52)
      [14, 53, 67],   // (gap cols 68-69)
      [14, 70, 81],
    ],
    platforms: [
      [11,  4,  8],
      [ 9, 10, 14],
      [11, 17, 21],
      [ 8, 24, 28],
      [10, 31, 35],   // spans gap 31-33
      [ 8, 38, 42],
      [10, 45, 49],
      [12, 52, 56],   // spans gap 50-52
      [ 9, 59, 63],
      [ 8, 66, 70],   // spans gap 68-69
      [10, 73, 77],
    ],
    oneway: [
      [12,  5,  7],
      [12, 53, 55],
    ],
    enemies: [
      [ 5, 10,  4,  8],
      [11,  8, 10, 14],
      [18, 10, 17, 21],
      [25,  7, 24, 28],
      [32,  9, 31, 35],
      [39,  7, 38, 42],
      [46,  9, 45, 49],
      [60,  8, 59, 63],
      [67,  7, 66, 70],
      [74,  9, 73, 77],
    ],
    coins: [
      [5,10],[6,10],[7,10],
      [11,8],[12,8],[13,8],
      [18,10],[19,10],[20,10],
      [25,7],[26,7],[27,7],
      [32,9],[33,9],[34,9],
      [39,7],[40,7],[41,7],
      [46,9],[47,9],[48,9],
      [53,11],[54,11],[55,11],
      [60,8],[61,8],[62,8],
      [67,7],[68,7],[69,7],
      [74,9],[75,9],[76,9],
      [77,13],[78,13],
    ],
  },

  // ── 1-4: The Gauntlet ──────────────────────────────────────────────────────
  // Five pits, eleven enemies, longest level. Every platform has a patrol on it.
  // Coin density is highest here -- reward for survival.
  {
    key: 'w1-l4',
    name: '1-4',
    world_w: 92,
    world_h: 17,
    spawn: [2, 13],
    goal:  [89, 13],
    ground: [
      [14,  0, 11],   // (gap cols 12-13)
      [14, 14, 26],   // (gap cols 27-28)
      [14, 29, 42],   // (gap cols 43-44)
      [14, 45, 58],   // (gap cols 59-60)
      [14, 61, 74],   // (gap cols 75-76)
      [14, 77, 91],
    ],
    platforms: [
      [11,  3,  7],
      [ 9,  9, 13],
      [ 8, 15, 19],
      [10, 22, 26],
      [ 7, 28, 32],   // spans gap 27-28
      [ 9, 35, 39],
      [11, 41, 45],   // spans gap 43-44
      [ 8, 48, 52],
      [10, 55, 59],   // spans gap 59-60
      [ 8, 62, 66],
      [10, 69, 73],
      [12, 76, 80],   // spans gap 75-76
      [ 9, 83, 87],
    ],
    oneway: [
      [12,  4,  6],
      [12, 42, 44],
    ],
    enemies: [
      [ 4, 10,  3,  7],
      [10,  8,  9, 13],
      [16,  7, 15, 19],
      [23,  9, 22, 26],
      [29,  6, 28, 32],
      [36,  8, 35, 39],
      [42, 10, 41, 45],
      [49,  7, 48, 52],
      [56,  9, 55, 59],
      [63,  7, 62, 66],
      [70,  9, 69, 73],
      [84,  8, 83, 87],
    ],
    coins: [
      [4,10],[5,10],[6,10],
      [10,8],[11,8],[12,8],
      [16,7],[17,7],[18,7],
      [23,9],[24,9],[25,9],
      [29,6],[30,6],[31,6],
      [36,8],[37,8],[38,8],
      [42,10],[43,10],[44,10],
      [49,7],[50,7],[51,7],
      [56,9],[57,9],[58,9],
      [63,7],[64,7],[65,7],
      [70,9],[71,9],[72,9],
      [77,11],[78,11],[79,11],
      [84,8],[85,8],[86,8],
      [87,13],[88,13],
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Progress helpers
// ─────────────────────────────────────────────────────────────────────────────

const SAVE_KEY = 'world1_progress';
const DEFAULT_PROGRESS = () => ({ unlocked: ['w1-l1'], completed: [] });

export function getProgress() {
  return SaveManager.get(SAVE_KEY, DEFAULT_PROGRESS());
}

// Mark a level complete and unlock the next one. Safe to call multiple times.
export function markComplete(level_key) {
  const progress = getProgress();

  if (!progress.completed.includes(level_key)) {
    progress.completed.push(level_key);
  }

  const idx = WORLD_1_LEVELS.findIndex((l) => l.key === level_key);
  if (idx >= 0 && idx < WORLD_1_LEVELS.length - 1) {
    const next = WORLD_1_LEVELS[idx + 1].key;
    if (!progress.unlocked.includes(next)) {
      progress.unlocked.push(next);
    }
  }

  SaveManager.set(SAVE_KEY, progress);
}
