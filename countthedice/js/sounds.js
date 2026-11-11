// Little synthesized sound effects, so the game needs no audio files.
// Browsers (iOS Safari in particular) only allow audio after a tap, which is
// always the case here because sounds are triggered by button presses.

let ctx;

const muteKey = "countthedice-muted";

export function isMuted() {
    try { return localStorage.getItem(muteKey) === "1"; } catch { return false; }
}

export function setMuted(muted) {
    try { localStorage.setItem(muteKey, muted ? "1" : "0"); } catch { }
}

function audio() {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
}

// One soft note: a quick attack and a smooth fade so nothing clicks or sounds harsh.
function note(freq, start, length, { type = "triangle", volume = 0.25, slideTo } = {}) {
    const ac = audio();
    const t = ac.currentTime + start;
    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + length);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length);

    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + length + 0.05);
}

// A happy rising arpeggio (C-E-G-C) followed by a sparkle.
export function playSuccess() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(f, i * 0.09, 0.3));
    note(1568, 0.38, 0.45, { type: "sine", volume: 0.15 });
    note(2093, 0.46, 0.4, { type: "sine", volume: 0.1 });
}

// A gentle, silly "boing-boing" down: clearly "not quite" without sounding scary.
export function playTryAgain() {
    note(392, 0, 0.22, { type: "sine", volume: 0.3, slideTo: 294 });
    note(330, 0.2, 0.32, { type: "sine", volume: 0.3, slideTo: 220 });
}
