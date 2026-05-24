# Scramble -- Open Questions

**Project:** Scramble (Fun Time Killer -- Arcade / Reflex)
**Last updated:** May 17, 2026 (Session 2)

---

## Must Answer Before Phase 1 Build

All resolved. See Answered Questions.

---

## Must Answer Before Phase 2

These can wait until Phase 1 is playable but need answers before expanding.

| # | Question | Why It Matters |
|---|---|---|
| 5 | World 1 theme -- forest, cave, factory, sky, or something else? | Determines the tileset art and background art needed for real levels. |
| 6 | Sound and music sourcing -- free packs from itch.io/freesound, or commission? | Determines timeline and cost for audio. Free packs are fine for Phase 2, but the plan should be set. |
| 7 | Tiled map conventions -- layer names, object types, property keys? | Resolved. See A16 in Answered Questions. |
| 8 | How long should the boss fight feel? | A 30-second fight feels like a mini-boss. A 2-minute fight feels like an event. Sets the design target. |

---

## Open -- Answer When Ready

These are real questions but do not block any current phase.

| # | Question | Why It Matters |
|---|---|---|
| 9 | Score-focused or progression-focused? | Determines whether the HUD shows a score counter, whether leaderboards matter, and what the end-of-level screen emphasizes. Can decide after playing Phase 1. |
| 10 | Final character -- keep the egg or design something new? | The egg may stick. If it does, the art direction follows. If not, character design drives everything visual. |
| 11 | Color palette and visual direction? | Blocked by the character decision. Dark mode is confirmed. Specific colors come after. |
| 12 | Difficulty naming -- Classic/Modern/Hybrid or something more flavorful? | Low priority but the names players see matter for perception. "Classic" sounds punishing. "Modern" sounds easy. Maybe different labels. |
| 13 | Mobile touch control layout -- d-pad or simplified left/right arrows plus jump? | Resolved: whole-screen touch zones. Hold left half = move left, hold right half = move right. Double-tap = jump. No buttons at all. See Answered Questions. |
| 14 | Daily challenge -- how does the procedural arrangement work? | Hand-designed tile chunks shuffled into a sequence? Fully procedural? This is a Phase 5 question but worth thinking about early. |
| 15 | Global leaderboard -- worth building a backend for? | Local high scores are free. Global leaderboards need a backend, auth, anti-cheat. Big scope increase. |

---

## Answered Questions

| # | Question | Answer | Session |
|---|---|---|---|
| A1 | Game name? | Scramble | Session 1 |
| A2 | Player character? | Egg with expressive eyes, drawn in code. Placeholder that may become permanent. | Session 1 |
| A3 | Lives or health system? | All three modes built as one flexible system. Modern as default. Toggle in settings. | Session 1 |
| A4 | Phaser 3 or Kaboom.js? | Phaser 3. Better suited for the full scope -- boss fights, tilemaps, touch input, audio. | Session 1 |
| A5 | Wall jump in Phase 1? | No. Phase 2. Get basic movement feeling perfect first. | Session 1 |
| A6 | Dash in Phase 1? | No. Phase 2. Same reasoning as wall jump. | Session 1 |
| A7 | Mobile priority? | First-class. Forced landscape. Virtual d-pad left, action buttons right. Not an afterthought. | Session 1 |
| A8 | Level length for World 1? | 30-60 seconds for a clean run. | Session 1 |
| A9 | Test device? | iPhone 13 | Session 1 |
| A10 | Visual baseline? | Dark mode. Neutral placeholder colors. Real palette waits for character/theme decision. | Session 1 |
| A11 | Default difficulty mode? | Modern (3 HP, unlimited lives, restart level on death). Most forgiving. Most players never change settings. | Session 1 |
| A12 | Tile size? | 32x32 pixels per tile. Good readability on mobile, standard for modern platformers. | Session 2 |
| A13 | Game canvas base resolution? | 960x540 (16:9). Shows 30 tiles wide. Scales cleanly to iPhone 13 landscape. | Session 2 |
| A14 | Virtual control layout? | No buttons. Whole-screen touch zones. Hold half = move. Double-tap = jump. No screen real estate consumed. | Session 2 |
| A15 | Separate repo? | Yes. Standalone repo at c:\Users\chris\Documents\code\scramble | Session 2 |
| A16 | Tiled layer/entity conventions? | Tile layers: ground, platforms, oneway, hazards, decorations. Object layer: entities. Entity types: player_start, goal, coin, checkpoint, patrol_enemy (props: patrol_left, patrol_right), jumper_enemy, thrower_enemy. Tile size: 32x32. Export as JSON to public/assets/tilemaps/. | Session 2 |

---

## Build Rules

- No HTML in any output
- No emojis in any output
- SVG icons only when genuinely needed
