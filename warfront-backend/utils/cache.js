const store = {};

module.exports = {
  set(key, value, ttlSeconds = 600) {
    store[key] = {
      value,
      expires: Date.now() + ttlSeconds * 1000
    };
  },

  get(key) {
    const item = store[key];
    if (!item) return null;
    if (Date.now() > item.expires) {
      delete store[key];
      return null;
    }
    return item.value;
  },

  clear(key) {
    delete store[key];
  },

  stats() {
    const keys = Object.keys(store);
    return {
      keys: keys.length,
      entries: keys
    };
  }
};
