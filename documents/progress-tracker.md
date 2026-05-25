# Scramble — Build Progress

**86% complete** | Updated May 25, 2026 | Active

---

## Phases at a Glance

| # | Phase | Done / Total | Progress |
|---|-------|-------------|----------|
| 1 | Core Loop | 14 / 14 | 100% ✓ |
| 2 | Level System & Depth | 7 / 7 | 100% ✓ |
| 3 | Polish & Juice | 4 / 4 | 100% ✓ |
| 4 | Boss & Scoring | 1 / 4 | 25% ← current |
| 5 | Expansion | 0 / 3 | 0% |

---

## Right Now

**Phase 4.2 — Power-ups**

- [ ] Shield pickup (1-hit absorb with visual indicator)
- [ ] Speed boost pickup (temporary run speed increase)
- [ ] Double jump pickup (temporary extra jump)
- [ ] Place power-ups in levels

---

## Completed This Session

### 4.1 — End-of-Level Summary Screen ✓
- [x] Per-level time tracked (paused time excluded)
- [x] Stats: TIME / COINS / STOMPED / DEATHS with animated staggered reveal
- [x] Star rating (3 = flawless + all coins, 2 = clean run, 1 = survived)
- [x] Personal best time saved to localStorage; "BEST!" badge on new record
- [x] Animated ★★★ pop-in with coin SFX per earned star
- [x] "FLAWLESS!" badge on 0-death run
- [x] Stars + best time shown on level select cards

---

## Completed This Session

### 3.4 — Settings Screen ✓
- [x] SettingsScene: difficulty selector (MODERN / CLASSIC / HYBRID) + audio mute toggle
- [x] Accessible from main menu (SETTINGS button) and pause menu (SETTINGS option)
- [x] Difficulty persisted to `localStorage` via SaveManager; applied to HealthManager on game start
- [x] Mute state now restored from `localStorage` at module load (was only set on AudioManager.init())

### 3.3 — Animations ✓
- [x] Egg run cycle: forward lean + ±2.5° wobble; vertical bob up to 3px
- [x] Jump arc poses: lean back on rise, lean forward on fall
- [x] Stomp burst: 7 colored particles radiate from enemy on stomp (all 3 types)

---

## Completed This Session

### 3.3 — Animations ✓
- [x] Egg run cycle: forward lean + ±2.5° wobble proportional to speed; vertical bob up to 3px
- [x] Jump arc poses: lean back on rise (-3°), lean forward on fall (+4°)
- [x] Eye state: `'wide'` (alarmed) triggered on both fast rise AND fast fall (vy > 300)
- [x] Stomp burst: 7 colored puff particles radiate from enemy on stomp (all 3 enemy types)
- [x] Stomp SFX wired to JumperEnemy and ThrowerEnemy (was missing)

### 3.2 — Audio ✓
- [x] Web Audio API synthesized SFX: jump, land, dash, stomp, coin, damage, death, level_clear, pause, checkpoint
- [x] Background music: ambient pad + 16-step bass/melody sequencer (96 BPM, A minor)
- [x] Music pauses when game pauses; resumes on unpause
- [x] Mute toggle (M key) with HUD indicator; state persisted to localStorage

---

## Completed This Session

### 3.2 — Audio ✓
- [x] Web Audio API synthesized SFX (no audio files): jump, land, dash, stomp, coin, damage, death, level_clear, pause, checkpoint
- [x] Background music: ambient pad + 16-step bass/melody sequencer (96 BPM, A minor)
- [x] Music pauses when game pauses; resumes on unpause
- [x] Mute toggle (M key) with HUD indicator; state persisted to localStorage

### 3.1 — Visual Effects ✓
- [x] Parallax scrolling backgrounds (3 drawn layers, scrollFactor 0.10 / 0.25 / 0.55)
- [x] Landing dust particles (6 puffs spread from feet on landing)
- [x] Speed lines during dash (horizontal streaks trail behind the egg)
- [x] Smooth scene transitions (camera fadeIn/fadeOut on all scene changes)

### 2.6 — Wall Jump ✓
- [x] Wall slide (slow descent when pressing into a wall mid-air)
- [x] Wall jump (kick off the wall in the opposite direction)
- [x] Distinct wall-slide pose on the egg
- [x] Levels designed to use wall jumps for optional paths or required progression

---

## Backlog (in order)
- [ ] Parallax scrolling backgrounds (multiple layers)
- [ ] Landing dust particles
- [ ] Speed lines during dash
- [ ] Smooth scene transitions

### 3.2 — Audio
- [ ] SFX: jump, land, stomp, coin, damage, death, level clear, pause
- [ ] Background music for World 1
- [ ] Music pauses on pause screen
- [ ] Volume controls in settings, mute toggle during gameplay

