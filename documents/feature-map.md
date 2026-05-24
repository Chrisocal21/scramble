# Scramble -- Feature Map

**Project:** Scramble
**Category:** Arcade / Reflex -- Standalone Game
**Parent project:** Fun Time Killer
**Status:** Active
**Last updated:** May 17, 2026

---

## What Scramble Is

A side-scrolling platformer that blends classic Mario/Donkey Kong mechanics with modern browser-game polish. Tight jumps, enemy stomping, level-based progression, boss fights -- wrapped in particle effects, screen shake, parallax depth, and smooth 60fps animation. Dark mode. Mobile-first with forced landscape and virtual gamepad controls. Desktop supported with keyboard.

The player is an egg with personality. Expressive eyes that track movement, squash and stretch physics, and charm that comes from simplicity.

---

## Technical Foundation

| Layer | Choice |
|---|---|
| Engine | Phaser 3 |
| Build tool | Vite |
| Level editor | Tiled (exports JSON tilemaps) |
| Hosting | Vercel or Cloudflare Pages |
| State persistence | Local storage (high scores, progress, settings) |
| Backend | None |
| Primary platform | Mobile (forced landscape, virtual controls) |
| Secondary platform | Desktop (keyboard controls) |
| Performance target | 60fps on iPhone 13 Safari |

---

## Phase 1 -- Core Loop (Get It Playable on Mobile)

**Goal:** A playable platformer with tight controls that feels good on a phone in landscape mode. One level, one enemy, coins, death and respawn. If the controls do not feel right here, nothing else matters.

**What it includes:**

- Phaser 3 + Vite project scaffold
- Forced landscape orientation on mobile
- Virtual d-pad (left side) and jump button (right side) with proper touch zones
- Keyboard controls on desktop (arrow keys / WASD + space)
- Unified input layer so both control methods feed the same system
- Player movement: acceleration curve, variable-height jump, coyote time, jump buffering
- Gravity with heavier fall multiplier and terminal velocity
- The egg: drawn in code, expressive eyes, squash and stretch, idle breathing
- One test level with solid ground, platforms, one-way platforms, and a pit
- Smooth camera follow with movement lead and level boundaries
- One enemy type: patrol walker, stomped from above, damages on side contact
- Coins with collection and HUD counter
- Flexible health/lives system (Modern default, Classic and Hybrid in settings)
- Death animation, respawn, game over flow
- Title screen, pause overlay
- Dark background with neutral placeholder colors
- 30-60 second level length target

**What it does not include:**

- Tiled integration (hand-built test level is enough)
- Multiple levels or level select
- Wall jumps, dash, or advanced movement
- Power-ups
- Sound or music
- Parallax backgrounds
- Particle effects or screen shake
- Boss fights
- Scoring or star ratings

---

## Phase 2 -- Level System and Depth

**Goal:** Multiple levels, real level design tools, more enemies, and the mechanics that add skill expression. This is where Scramble starts feeling like a real game.

**What it adds:**

- Tiled map editor integration -- load levels from JSON exports
- Standardized layer conventions (ground, platforms, hazards, enemies, collectibles, decorations)
- Level complete trigger and level select screen
- 3-4 levels with progressive difficulty (World 1)
- Level progress saved to local storage
- Hazards: spikes, moving platforms, falling platforms, conveyor belts
- New enemies: jumper and thrower types
- Mid-level checkpoints
- Wall slide and wall jump
- Dash mechanic with cooldown
- Dash button added to virtual controls

---

## Phase 3 -- Polish and Juice

**Goal:** Make it feel and sound like a real game. This is the layer that separates "prototype" from "product."

**What it adds:**

- Parallax scrolling backgrounds
- Particle effects: landing dust, stomp burst, coin flash, damage shake
- Speed lines during dash
- Smooth scene transitions
- Sound effects for all player and enemy interactions
- Background music for World 1
- Volume controls and mute toggle
- Animated run cycle, jump arc poses, idle animation
- Enemy death animations
- Level complete celebration
- Full settings screen (difficulty, audio)

---

## Phase 4 -- Boss and Scoring

**Goal:** Complete World 1 with a boss fight and give players a reason to replay levels.

**What it adds:**

- First boss with attack patterns and vulnerability windows
- Boss health bar and boss arena level
- Power-ups: shield, speed boost, double jump
- End-of-level summary screen (time, deaths, coins, enemies)
- Scoring or star rating system (decision pending -- see open questions)
- "Your best" comparison at level end
- High scores or ratings saved to local storage
- Hidden paths and secret collectibles in select levels

---

## Phase 5 -- Expansion

**Goal:** More content, meta-game, and reasons to keep playing beyond World 1.

**What it adds:**

- World 2 with a new visual theme, tileset, enemies, and boss
- Achievement system (local storage)
- Total death counter on main menu
- Unlockable egg skins (cosmetic, earned through play)
- Speedrun timer toggle
- Daily challenge level (procedurally arranged -- requires backend decision for leaderboard)
- Mobile touch control refinements based on player feedback

---

## Ideas Considered and Set Aside

| Idea | Why It Was Set Aside |
|---|---|
| Ghost replay (race your previous run) | Cool but adds significant recording/playback complexity. Revisit after Phase 3. |
| Reactive/dynamic music layers | Requires custom music composition. Standard BGM per world is simpler and effective. |
| Tilt controls on mobile | Virtual buttons are more precise for a platformer. Tilt is better for racing games. |
| Procedural level generation for main game | Hand-designed levels are better for a platformer. Procedural reserved for daily challenge only. |
| Online multiplayer | Scramble is a solo experience. Adding multiplayer changes everything. |
| In-app purchases | Fun Time Killer games are free. No monetization in scope. |

---

## Ideas in the Backlog

These are worth revisiting once the core game is solid.

- Combo system -- chaining stomps without touching the ground multiplies points
- Momentum preservation on slopes -- skilled players chain slope-jumps for speed
- Environmental storytelling through background details (no dialogue, no cutscenes)
- Freeze-frame zoom on boss kill
- Dynamic lighting in cave/dark levels (player has a light radius)
- Weather/time system (purely visual -- rain, fog, sunset)
- Risk/reward collectible placement in dangerous spots
- One-more-try hooks ("Your best: 47s. Beat 40?")

---

## Relationship to Fun Time Killer

Scramble is a standalone game under the Fun Time Killer umbrella.

- Own repo (separate from Word Hub and other games)
- Own deployment on Vercel or Cloudflare Pages
- Follows the same dark-mode-first design language
- Eventually linked from a Fun Time Killer landing page / game index
- Shares no code with other Fun Time Killer games (Phaser engine vs React)
- Does not block development on any other Fun Time Killer game

---

## Build Rules

- No HTML in any output
- No emojis in any output
- SVG icons only when genuinely needed
