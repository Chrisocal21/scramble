# Scramble -- Project Log

**Project:** Scramble
**Category:** Arcade / Reflex -- Standalone Game
**Parent project:** Fun Time Killer
**Status:** Active

---

## Active Projects

| Project | Status | Last Session | Next Focus |
|---|---|---|---|
| Scramble | Active | Session 1 -- May 17, 2026 | Project scaffold, forced landscape, virtual controls |

---

## Session History

All entries below, newest first.

---

## Scramble -- Session 1 -- May 17, 2026

**Status:** Active

---

### What We Decided

- Project name is Scramble
- Player character is an egg drawn in code with expressive eyes (track movement, wide on big jumps, dazed on hit) and squash/stretch physics
- Engine is Phaser 3 with Vite as the build tool
- Mobile is first-class: forced landscape orientation, virtual d-pad on the left, jump button on the right
- Desktop supported with keyboard controls (arrow keys / WASD + space)
- Lives system is one flexible engine with three modes: Classic (1 HP, 3 lives), Modern (3 HP, unlimited lives), Hybrid (3 HP, limited continues). Modern is the default. Toggle lives in settings, not surfaced on first launch.
- Wall jump and dash are out for Phase 1, in for Phase 2. Get basic movement perfect first.
- Level length for World 1 targets 30-60 seconds per clean run
- Visual baseline is dark mode with neutral placeholder colors. Real palette waits for character/theme decision.
- No backend. Local storage only for high scores, progress, and settings.
- Hosting on Vercel or Cloudflare Pages
- Test device is iPhone 13
- Separate repo (standalone, not part of a monorepo)

---

### What Was Learned

- Chris brought a detailed game design brief covering mechanics, architecture, asset requirements, and build phases
- Brief was thorough but scoped like a full commercial game -- The Forge constrained Phase 1 to the essential core loop
- Mobile controls were listed as Phase 5 in the original brief -- promoted to Phase 1 because mobile is the primary platform
- Chris is new to game development and Phaser 3 -- teaching is part of every session going forward
- The egg character started as a placeholder idea but has real potential to be the permanent character

---

### What Changed

- Mobile controls moved from Phase 5 to Phase 1 (first-class, not afterthought)
- Phase 1 scope tightened: no Tiled integration, no multiple levels, no sound, no particles. Pure movement and controls.
- Brief's build phases reorganized into Forge-style phases with mobile baked in throughout

---

### Open Questions Added

- Tile size (16x16 or 32x32)?
- Game canvas base resolution?
- Virtual control button sizing?
- World 1 theme?
- Sound/music sourcing strategy?
- Score-focused vs progression-focused?
- Final character (keep the egg or design something new)?
- Color palette and visual direction?
- Difficulty mode naming?
- D-pad vs simplified left/right arrows?
- Daily challenge procedural approach?
- Global leaderboard backend worth it?

---

### Open Questions Closed

- Game name: Scramble
- Engine: Phaser 3
- Player character: Egg with eyes
- Lives system: All three modes, Modern default
- Wall jump Phase 1: No, Phase 2
- Dash Phase 1: No, Phase 2
- Mobile priority: First-class
- Level length: 30-60 seconds
- Test device: iPhone 13
- Visual baseline: Dark mode, neutral placeholders
- Default difficulty: Modern

---

### Progress Updates

- Project created at 0%. All Phase 1 features and subtasks defined in the progress tracker.

---

### Documents Created

- SCRAMBLE_PROGRESS_TRACKER.md
- SCRAMBLE_OPEN_QUESTIONS.md
- SCRAMBLE_FEATURE_MAP.md
- SCRAMBLE_PROJECT_LOG.md (this file)
- SCRAMBLE_CLAUDE_GUIDE.md

---

### Next Session

Set up the Phaser 3 + Vite project scaffold. Get a blank canvas rendering on both desktop and iPhone 13 in landscape. Start implementing forced landscape mode and virtual controls -- the foundation everything else is built on.

---

## Inbox

| Date | Thought | Status |
|---|---|---|
| -- | -- | -- |

---

## Build Rules

- No HTML in any output
- No emojis in any output
- SVG icons only when genuinely needed