### 3.3 — Animations
- [ ] Run cycle on the egg (body tilt / wobble)
- [ ] Jump arc poses (rising, apex, falling as distinct states)
- [ ] Idle animation (breathing, looking around)
- [ ] Enemy death animations
- [ ] Level complete celebration

### 3.4 — Settings Screen
- [ ] Difficulty mode toggle (Classic / Modern / Hybrid)
- [ ] Volume sliders and mute toggle
- [ ] Settings saved to local storage

### 4.1 — Boss Fight
- [ ] First boss with attack patterns and vulnerability windows
- [ ] Boss health bar on screen
- [ ] Boss defeat triggers world completion
- [ ] Distinct boss arena level design

### 4.2 — Power-ups
- [ ] Shield (absorbs one hit)
- [ ] Speed boost (temporary)
- [ ] Double jump (until death or level end)
- [ ] Visual indicators on egg and HUD

### 4.3 — Scoring / Progression
- [ ] Decide: score-focused or progression-focused
- [ ] Per-level stats: time, deaths, coins, enemies stomped
- [ ] End-of-level summary screen
- [ ] Star ratings or high scores in local storage

### 4.4 — Secrets
- [ ] Hidden paths / bonus areas in select levels
- [ ] Bonus collectibles in secret areas
- [ ] Secret-found indicator on level select

### 5.1 — World 2
- [ ] New visual theme and tileset
- [ ] New enemy types
- [ ] 3-4 levels plus boss

### 5.2 — Meta-game
- [ ] Achievement system (local storage)
- [ ] Total death counter on main menu
- [ ] Unlockable egg skins
- [ ] Speedrun timer toggle

### 5.3 — Daily Challenge
- [ ] One procedurally-arranged level per day
- [ ] Leaderboard (requires backend decision)

---

## Completed

| Step | What Was Built | Date |
|------|---------------|------|
| 2.5 | Checkpoints — `Checkpoint` entity (flag + pole, inactive/active states, pop tween), `CheckpointState` module singleton survives scene restarts, GameScene respawns at last checkpoint, cleared on level complete or level change. Added to levels 1-2 (1), 1-3 (1), 1-4 (2). | May 24 |
| 2.4 | More Enemy Types — JumperEnemy (hop AI, seek-player when in range, stomp kill), ThrowerEnemy (timed projectile fire, auto-aim or fixed dir), projectile physics group, overlap damage + camera shake. Added to levels 1-3 and 1-4. | May 24 |
| 2.3 | Hazards — spikes (triangle visuals + hitbox), moving platforms (H/V, carry player), falling platforms (shake warning → crumble → respawn), conveyor belts (push velocity). Placed in levels 1-2 through 1-4. | May 24 |
| 2.2 | Level progression — level complete trigger, level select screen, 4 inline World 1 levels (1-1 to 1-4), sequential unlock, SaveManager persistence | May 22 |
| 2.1 | Tiled integration — LevelLoader, layer conventions (ground / platforms / hazards / enemies / collectibles / decorations), inline level builder | May 17 |
| 1.14 | Basic menus — title screen, pause overlay (frozen game), resume/quit | May 17 |
| 1.13 | Death and respawn — 800ms delay, game over screen for Classic/Hybrid | May 17 |
| 1.12 | Health and lives — HealthManager with Modern (default) / Classic / Hybrid modes, invincibility frames | May 17 |
| 1.11 | HUD — coins / HP / level in bottom strip, fixed to camera | May 17 |
| 1.10 | Coins — placement, collection, staggered pulse animation | May 17 |
| 1.9  | Patrol enemy — walk, reverse at boundaries, stomp kill (player bounce), side-contact damage, state machine | May 17 |
| 1.8  | Camera — smooth lerp, directional lead, bounded to level | May 17 |
| 1.7  | Basic level — tile collision, one-way platforms, pit (instant death) | May 17 |
| 1.6  | Egg character — programmatic draw, expressive eyes (normal/wide/dazed), squash & stretch | May 17 |
| 1.5  | Player movement — acceleration curve, deceleration, variable jump, fall gravity multiplier, terminal velocity, coyote time, jump buffering | May 17 |
| 1.4  | Keyboard controls — arrows/WASD/space, InputManager abstraction | May 17 |
| 1.3  | Virtual controls — D-pad + A button, multi-touch, per-finger pointer map, top-strip layout | May 17 |
| 1.2  | Mobile landscape — forced orientation, viewport lock, rotate-device prompt | May 17 |
| 1.1  | Project scaffold — Phaser 3 + Vite, folder structure, blank canvas on iPhone 13 | May 17 |
