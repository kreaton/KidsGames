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

    // A struck bell, like a clock's chime. A bell's overtones are not plain multiples of the note:
    // a low "hum" an octave below, a minor third and a fifth above, and higher partials that die away
    // fast, so the strike sounds bright and the tail rings low. Pairs of slightly detuned partials
    // beat against each other and give the "ngggg" wobble.
    function chime(c, { freq, start, length = 3.2, volume = 0.5 }) {
        const t = c.currentTime + start;
        const partials = [
            // ratio, level, decay (s), detune (Hz)
            [0.5, 0.55, length, 0.6],   // hum
            [1.0, 1.0, length * 0.8, 0.9], // prime: the note itself
            [1.19, 0.35, length * 0.5, 0], // minor third, the bell colour
            [1.5, 0.3, length * 0.4, 0],   // fifth
            [2.0, 0.4, length * 0.35, 1.2], // nominal
            [2.51, 0.15, 0.6, 0],
            [3.01, 0.12, 0.4, 0],
            [4.17, 0.08, 0.25, 0],
        ];

        const out = c.createGain();
        out.gain.value = volume;
        out.connect(master);

        for (const [ratio, level, decay, detune] of partials) {
            for (const shift of detune ? [-detune / 2, detune / 2] : [0]) {
                const osc = c.createOscillator();
                const gain = c.createGain();
                const peak = level / (detune ? 2 : 1) * 0.35;
                osc.type = "sine";
                osc.frequency.value = freq * ratio + shift;
                gain.gain.setValueAtTime(0.0001, t);
                gain.gain.exponentialRampToValueAtTime(peak, t + 0.005);
                gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);
                osc.connect(gain).connect(out);
                osc.start(t);
                osc.stop(t + decay + 0.05);
            }
        }

        // The strike itself: a short, soft knock.
        const knock = c.createOscillator();
        const knockGain = c.createGain();
        knock.type = "triangle";
        knock.frequency.setValueAtTime(freq * 6, t);
        knock.frequency.exponentialRampToValueAtTime(freq * 2, t + 0.03);
        knockGain.gain.setValueAtTime(0.12, t);
        knockGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
        knock.connect(knockGain).connect(out);
        knock.start(t);
        knock.stop(t + 0.06);
    }

    return {
        // A soft click each time a hand moves to a new place, like a real clock being set.
        tick() {
            const c = audio();
            if (!c) return;
            const t = c.currentTime;
            const osc = c.createOscillator();
            const gain = c.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(1800, t);
            osc.frequency.exponentialRampToValueAtTime(900, t + 0.03);
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.exponentialRampToValueAtTime(0.12, t + 0.003);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
            osc.connect(gain).connect(master);
            osc.start(t);
            osc.stop(t + 0.06);
        },

        // Ten stars: a rising fanfare with a longer shower of bells.
        trophy() {
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

        // "Ding-dong": a high chime and then a lower one a major third down, like a doorbell.
        success() {
            const c = audio();
            if (!c) return;
            chime(c, { freq: 659.25, start: 0, length: 1.6, volume: 0.45 }); // E5 "ding"
            chime(c, { freq: 523.25, start: 0.45, length: 3.0 });            // C5 "dong"
        },

        // Sad trombone "wah wah wah waaah", friendly rather than harsh.
        tryAgain() {
            const c = audio();
            if (!c) return;
            brass(c, { freq: 311.13, start: 0.00, length: 0.28, volume: 0.4 });
            brass(c, { freq: 293.66, start: 0.30, length: 0.28, volume: 0.4 });
            brass(c, { freq: 277.18, start: 0.60, length: 0.28, volume: 0.4 });
            brass(c, { freq: 261.63, slideTo: 246.94, start: 0.90, length: 0.75, volume: 0.4, vibrato: 7 });
        },
    };
})();
