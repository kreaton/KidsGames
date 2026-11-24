// Speech (wwwroot/audio/*.mp3), the small success / try-again sounds (Web Audio, no sound files),
// and localStorage for the settings.
// One <audio> element is reused, so a new sound cuts off the one before it.
window.friends = {
    _audio: null,
    _ctx: null,
    _done: null,        // resolves the promise of the sound that is playing
    _quietUntil: 0,     // speech waits until an effect sound is over

    // Plays a file; the promise resolves when it has ended, failed, or was cut off.
    play(src) {
        this.stop();
        return new Promise(resolve => {
            this._done = resolve;
            const start = () => {
                if (this._done !== resolve) return resolve();
                try {
                    const a = this._audio ??= new Audio();
                    a.onended = a.onerror = a.onpause = () => this._finish(resolve);
                    a.src = src;
                    const p = a.play();
                    if (p) p.catch(() => this._finish(resolve));   // blocked or missing file: stay quiet
                } catch { this._finish(resolve); }
            };
            const wait = this._quietUntil - performance.now();
            if (wait > 0) setTimeout(start, wait); else start();
        });
    },

    _finish(resolve) {
        if (this._done === resolve) this._done = null;
        resolve();
    },

    stop() {
        const done = this._done;
        this._done = null;
        try {
            if (this._audio) {
                this._audio.onended = this._audio.onerror = this._audio.onpause = null;
                this._audio.pause();
            }
        } catch { }
        if (done) done();
    },

    _context() {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        const c = this._ctx ??= new Ctx();
        if (c.state === "suspended") c.resume();
        return c;
    },

    // notes: [frequency, start (s), length (s), volume]
    _tones(notes, wave = "triangle") {
        try {
            const c = this._context();
            if (!c) return;
            let end = 0;
            for (const [freq, at, length, vol] of notes) {
                const t = c.currentTime + 0.02 + at;
                end = Math.max(end, at + length);
                for (const [type, mult, v] of [[wave, 1, vol], ["sine", 2, vol * 0.25]]) {
                    const osc = c.createOscillator();
                    const gain = c.createGain();
                    osc.type = type;
                    osc.frequency.value = freq * mult;
                    gain.gain.setValueAtTime(0.0001, t);
                    gain.gain.exponentialRampToValueAtTime(v, t + 0.012);
                    gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
                    osc.connect(gain).connect(c.destination);
                    osc.start(t);
                    osc.stop(t + length + 0.05);
                }
            }
            this._quietUntil = performance.now() + end * 1000 + 60;
        } catch { }
    },

    // A bright little "ding-ding!" (E6, then A6).
    success() {
        this.stop();
        this._tones([[1318.5, 0, 0.16, 0.3], [1760.0, 0.09, 0.4, 0.3]]);
    },

    // A soft, friendly "boop-boop" going down - not a harsh buzzer.
    fail() {
        this.stop();
        this._tones([[392.0, 0, 0.16, 0.22], [311.1, 0.14, 0.3, 0.22]], "sine");
    },

    // End of a round: a happy rising run (C, E, G, C).
    fanfare() {
        this.stop();
        this._tones([[523.3, 0, 0.18, 0.28], [659.3, 0.12, 0.18, 0.28], [784.0, 0.24, 0.18, 0.28], [1046.5, 0.36, 0.6, 0.3]]);
    },

    // The Check language pane: ← and → step, space plays, Escape closes. Keys typed in a list or slider
    // are left to it, and space on a button is the button's own click.
    _keys: null,
    listenKeys(dotnet) {
        this.unlistenKeys();
        this._keys = e => {
            const tag = e.target?.tagName;
            if (tag === "SELECT" || tag === "INPUT" || e.altKey || e.ctrlKey || e.metaKey) return;
            const key = e.key === "ArrowLeft" ? "prev" : e.key === "ArrowRight" ? "next"
                : e.key === "Escape" ? "close" : e.key === " " && tag !== "BUTTON" ? "play" : null;
            if (!key) return;
            e.preventDefault();
            dotnet.invokeMethodAsync("Key", key);
        };
        document.addEventListener("keydown", this._keys);
    },
    unlistenKeys() {
        if (this._keys) document.removeEventListener("keydown", this._keys);
        this._keys = null;
    },

    load(key) {
        try { return localStorage.getItem(key); } catch { return null; }
    },

    save(key, value) {
        try { localStorage.setItem(key, value); } catch { }
    }
};
