// Plays the spoken town and sight names (wwwroot/audio/*.mp3), a short happy chime for a right
// answer, and remembers the sound setting.
// One <audio> element is reused, so a new name cuts off the one before it.
window.byer = {
    _audio: null,
    _ctx: null,
    _quietUntil: 0,     // a name waits until the chime is over
    _timer: 0,

    play(src) {
        clearTimeout(this._timer);
        const wait = this._quietUntil - performance.now();
        if (wait > 0) {
            this._timer = setTimeout(() => this.play(src), wait);
            return;
        }
        try {
            const a = this._audio ??= new Audio();
            a.pause();
            a.src = src;
            const p = a.play();
            if (p) p.catch(() => { /* blocked or missing file: stay quiet */ });
        } catch { }
    },

    stop() {
        clearTimeout(this._timer);
        try { this._audio?.pause(); } catch { }
    },

    // A bright rising "ding-ding-ding!" (C6, E6, G6, then C7), made with Web Audio - no sound file.
    cheer() {
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            const c = this._ctx ??= new Ctx();
            if (c.state === "suspended") c.resume();
            this._audio?.pause();

            const notes = [1046.5, 1318.5, 1568.0, 2093.0];
            notes.forEach((freq, i) => {
                const t = c.currentTime + 0.02 + i * 0.085;
                const last = i === notes.length - 1;
                const length = last ? 0.45 : 0.18;
                for (const [type, mult, vol] of [["triangle", 1, 0.32], ["sine", 2, 0.08]]) {
                    const osc = c.createOscillator();
                    const gain = c.createGain();
                    osc.type = type;
                    osc.frequency.value = freq * mult;
                    gain.gain.setValueAtTime(0.0001, t);
                    gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
                    gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
                    osc.connect(gain).connect(c.destination);
                    osc.start(t);
                    osc.stop(t + length + 0.05);
                }
            });
            this._quietUntil = performance.now() + 650;
        } catch { }
    },

    load(key) {
        try { return localStorage.getItem(key); } catch { return null; }
    },

    save(key, value) {
        try { localStorage.setItem(key, value); } catch { }
    }
};
