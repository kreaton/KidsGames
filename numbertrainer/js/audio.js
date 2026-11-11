// One shared <audio> element; clips are fetched once and kept as data URLs so playback starts instantly.
// Data URLs rather than blob URLs: Safari on iOS plays them reliably.
const audio = new Audio();
audio.preload = 'auto';
const clips = new Map();
let pending = null;

// iOS: let sound play even when the ring/silent switch is on silent (Safari 17+).
if (navigator.audioSession) navigator.audioSession.type = 'playback';

// iOS only lets an <audio> element play from code after it has once been played inside a tap.
// Clips are started after awaits (preload, thinking time), so prime the shared element on the first tap.
let unlocked = false;

function unlock() {
    if (unlocked || pending) return;
    unlocked = true;
    audio.src = silentWav();
    audio.play().catch(e => {
        if (e.name === 'NotAllowedError') unlocked = false;
    });
}

for (const type of ['touchend', 'pointerup', 'click', 'keydown'])
    document.addEventListener(type, unlock, { capture: true, passive: true });

function silentWav() {
    const samples = 800; // 0.1 s of 8-bit mono silence at 8 kHz
    const view = new DataView(new ArrayBuffer(44 + samples));
    const text = (offset, s) => [...s].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));
    text(0, 'RIFF'); view.setUint32(4, 36 + samples, true); text(8, 'WAVE');
    text(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
    view.setUint32(24, 8000, true); view.setUint32(28, 8000, true); view.setUint16(32, 1, true); view.setUint16(34, 8, true);
    text(36, 'data'); view.setUint32(40, samples, true);
    for (let i = 0; i < samples; i++) view.setUint8(44 + i, 128);
    return 'data:audio/wav;base64,' + btoa(String.fromCharCode(...new Uint8Array(view.buffer)));
}

function toDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}

function load(url) {
    let clip = clips.get(url);
    if (!clip) {
        clip = fetch(url)
            .then(r => {
                if (!r.ok) throw new Error(`${r.status} ${url}`);
                return r.blob();
            })
            .then(toDataUrl)
            .catch(e => {
                clips.delete(url);
                throw e;
            });
        clips.set(url, clip);
    }
    return clip;
}

export function preload(urls) {
    for (const url of urls) load(url).catch(() => { });
}

export function play(url) {
    stop();
    return new Promise(resolve => {
        const finish = ok => {
            if (pending !== token) return;
            pending = null;
            audio.onended = audio.onerror = null;
            resolve(ok);
        };
        const token = { finish };
        pending = token;
        audio.onended = () => finish(true);
        audio.onerror = () => finish(false);
        load(url)
            .then(src => {
                if (pending !== token) return;
                audio.src = src;
                return audio.play();
            })
            .catch(e => {
                if (pending !== token) return; // stopped while starting; not an error
                console.warn('Could not play', url, e);
                finish(false);
            });
    });
}

export function stop() {
    audio.pause();
    pending?.finish(false);
}
