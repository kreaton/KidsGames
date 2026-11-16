// Little synthesized sounds, so the game needs no audio files.
window.gameSounds = (() => {
    let ctx = null;
    let master = null;

    function audio() {
        if (!ctx) {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return null;
            ctx = new Ctx();

            // A compressor lets the sounds be loud without crackling when notes pile up.
            const comp = ctx.createDynamicsCompressor();
            comp.threshold.value = -12;
            comp.ratio.value = 6;
            master = ctx.createGain();
            master.gain.value = 0.9;
            master.connect(comp).connect(ctx.destination);
        }
        if (ctx.state === "suspended") ctx.resume();
        return ctx;
    }

    // iOS only lets audio start inside a user gesture, so wake the context on the first tap.
    function unlock() {
        const c = audio();
        if (!c) return;
        const source = c.createBufferSource();
        source.buffer = c.createBuffer(1, 1, 22050);
        source.connect(c.destination);
        source.start(0);
        window.removeEventListener("pointerdown", unlock);
        window.removeEventListener("touchend", unlock);
        window.removeEventListener("keydown", unlock);
    }
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("touchend", unlock);
    window.addEventListener("keydown", unlock);

    // A brassy note: a sawtooth softened by a low-pass filter that opens as the note starts.
    function brass(c, { freq, start, length, volume = 0.35, slideTo = null, vibrato = 0 }) {
        const t = c.currentTime + start;
        const osc = c.createOscillator();
        const filter = c.createBiquadFilter();
        const gain = c.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, t);
        if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + length);

        if (vibrato) {
            const lfo = c.createOscillator();
            const depth = c.createGain();
            lfo.frequency.value = 6;
            depth.gain.value = vibrato;
            lfo.connect(depth).connect(osc.frequency);
            lfo.start(t);
            lfo.stop(t + length + 0.1);
        }

        filter.type = "lowpass";
        filter.Q.value = 2;
        filter.frequency.setValueAtTime(freq * 1.5, t);
        filter.frequency.exponentialRampToValueAtTime(freq * 5, t + 0.06);
        filter.frequency.exponentialRampToValueAtTime(freq * 2.5, t + length);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(volume, t + 0.03);
        gain.gain.setValueAtTime(volume, t + length * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + length);

        osc.connect(filter).connect(gain).connect(master);
        osc.start(t);
        osc.stop(t + length + 0.05);
    }

    // A short bell-like ping.
    function bell(c, { freq, start, length = 0.35, volume = 0.2 }) {
        const t = c.currentTime + start;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
        osc.connect(gain).connect(master);
        osc.start(t);
        osc.stop(t + length + 0.05);
    }

    // A bubbly "plop": a sine that sweeps quickly up (or down) in pitch.
    function plop(c, { from, to, start = 0, length = 0.12, volume = 0.3 }) {
        const t = c.currentTime + start;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(from, t);
        osc.frequency.exponentialRampToValueAtTime(to, t + length * 0.8);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(volume, t + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
        osc.connect(gain).connect(master);
        osc.start(t);
        osc.stop(t + length + 0.05);
    }

    // A pentatonic scale, so the cards make a little tune whatever order they are turned in.
    const notes = [392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];

    return {
        // A card turns over: a short plop, with a note that depends on the card.
        flip(index) {
            const c = audio();
            if (!c) return;
            const note = notes[(index ?? 0) % notes.length];
            plop(c, { from: note * 0.7, to: note * 1.3, length: 0.1, volume: 0.25 });
        },

        // Two of a kind: two bright pings, after the card has finished turning.
        match() {
            const c = audio();
            if (!c) return;
            bell(c, { freq: 1046.5, start: 0.22, volume: 0.22 });
            bell(c, { freq: 1568.0, start: 0.32, length: 0.5, volume: 0.22 });
        },

        // Not the same: a soft, low "bonk-bonk", friendly rather than harsh.
        miss() {
            const c = audio();
            if (!c) return;
            plop(c, { from: 330, to: 220, start: 0.35, length: 0.16, volume: 0.3 });
            plop(c, { from: 260, to: 170, start: 0.52, length: 0.22, volume: 0.3 });
        },

        // Every pair found: a rising fanfare with a shower of bells.
        win() {
            const c = audio();
            if (!c) return;
            const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5;
            [C5, E5, G5].forEach((freq, i) => brass(c, { freq, start: i * 0.13, length: 0.12 }));
            for (const freq of [C5, E5, G5, C6]) {
                brass(c, { freq, start: 0.42, length: 1.0, volume: 0.2, vibrato: 4 });
            }
            [1046.5, 1318.5, 1568.0, 2093.0, 2637.0, 3136.0].forEach((freq, i) =>
                bell(c, { freq, start: 0.5 + i * 0.08 }));
        },
    };
})();
