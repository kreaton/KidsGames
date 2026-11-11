// Synthesized game sounds (Web Audio) - no audio files needed.
(function () {
    let ctx = null;
    let master = null;

    function audio() {
        if (!ctx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            ctx = new AC();
            const comp = ctx.createDynamicsCompressor();
            master = ctx.createGain();
            master.gain.value = 0.8;
            master.connect(comp).connect(ctx.destination);
        }
        if (ctx.state !== "running") ctx.resume();
        return ctx;
    }

    // iOS only starts audio from inside a user gesture, so unlock on the first touches.
    function unlock() {
        const c = audio();
        if (!c || c.state === "running") return;
        const src = c.createBufferSource();
        src.buffer = c.createBuffer(1, 1, 22050);
        src.connect(c.destination);
        src.start(0);
    }
    ["pointerdown", "touchend", "keydown", "click"].forEach(e =>
        window.addEventListener(e, unlock, { capture: true, passive: true }));

    // Stop pinch-zoom on iOS Safari, which ignores the viewport's user-scalable.
    document.addEventListener("gesturestart", e => e.preventDefault());

    function tone(freq, start, dur, opts = {}) {
        const c = audio();
        if (!c) return;
        const t0 = c.currentTime + start;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = opts.type || "triangle";
        osc.frequency.setValueAtTime(freq, t0);
        if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, t0 + dur);
        const vol = opts.vol ?? 0.25;
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        let node = osc.connect(gain);
        if (opts.lowpass) {
            const f = c.createBiquadFilter();
            f.type = "lowpass";
            f.frequency.value = opts.lowpass;
            node = gain.connect(f);
        }
        node.connect(master);
        osc.start(t0);
        osc.stop(t0 + dur + 0.05);
    }

    function noise(start, dur, fromHz, toHz, vol) {
        const c = audio();
        if (!c) return;
        const t0 = c.currentTime + start;
        const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const src = c.createBufferSource();
        src.buffer = buf;
        const filter = c.createBiquadFilter();
        filter.type = "bandpass";
        filter.Q.value = 1.2;
        filter.frequency.setValueAtTime(fromHz, t0);
        filter.frequency.exponentialRampToValueAtTime(toHz, t0 + dur);
        const gain = c.createGain();
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.3);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        src.connect(filter).connect(gain).connect(master);
        src.start(t0);
    }

    // Major pentatonic from C5 - each floor sounds a little higher.
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98, 1760.0];

    window.numberTowersSound = {
        success(floor) {
            const f = scale[Math.min(Math.max(floor, 1), 10) - 1];
            tone(f, 0, 0.22, { type: "sine", vol: 0.35 });
            tone(f * 2, 0, 0.12, { type: "triangle", vol: 0.08 });
            tone(f * 1.5, 0.09, 0.3, { type: "sine", vol: 0.28 });
        },
        fail() {
            tone(311, 0, 0.2, { type: "sawtooth", vol: 0.18, to: 262, lowpass: 900 });
            tone(233, 0.2, 0.42, { type: "sawtooth", vol: 0.18, to: 165, lowpass: 700 });
        },
        shuffle() {
            noise(0, 0.55, 300, 3500, 0.35);
            [0, 0.07, 0.14, 0.21].forEach((t, i) => tone(700 + i * 180, t, 0.1, { type: "sine", vol: 0.12 }));
        },
        hooray() {
            const fanfare = [523.25, 659.25, 783.99, 1046.5];
            fanfare.forEach((f, i) => tone(f, i * 0.13, 0.2, { type: "square", vol: 0.12, lowpass: 2500 }));
            [523.25, 659.25, 783.99, 1046.5].forEach(f => tone(f, 0.55, 1.2, { type: "triangle", vol: 0.18 }));
            tone(1318.51, 0.55, 1.2, { type: "sine", vol: 0.12 });
            noise(0.5, 1.6, 900, 2200, 0.25); // crowd-ish "yaaay"
            for (let i = 0; i < 10; i++) {
                tone(1500 + Math.random() * 1500, 0.7 + i * 0.12, 0.15, { type: "sine", vol: 0.08 });
            }
        }
    };
})();
