// The saved board size and records. They live in this browser only; private windows may refuse
// storage, so failures are ignored.
window.huske = {
    load(key) {
        try { return localStorage.getItem(key); } catch { return null; }
    },
    save(key, value) {
        try { localStorage.setItem(key, value); } catch { }
    },
};
