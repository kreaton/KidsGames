// Touch and mouse input for the clock face, and the saved settings.
window.clockInput = {
    // Reports every press, drag and release on the clock to .NET as an angle (degrees clockwise
    // from 12) and a distance from the centre in viewBox units (the face has radius 96 of 100).
    attach(svg, dotnet) {
        let dragging = false;

        function report(e, phase) {
            const box = svg.getBoundingClientRect();
            const x = (e.clientX - (box.left + box.width / 2)) / (box.width / 2) * 100;
            const y = (e.clientY - (box.top + box.height / 2)) / (box.height / 2) * 100;
            const angle = (Math.atan2(x, -y) * 180 / Math.PI + 360) % 360;
            dotnet.invokeMethodAsync("OnClockPointer", angle, Math.hypot(x, y), phase);
        }

        svg.addEventListener("pointerdown", e => {
            if (e.button > 0) return;
            dragging = true;
            // Keeps the drag going when the finger slides off the clock.
            try { svg.setPointerCapture(e.pointerId); } catch { }
            e.preventDefault();
            report(e, "down");
        });
        svg.addEventListener("pointermove", e => { if (dragging) report(e, "move"); });
        const end = e => {
            if (!dragging) return;
            dragging = false;
            report(e, "up");
        };
        svg.addEventListener("pointerup", end);
        svg.addEventListener("pointercancel", end);
    },
};

// Settings live in this browser only; private windows may refuse storage, so failures are ignored.
window.easyStore = {
    get(key) {
        try { return localStorage.getItem(key); } catch { return null; }
    },
    set(key, value) {
        try { localStorage.setItem(key, value); } catch { }
    },
};
