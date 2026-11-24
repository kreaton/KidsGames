// Card animations for Let Kabale.
// Game.razor calls capture() just before the table changes and play() right after the new table
// is drawn. Every card that moved flies from its old place to its new one and wiggles a little as
// it lands; a card that was turned over (or turned from the deck) flips.
// Cards are found by their data-card attribute (the card's id; the deck is "deck").
window.kabaleAnim = (() => {
    let before = null;

    const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Places are measured from the board's corner, so the whole board moving (e.g. the explanation
    // line above it growing a line) is not mistaken for every card moving.
    function origin() {
        const board = document.querySelector(".board");
        const r = board ? board.getBoundingClientRect() : { left: 0, top: 0 };
        return { x: r.left, y: r.top };
    }

    function place(el, o) {
        const r = el.getBoundingClientRect();
        return { x: r.left - o.x, y: r.top - o.y };
    }

    function snapshot() {
        const o = origin();
        const map = new Map();
        for (const el of document.querySelectorAll("[data-card]")) {
            map.set(el.dataset.card, { at: place(el, o), back: el.classList.contains("back") });
        }
        return map;
    }

    // One keyframe: always the same list of functions, so the browser blends them smoothly.
    const frame = (x, y, turn, flip, offset, extra) =>
        Object.assign({ transform: `translate(${x}px, ${y}px) rotate(${turn}deg) perspective(700px) rotateY(${flip}deg)`, offset }, extra);

    function fly(el, dx, dy, flipped, wiggle) {
        const lift = { zIndex: 60 };
        const ease = { easing: "cubic-bezier(.25, .8, .35, 1)" };
        const flip = flipped ? 90 : 0;
        const landing = wiggle === "turn"
            // A single card: a little rock from side to side.
            ? [frame(0, 0, -6, 0, .72, lift), frame(0, 0, 4, 0, .84, lift), frame(0, 0, -2, 0, .93, lift)]
            // Several cards: they shuffle sideways together, so the run stays neat.
            : [frame(-4, 0, 0, 0, .72, lift), frame(3, 0, 0, 0, .84, lift), frame(-1, 0, 0, 0, .93, lift)];
        el.animate([
            frame(dx, dy, 0, flip, 0, { ...lift, ...ease }),
            frame(0, 0, 0, 0, .6, lift),
            ...landing,
            frame(0, 0, 0, 0, 1),
        ], { duration: 620 });
    }

    function flipOver(el, delay) {
        el.animate([
            frame(0, -6, 0, 90, 0, { zIndex: 60 }),
            frame(0, -6, 0, 0, .7, { zIndex: 60 }),
            frame(0, 0, 0, 0, 1),
        ], { duration: 380, delay, easing: "ease-out", fill: "backwards" });
    }

    return {
        capture() {
            before = reduced() ? null : snapshot();
        },

        play(fromDeck) {
            if (!before) return;
            const old = before;
            before = null;

            const o = origin();
            const moving = [];
            for (const el of document.querySelectorAll("[data-card]")) {
                const id = el.dataset.card;
                // A card just turned from the deck was not on the table yet: it comes out of the deck.
                const was = old.get(id) ?? (id === fromDeck ? old.get("deck") : undefined);
                if (!was) continue;

                const now = place(el, o);
                const dx = was.at.x - now.x;
                const dy = was.at.y - now.y;
                const flipped = was.back !== el.classList.contains("back");

                if (Math.abs(dx) + Math.abs(dy) > 4) moving.push({ el, dx, dy, flipped });
                else if (flipped) flipOver(el, 220);   // a hidden card turns over once the card above has left
            }

            const wiggle = moving.length > 1 ? "shuffle" : "turn";
            for (const m of moving) fly(m.el, m.dx, m.dy, m.flipped, wiggle);
        },
    };
})();
