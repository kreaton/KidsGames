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
    }
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("touchend", unlock);

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

    // A short bell-like ping for sparkles.
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

    return {
        // "Da-da-da-DAAAA!" fanfare, finished with a sparkle of bells.
        success() {
            const c = audio();
            if (!c) return;
            const G4 = 392.0, C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5;

            brass(c, { freq: G4, start: 0.00, length: 0.12 });
            brass(c, { freq: G4, start: 0.14, length: 0.12 });
            brass(c, { freq: G4, start: 0.28, length: 0.12 });
            for (const freq of [C5, E5, G5]) {
                brass(c, { freq, start: 0.42, length: 0.75, volume: 0.25, vibrato: 4 });
            }
            [C6, 1318.5, 1568.0, 2093.0].forEach((freq, i) =>
                bell(c, { freq, start: 0.55 + i * 0.07 }));
        },

        // A short, soft "bonk" for a wrong number: over quickly, so fast tapping isn't slowed down.
        tryAgain() {
            const c = audio();
            if (!c) return;
            brass(c, { freq: 220.0, slideTo: 155.56, start: 0.00, length: 0.22, volume: 0.35 });
            brass(c, { freq: 207.65, slideTo: 146.83, start: 0.16, length: 0.30, volume: 0.3 });
        },

        // A bubbly pling for each number put in place, one step up the scale for each.
        pling(step = 1) {
            const c = audio();
            if (!c) return;
            const scale = [523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77, 1046.5, 1174.66, 1318.51];
            const freq = scale[Math.min(Math.max(step, 1), scale.length) - 1];
            bell(c, { freq, start: 0, length: 0.3, volume: 0.25 });
            bell(c, { freq: freq * 2, start: 0.05, length: 0.2, volume: 0.08 });
        },

        // A sad, slow fanfare in a minor key for the crying axolotl: three sighing notes, then a long
        // minor chord that sags down, with a few falling "tear drop" bells.
        sad() {
            const c = audio();
            if (!c) return;
            const play = () => {
                const Eb4 = 311.13, D4 = 293.66, C4 = 261.63, G3 = 196.0, Eb3 = 155.56;
                brass(c, { freq: Eb4, start: 0.00, length: 0.30, volume: 0.3 });
                brass(c, { freq: D4, start: 0.34, length: 0.30, volume: 0.3 });
                brass(c, { freq: C4, start: 0.68, length: 0.30, volume: 0.3 });
                for (const freq of [Eb3, G3, C4]) {
                    brass(c, { freq, slideTo: freq * 0.94, start: 1.02, length: 1.3, volume: 0.22, vibrato: 3 });
                }
                [1568.0, 1318.5, 1046.5].forEach((freq, i) =>
                    bell(c, { freq, start: 1.25 + i * 0.22, length: 0.4, volume: 0.07 }));
            };
            if (c.state === "running") { play(); return; }

            // Before the first tap the browser keeps audio suspended. Only play if it wakes up right away;
            // otherwise the fanfare would go off late, on the child's first tap.
            const asked = performance.now();
            c.resume().then(() => {
                if (c.state === "running" && performance.now() - asked < 300) play();
            });
        },
    };
})();
