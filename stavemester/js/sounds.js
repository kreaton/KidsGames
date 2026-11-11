// Little synthesized sounds, plus playback of the optional word recordings in wwwroot/sounds.
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


    // Recordings are decoded once and played through the same context, which iOS has unlocked.
    const recordings = new Map();
    let playing = null;

    async function loadRecording(c, url) {
        if (!recordings.has(url)) {
            recordings.set(url, fetch(url)
                .then(r => r.ok ? r.arrayBuffer() : Promise.reject(r.status))
                .then(data => new Promise((ok, fail) => c.decodeAudioData(data, ok, fail))));
        }
        return recordings.get(url);
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

        // A quick friendly "bwoh-bwoh", short because wrong letters happen a lot.
        tryAgain() {
            const c = audio();
            if (!c) return;
            brass(c, { freq: 220.0, slideTo: 196.0, start: 0.00, length: 0.18, volume: 0.4 });
            brass(c, { freq: 196.0, slideTo: 164.81, start: 0.20, length: 0.35, volume: 0.4, vibrato: 6 });
        },

        // A little two-note ping for each right letter.
        correctLetter() {
            const c = audio();
            if (!c) return;
            bell(c, { freq: 1046.5, start: 0.00, length: 0.2, volume: 0.25 });
            bell(c, { freq: 1568.0, start: 0.07, length: 0.3, volume: 0.25 });
        },

        // Plays a word recording such as "sounds/hest.mp3". A missing file is simply skipped.
        async playFile(url) {
            const c = audio();
            if (!c) return;
            try {
                const buffer = await loadRecording(c, url);
                if (playing) playing.stop();
                const source = c.createBufferSource();
                source.buffer = buffer;
                source.connect(master);
                source.start();
                playing = source;
                source.onended = () => { if (playing === source) playing = null; };
            } catch {
                recordings.delete(url);
            }
        },
    };
})();
