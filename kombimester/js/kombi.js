// Keyboard play and the saved settings.
window.kombi = (() => {
    let handler = null;
    const keys = ["Backspace", "Delete", "Enter", "ArrowLeft", "ArrowRight"];

    return {
        // 1–6 place a peg, Backspace takes one back, the arrows pick a slot and Enter checks.
        attachKeys(dotnet) {
            if (handler) document.removeEventListener("keydown", handler);
            handler = e => {
                if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
                if (!/^[1-6]$/.test(e.key) && !keys.includes(e.key)) return;
                // Enter always checks (or starts the next code), even when a button has focus: a peg that was
                // just clicked keeps focus and would otherwise be placed again. Space still presses a focused button.
                e.preventDefault();
                dotnet.invokeMethodAsync("OnKey", e.key);
            };
            document.addEventListener("keydown", handler);
        },

        detachKeys() {
            if (handler) document.removeEventListener("keydown", handler);
            handler = null;
        },

        // Settings live in this browser only; private windows may refuse storage, so failures are ignored.
        load(key) {
            try { return localStorage.getItem(key); } catch { return null; }
        },
        save(key, value) {
            try { localStorage.setItem(key, value); } catch { }
        },
    };
})();
