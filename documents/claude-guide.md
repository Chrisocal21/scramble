# Scramble -- Claude Guide

> Paste this into a Claude Project or conversation when you are ready to start building Scramble. This gives the coding partner everything it needs to build Phase 1 without re-explaining the project from scratch.

---

## PASTE BELOW THIS LINE

---

You are helping me build a browser-based side-scrolling platformer called **Scramble**.

This is part of a larger project called Fun Time Killer. Scramble is a standalone game with its own repo and deployment.

---

### What Scramble Is

A side-scrolling platformer with classic Mario/Donkey Kong mechanics and modern browser-game polish. The player is an egg with expressive eyes. Dark mode. Mobile-first.

---

### Tech Stack

| Layer | Choice |
|---|---|
| Engine | Phaser 3 |
| Build tool | Vite |
| Language | JavaScript (TypeScript later if needed) |
| Level editor | Tiled (Phase 2 -- not Phase 1) |
| Hosting | Vercel or Cloudflare Pages |
| State persistence | Local storage |
| Backend | None |
| Local dev | localhost:3000 |

---

### Platform Priority

**Mobile is the primary platform.** The game runs in forced landscape orientation on mobile with virtual controls:
- D-pad on the left side of the screen (left, right, down)
- Jump button on the right side of the screen
- Touch zones sized for comfortable thumbs
- Multi-touch support (move and jump simultaneously)
- No perceptible input lag

Desktop is also supported with keyboard controls (arrow keys or WASD + space bar). Both input methods feed the same input abstraction layer.

Performance target: 60fps on iPhone 13 Safari in landscape.

---

### The Egg Character

Drawn programmatically -- no sprite sheets needed in Phase 1.
- Egg shape (ellipse)
- Two dot eyes that track the direction of movement
- Eyes go wide at the apex of a big jump
- Eyes daze (spiral or X pattern) after taking a hit
- Squash on landing
- Stretch on jump launch
- Idle breathing animation when standing still

---

### Player Movement -- Phase 1

These values should all live in a config file as tunable constants.

- **Run:** Acceleration curve (not instant max speed). Deceleration when input stops (slight slide, not instant stop).
- **Jump:** Variable height based on how long the jump button is held. Short tap = small hop. Hold = full arc.
- **Gravity:** Constant, applied every frame. Separate heavier multiplier for falling (feels better). Terminal velocity cap.
- **Coyote time:** ~80-120ms grace period after walking off a ledge where jump still registers.
- **Jump buffering:** If jump is pressed ~100ms before landing, it fires on landing. Prevents swallowed inputs.
- **No wall jump in Phase 1.** No dash in Phase 1. These come in Phase 2.

---

### Health and Lives System

One flexible system with three modes. The mode changes the rules, not the underlying engine.

- **Modern (default):** 3 HP per level. Unlimited lives. Death restarts the level. No game over.
- **Classic:** 1 HP. 3 lives. Death costs a life. Lose all lives = game over, restart world.
- **Hybrid:** 3 HP. Limited continues. Death restarts the level. Out of continues = game over.

Mode toggle is in settings. Not surfaced on first launch. Most players will play Modern and never change it.

Damage triggers brief invincibility frames (player flashes). Death plays a simple crack/shatter animation, brief pause, then respawn.

---

### Phase 1 Scope -- Core Loop

Build only this. Nothing more until this feels right.

- Phaser 3 + Vite project scaffold
- Forced landscape on mobile with orientation change handling
- Virtual controls (d-pad left, jump right) with visual press feedback
- Keyboard controls on desktop
- Unified input layer
- Player movement with all physics (acceleration, variable jump, coyote time, jump buffer)
- The egg character with eyes and squash/stretch
- One test level: solid ground, platforms, one-way platforms, at least one pit, start and end goal
- Dark background, neutral placeholder tile colors
- Level length: 30-60 seconds clean run
- Camera: smooth lerp follow, movement lead, stays in level bounds
- One enemy: patrol walker (walks back and forth, stomped from above, damages on contact)
- Coins: collectible, spin/pulse animation, count on HUD
- HUD: coin count, health/lives display, positioned to not conflict with virtual controls
- Health/lives system (Modern mode for testing)
- Death, respawn, game over flow
- Title screen and pause overlay

---

### What Phase 1 Does NOT Include

- Tiled integration (hand-build the test level)
- Multiple levels or level select
- Wall jumps or dash
- Power-ups
- Sound or music
- Parallax backgrounds
- Particle effects or screen shake
- Boss fights
- Scoring, star ratings, or end-of-level summary
- Any backend or API calls

---

### Folder Structure (Recommended)

```
scramble/
  public/
    assets/
      sprites/
      tilemaps/
      backgrounds/
      audio/
        music/
        sfx/
      ui/
  src/
    scenes/
      BootScene.js
      MenuScene.js
      GameScene.js
      PauseScene.js
      GameOverScene.js
    entities/
      Player.js
      Enemy.js
      PatrolEnemy.js
      Collectible.js
    systems/
      InputManager.js
      CameraController.js
      ScoreManager.js
      SaveManager.js
      HealthManager.js
    ui/
      VirtualControls.js
      HUD.js
    config/
      physics.js
      scoring.js
      game.js
    main.js
  package.json
  vite.config.js
  README.md
```

---

### How to Work With Me

- Build Phase 1 only. Do not build ahead.
- When a new concept comes up (game loop, collision detection, state machines), explain it briefly in plain English before implementing.
- All physics and gameplay values go in config files as named constants -- never hardcoded in logic.
- Test on desktop first for speed, but mobile landscape is the real target. Flag anything that will behave differently on mobile.
- When something needs a decision I have not made yet, ask. Do not assume.
- Keep code clean and well-commented. I am learning Phaser and game dev through this build.

---

### Open Decisions (Ask Me When These Come Up)

- Tile size: 16x16 or 32x32?
- Game canvas base resolution?
- Virtual control button exact sizing?
- Specific colors for placeholder tiles and background?

---

## END OF PASTE
