// game.js -- Core game configuration constants.
// Change these to adjust the overall game setup.

export const GAME_CONFIG = {
  // Canvas resolution. 1136x540 is ~2.1:1, close to iPhone 13 landscape (2.16:1).
  width: 1136,
  height: 540,

  // Tile size in pixels. All level geometry is built on this grid.
  tileSize: 32,

  // Width of each side control panel (left = D-pad, right = A button).
  // Game view occupies the center: width - 2 * controlPanelWidth.
  controlPanelWidth: 160,

  // Background color (dark mode baseline).
  backgroundColor: '#111111',
};
