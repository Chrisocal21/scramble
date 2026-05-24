# Scramble -- Progress Tracker

**Overall progress:** 32%
**Last updated:** May 22, 2026
**Status:** Active

---

## Phase 1 -- Core Loop (Get It Playable on Mobile)

**Phase progress:** 100%
**Goal:** A playable platformer with tight controls that feels good on a phone in landscape mode.

### Feature 1.1 -- Project Scaffold
**Progress:** 100%

- [x] Initialize Phaser 3 + Vite project
- [x] Configure build pipeline and dev server on localhost:3000
- [x] Set up folder structure (scenes, entities, systems, config)
- [x] Confirm Phaser renders a blank game canvas in the browser
- [x] Confirm the game loads on iPhone 13 Safari in landscape

### Feature 1.2 -- Mobile Landscape Mode
**Progress:** 100%

- [x] Force landscape orientation on mobile devices
- [x] Lock viewport to prevent zoom and scroll bounce
- [x] Size the game canvas to fill the landscape viewport
- [x] Handle orientation change gracefully (show "rotate your device" prompt if portrait)
- [x] Test on iPhone 13 Safari at 60fps

### Feature 1.3 -- Virtual Controls (Mobile)
**Progress:** 100%

- [x] Whole-screen touch zones (hold left half = move left, hold right half = move right)
- [x] Double-tap anywhere = jump (works with simultaneous movement hold)
- [x] MOVEMENT_HOLD_MS threshold prevents tap gestures from flickering direction
- [x] Multi-touch support (move and jump simultaneously)
- [x] Redesigned to classic D-pad cross (left/right arms interactive) + red "A" jump button
- [x] Semi-transparent top band (top 150px) keeps controls off the game view
- [x] Pointer map tracks each finger independently -- no direction-forgetting on slide

### Feature 1.4 -- Keyboard Controls (Desktop)
**Progress:** 100%

- [x] Arrow keys or WASD for movement
- [x] Space bar for jump
- [x] Keyboard and virtual controls use the same InputManager abstraction layer
- [x] Test on desktop Chrome and Firefox

### Feature 1.5 -- Player Movement
**Progress:** 100%

- [x] Acceleration curve for running (not instant max speed)
- [x] Deceleration when input stops (slight slide, not instant stop)
- [x] Variable height jump (short tap = small hop, hold = full arc)
- [x] Separate gravity multiplier for falling (heavier on the way down)
- [x] Terminal velocity cap
- [x] Coyote time (~100ms grace period after walking off a ledge)
- [x] Jump buffering (~120ms before landing)
- [x] All movement values stored as tunable constants in src/config/physics.js

### Feature 1.6 -- The Egg Character
**Progress:** 100%

- [x] Draw egg shape programmatically (no sprite sheet needed yet)
- [x] Two dot eyes that track movement direction
- [x] Eyes go wide at the apex of a big jump
- [x] Eyes daze (X eyes) after taking a hit
- [x] Squash on landing
- [x] Stretch on jump launch
- [x] Ellipse re-drawn at native resolution each frame (no scaling artifacts)

### Feature 1.7 -- Basic Level
**Progress:** 100%

- [x] Single test level with solid ground and platforms
- [x] Tile-based collision (solid tiles the player cannot pass through)
- [x] One-way platforms (land on top, pass through from below)
- [x] One pit (bottomless fall = instant death)
- [x] Start position and end goal flag
- [x] Level length targets 30-60 seconds for a clean run
- [x] Dark background with neutral placeholder colors for tiles

### Feature 1.8 -- Camera
**Progress:** 100%

- [x] Camera follows the player with smooth lerp
- [x] Slight lead in the direction of movement
- [x] Camera stays within level boundaries

### Feature 1.9 -- Patrol Enemy
**Progress:** 100%

- [x] Walks back and forth between patrol boundaries
- [x] Reverses direction at boundaries
- [x] Dies when player stomps from above (player bounce on stomp)
- [x] Damages player on side contact
- [x] State machine: patrol, stunned, dead
- [x] Placeholder visual (orange rectangle, distinct from egg)

### Feature 1.10 -- Coins
**Progress:** 100%

