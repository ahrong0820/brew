type AudioContextConstructor = new () => AudioContext;

let sharedAudioContext: AudioContext | null = null;
let cleanupRegistered = false;

function audioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === "undefined") return null;
  const audioWindow = window as typeof window & {
    webkitAudioContext?: AudioContextConstructor;
  };
  return (window.AudioContext ?? audioWindow.webkitAudioContext) || null;
}

async function getAudioContext() {
  if (sharedAudioContext?.state === "closed") sharedAudioContext = null;
  if (!sharedAudioContext) {
    const Constructor = audioContextConstructor();
    if (!Constructor) return null;
    sharedAudioContext = new Constructor();
  }

  if (!cleanupRegistered && typeof window !== "undefined") {
    cleanupRegistered = true;
    window.addEventListener("pagehide", () => {
      void disposeSmartAlertAudio();
    });
  }

  if (sharedAudioContext.state === "suspended") {
    await sharedAudioContext.resume();
  }
  return sharedAudioContext;
}

export async function playStepTone() {
  try {
    const audioContext = await getAudioContext();
    if (!audioContext) return false;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const cleanup = () => {
      try {
        oscillator.disconnect();
        gain.disconnect();
      } catch {
        // The browser may already have disconnected the short-lived nodes.
      }
    };

    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.18);
    oscillator.addEventListener("ended", cleanup, { once: true });
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
    return true;
  } catch {
    return false;
  }
}

export function vibrateStepCue() {
  if (typeof navigator === "undefined") return false;
  try {
    return navigator.vibrate?.([80, 40, 80]) ?? false;
  } catch {
    return false;
  }
}

export function runSmartAlert() {
  void playStepTone();
  vibrateStepCue();
}

export async function disposeSmartAlertAudio() {
  const context = sharedAudioContext;
  sharedAudioContext = null;
  if (!context || context.state === "closed") return;
  try {
    await context.close();
  } catch {
    // Audio cleanup must never interrupt the brewing UI.
  }
}
