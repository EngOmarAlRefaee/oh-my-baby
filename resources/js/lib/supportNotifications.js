let audioContext = null;
let armed = false;
let unlockHandler = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) return null;

  if (!audioContext) {
    audioContext = new Context();
  }

  return audioContext;
}

export function armSupportNotificationSound() {
  if (typeof window === "undefined" || armed) return;
  armed = true;

  unlockHandler = async () => {
    const context = getAudioContext();
    if (context?.state === "suspended") {
      try { await context.resume(); } catch {}
    }

    window.removeEventListener("pointerdown", unlockHandler);
    window.removeEventListener("keydown", unlockHandler);
    unlockHandler = null;
  };

  window.addEventListener("pointerdown", unlockHandler, { passive: true });
  window.addEventListener("keydown", unlockHandler);
}

export async function playSupportNotificationSound() {
  if (typeof window === "undefined") return false;

  const context = getAudioContext();
  if (!context) return false;

  if (context.state === "suspended") {
    try { await context.resume(); } catch { return false; }
  }

  const now = context.currentTime;
  const tones = [
    { frequency: 880, start: 0, duration: 0.12 },
    { frequency: 1175, start: 0.16, duration: 0.16 },
  ];

  tones.forEach(({ frequency, start, duration }) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now + start);
    gain.gain.setValueAtTime(0.0001, now + start);
    gain.gain.exponentialRampToValueAtTime(0.16, now + start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now + start);
    oscillator.stop(now + start + duration + 0.02);
  });

  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try { navigator.vibrate([80, 50, 80]); } catch {}
  }

  return true;
}
