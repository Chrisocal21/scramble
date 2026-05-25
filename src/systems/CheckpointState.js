// CheckpointState.js -- Tiny singleton that survives scene restarts.
// GameScene writes the activated checkpoint here so that when the scene
// restarts on death the player re-spawns at the flag instead of level start.
// Cleared when a new level is entered or when the level is completed.

export const CheckpointState = {
  level_key: null,
  x:         null,
  y:         null,
};
