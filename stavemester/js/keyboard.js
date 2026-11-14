// Lets a physical keyboard play the game: letters A-Å type, Enter starts or goes to the next word,
// and ? shows the next letter. The keys are passed on to Home.razor, which decides what they do.
window.gameKeyboard = (() => {
    let page = null;

    function onKeyDown(e) {
        if (!page || e.ctrlKey || e.altKey || e.metaKey || e.repeat) return;
        // Leave keys alone in text fields, and Enter on a link (the "Alle spil" button) still follows it.
        // Enter on a focused button is taken over on purpose: after a tap on a letter, focus stays on
        // that key, and Enter would otherwise type the letter again.
        const target = e.target;
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
        if (e.key === "Enter" && target instanceof HTMLAnchorElement) return;

        let key = null;
        if (e.key === "Enter") key = "Enter";
        else if (e.key === "?") key = "?";
        else if (e.key.length === 1 && /\p{L}/u.test(e.key)) key = e.key.toUpperCase();
        if (key === null) return;

        e.preventDefault();
        page.invokeMethodAsync("OnKey", key);
    }

    return {
        start(dotNetPage) {
            page = dotNetPage;
            document.addEventListener("keydown", onKeyDown);
        },
        stop() {
            document.removeEventListener("keydown", onKeyDown);
            page = null;
        },
    };
})();