- [x] Collectible coins placed in the test level
- [x] Coin collection on player overlap
- [x] Coin count displayed on the HUD
- [x] Pulse animation on coins (programmatic, staggered phase)

### Feature 1.11 -- HUD
**Progress:** 100%

- [x] Coin count displayed
- [x] HP displayed
- [x] Level number displayed
- [x] Fixed to camera (does not scroll with level)
- [x] Repositioned to bottom strip (dark band, HP left / LEVEL center / COINS right)

### Feature 1.12 -- Health and Lives System
**Progress:** 100%

- [x] One flexible system (HealthManager) with three modes
- [x] Modern mode as default (3 HP, unlimited lives, restart level on death)
- [x] Classic mode (1 HP, 3 lives, game over resets world)
- [x] Hybrid mode (3 HP, limited continues)
- [x] Damage triggers invincibility frames (player flashes)
- [x] Death triggers respawn at level start

### Feature 1.13 -- Death and Respawn
**Progress:** 100%

- [x] Brief pause before respawn (800ms delay)
- [x] Respawn at level start with health reset per mode rules
- [x] Game over screen when lives are depleted (Classic/Hybrid modes)

### Feature 1.14 -- Basic Menus
**Progress:** 100%

- [x] Title screen with game name and "TAP TO START" / Enter
- [x] Pause overlay (translucent, game frozen behind it)
- [x] Pause triggered by Escape key on desktop
- [x] Resume and quit options on pause

---

## Phase 2 -- Level System and Depth

**Phase progress:** 40%
**Goal:** Multiple levels, Tiled integration, more enemies, and the mechanics that add skill expression.

### Feature 2.1 -- Tiled Integration
**Progress:** 100%

- [x] Configure Tiled map editor for Scramble tile sizes and layer conventions
- [x] Load levels from Tiled JSON exports in Phaser
- [x] Separate layers: ground, platforms, hazards, enemies, collectibles, decorations
- [x] Level loader that reads a config and spawns all entities from map data

### Feature 2.2 -- Level Progression
**Progress:** 100%

- [x] Level complete trigger (reach the end flag/goal)
- [x] Level select screen showing available levels and completion status
- [x] 3-4 levels with increasing complexity (World 1) -- 4 inline programmatic levels (w1-l1 to w1-l4)
- [x] Levels unlock sequentially
- [x] Save level progress to local storage (SaveManager key: world1_progress)

### Feature 2.3 -- Hazards
**Progress:** 0%

- [ ] Spikes (damage on contact)
- [ ] Moving platforms (horizontal and vertical paths)
- [ ] Falling platforms (crumble after ~1 second of standing)
- [ ] Conveyor belts (push the player in a direction)

### Feature 2.4 -- More Enemy Types
**Progress:** 0%

- [ ] Jumper enemy (hops at intervals, harder to stomp)
- [ ] Thrower enemy (stationary, launches projectiles)
- [ ] Each enemy type has its own simple state machine

### Feature 2.5 -- Checkpoints
**Progress:** 0%

- [ ] Mid-level checkpoints in longer levels
- [ ] Respawn at last checkpoint instead of level start
- [ ] Visual indicator for activated checkpoints

### Feature 2.6 -- Wall Jump
**Progress:** 0%

- [ ] Wall slide (slow descent when pressing into a wall mid-air)
- [ ] Wall jump (kick off the wall in the opposite direction)
- [ ] Distinct wall-slide pose on the egg
- [ ] Levels designed to use wall jumps for optional paths or required progression

### Feature 2.7 -- Dash
**Progress:** 0%

- [ ] Short burst of horizontal speed on a cooldown
- [ ] Dash button added to virtual controls (right side, below or beside jump)
- [ ] Visual trail effect during dash
- [ ] Cooldown indicator on the HUD or button itself

---

## Phase 3 -- Polish and Juice

**Phase progress:** 0%
**Goal:** Make it feel and sound like a real game.

### Feature 3.1 -- Visual Effects
**Progress:** 20%

- [ ] Parallax scrolling backgrounds (multiple layers at different speeds)
- [ ] Landing dust particles
- [x] Stomp squish + fade on enemy kill
- [x] Coin pop tween (scale-up + fade on collect)
- [x] Screen shake on damage taken
- [ ] Speed lines or motion blur during dash
- [ ] Smooth scene transitions between menus and gameplay

