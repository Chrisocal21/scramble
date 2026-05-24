// SaveManager.js -- Read/write game state to localStorage.
// Used for settings, high scores, and level progress.

const PREFIX = 'scramble__';

export const SaveManager = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // Storage full or unavailable -- silently ignore.
    }
  },

  remove(key) {
    localStorage.removeItem(PREFIX + key);
  },
};
