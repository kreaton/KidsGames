// Small synthesized sound effects (Web Audio API), so no audio files are needed.
window.fridaSounds = (() => {
    let ctx;

    function audio() {
        ctx ??= new (window.AudioContext || window.webkitAudioContext)();
        // iOS/Safari start the context suspended until a user gesture.
        if (ctx.state === "suspended") ctx.resume();
        return ctx;
    }

    function tone(freq, start, duration, type, volume) {
        const ac = audio();
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        const t = ac.currentTime + start;

        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(volume, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

        osc.connect(gain).connect(ac.destination);
        osc.start(t);
        osc.stop(t + duration + 0.05);
    }

    return {
        // Rising major arpeggio: C5 E5 G5 C6
        success() {
            [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.11, 0.35, "triangle", 0.3));
        },
        // Two low, falling "uh-oh" notes
        error() {
            tone(311.13, 0, 0.22, "square", 0.12);
            tone(233.08, 0.2, 0.35, "square", 0.12);
        }
    };
})();