### Feature 3.2 -- Audio
**Progress:** 0%

- [ ] Sound effects: jump, land, stomp, coin, damage, death, level clear, pause
- [ ] Background music for World 1 (sourced or placeholder)
- [ ] Music pauses or ducks on pause screen
- [ ] Volume controls in settings
- [ ] Mute toggle accessible during gameplay

### Feature 3.3 -- Animations
**Progress:** 0%

- [ ] Smooth run cycle on the egg (body tilt, leg-like motion or wobble)
- [ ] Jump arc poses (rising, apex, falling as distinct states)
- [ ] Idle animation (breathing, looking around after standing still)
- [ ] Enemy death animations
- [ ] Level complete celebration animation

### Feature 3.4 -- Settings Screen
**Progress:** 0%

- [ ] Difficulty mode toggle (Classic / Modern / Hybrid)
- [ ] Volume sliders (music, SFX)
- [ ] Mute toggle
- [ ] Settings saved to local storage

---

## Phase 4 -- Boss and Scoring

**Phase progress:** 0%
**Goal:** Complete World 1 with a boss fight and a reason to replay levels.

### Feature 4.1 -- Boss Fight
**Progress:** 0%

- [ ] First boss with attack patterns and vulnerability windows
- [ ] Boss health bar displayed on screen
- [ ] Boss defeat triggers world completion
- [ ] Distinct boss arena level design

### Feature 4.2 -- Power-ups
**Progress:** 0%

- [ ] Shield (absorbs one hit)
- [ ] Speed boost (temporary)
- [ ] Double jump (until death or level end)
- [ ] Power-up visual indicators on the egg and HUD

### Feature 4.3 -- Scoring or Progression System
**Progress:** 0%

- [ ] Decide: score-focused or progression-focused (open question)
- [ ] Track per-level stats: time, deaths, coins, enemies stomped
- [ ] Display end-of-level summary
- [ ] High scores or star ratings stored in local storage
- [ ] "Your best" comparison shown at level end

### Feature 4.4 -- Secrets
**Progress:** 0%

- [ ] Hidden paths or bonus areas in select levels
- [ ] Bonus collectibles in secret areas
- [ ] Secret-found indicator on level select

---

## Phase 5 -- Expansion

**Phase progress:** 0%
**Goal:** More content, more mechanics, more reasons to keep playing.

### Feature 5.1 -- World 2
**Progress:** 0%

- [ ] New visual theme and tileset
- [ ] New enemy types suited to the theme
- [ ] 3-4 levels plus boss
- [ ] Increased difficulty

### Feature 5.2 -- Meta-game
**Progress:** 0%

- [ ] Achievement system (stored in local storage)
- [ ] Total death counter on main menu
- [ ] Unlockable egg skins (cosmetic, earned through play)
- [ ] Speedrun timer toggle

### Feature 5.3 -- Daily Challenge
**Progress:** 0%

- [ ] One procedurally-arranged level per day
- [ ] Leaderboard (requires backend decision)

---

## Session Update Log

| Date | What Moved | New Overall |
|---|---|---|
| May 17, 2026 | Project created. All Phase 1 features and subtasks defined. | 0% |
| May 17, 2026 | Phase 1 complete. Scaffold, egg character, movement physics, test level, camera, patrol enemy, coins, HUD, health system, death/respawn, menus, landscape mode, touch zone controls. | 18% |
| May 17, 2026 | Phase 2.1 complete (LevelLoader + Tiled conventions). Controls redesigned to D-pad + A button in top strip. HUD moved to bottom strip (HP / LEVEL / COINS). Polish: camera shake on hit, coin pop tween, enemy stomp squish, damage iframes + player flash. | 22% |

---

## What to Tackle Next

- [ ] Phase 2.2 -- Level progression: level complete trigger, level select screen, 3-4 World 1 levels
- [ ] Phase 2.3 -- Hazards: spikes, moving platforms, falling platforms, conveyor belts
- [ ] Phase 2.4 -- More enemy types: jumper, thrower
- [ ] Phase 2.5 -- Checkpoints
- [ ] Phase 2.6 -- Wall jump
- [ ] Phase 2.7 -- Dash
