// Web Audio API based sound synthesizer for calling features
// No external MP3 downloads required - works 100% reliably in any modern browser.

let audioCtx = null;
let outgoingInterval = null;
let incomingInterval = null;

function getAudioContext() {
  if (!audioCtx || audioCtx.state === "closed") {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Plays standard dual-tone outgoing ringback sound (440Hz + 480Hz)
 */
export function playOutgoingRingtone() {
  stopOutgoingRingtone();
  const ctx = getAudioContext();
  if (!ctx) return;

  const playToneBurst = () => {
    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(480, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
      gain.gain.setValueAtTime(0.08, now + 1.8);
      gain.gain.linearRampToValueAtTime(0, now + 2.0);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 2.0);
      osc2.stop(now + 2.0);
    } catch (e) {
      console.warn("Error playing outgoing tone burst:", e);
    }
  };

  playToneBurst();
  outgoingInterval = setInterval(playToneBurst, 4000);
}

export function stopOutgoingRingtone() {
  if (outgoingInterval) {
    clearInterval(outgoingInterval);
    outgoingInterval = null;
  }
}

/**
 * Plays a pleasant marimba-style incoming ringtone melody
 */
export function playIncomingRingtone() {
  stopIncomingRingtone();
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [
    { freq: 523.25, time: 0.00, duration: 0.18 }, // C5
    { freq: 659.25, time: 0.20, duration: 0.18 }, // E5
    { freq: 783.99, time: 0.40, duration: 0.22 }, // G5
    { freq: 1046.50, time: 0.65, duration: 0.35 }, // C6
    { freq: 783.99, time: 1.10, duration: 0.18 }, // G5
    { freq: 1046.50, time: 1.30, duration: 0.45 }, // C6
  ];

  const playChimeSequence = () => {
    try {
      const now = ctx.currentTime;
      notes.forEach(({ freq, time, duration }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0.001, now + time);
        gain.gain.exponentialRampToValueAtTime(0.12, now + time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + duration);
      });
    } catch (e) {
      console.warn("Error playing incoming chime:", e);
    }
  };

  playChimeSequence();
  incomingInterval = setInterval(playChimeSequence, 2800);
}

export function stopIncomingRingtone() {
  if (incomingInterval) {
    clearInterval(incomingInterval);
    incomingInterval = null;
  }
}

/**
 * Plays an upbeat double-tone when a call connects
 */
export function playCallConnectedSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    [
      { freq: 587.33, time: 0.0, duration: 0.12 }, // D5
      { freq: 880.00, time: 0.14, duration: 0.22 }, // A5
    ].forEach(({ freq, time, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + time);
      gain.gain.setValueAtTime(0.1, now + time);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + time);
      osc.stop(now + time + duration);
    });
  } catch (e) {
    console.warn("Error playing connected sound:", e);
  }
}

/**
 * Plays a descending chime when a call ends or is rejected
 */
export function playCallEndedSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    [
      { freq: 440.00, time: 0.0, duration: 0.15 }, // A4
      { freq: 349.23, time: 0.15, duration: 0.15 }, // F4
      { freq: 261.63, time: 0.30, duration: 0.25 }, // C4
    ].forEach(({ freq, time, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + time);
      gain.gain.setValueAtTime(0.1, now + time);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + time);
      osc.stop(now + time + duration);
    });
  } catch (e) {
    console.warn("Error playing ended sound:", e);
  }
}

