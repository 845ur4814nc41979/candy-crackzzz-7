let audioCtx: AudioContext | null = null;
let unlocked = false;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (audioCtx) return audioCtx;
  const Ctor: typeof AudioContext | undefined =
    (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    audioCtx = new Ctor();
  } catch {
    audioCtx = null;
  }
  return audioCtx;
}

export function unlockNotificationAudio(): boolean {
  const ctx = getCtx();
  if (!ctx) return false;
  if (ctx.state === 'suspended') {
    void ctx.resume().catch(() => undefined);
  }
  try {
    const buffer = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.start(0);
  } catch {
    // ignore
  }
  unlocked = true;
  return true;
}

export function canPlayNotificationAudio(): boolean {
  const ctx = getCtx();
  if (!ctx) return false;
  return unlocked && ctx.state !== 'suspended';
}

function clampVolume(v: number): number {
  if (!Number.isFinite(v)) return 0.7;
  return Math.max(0, Math.min(1, v));
}

interface ToneSpec {
  frequency: number;
  duration: number;
  delay: number;
  type?: OscillatorType;
}

function playTones(specs: ToneSpec[], volume: number): void {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    void ctx.resume().catch(() => undefined);
  }
  const masterGain = ctx.createGain();
  masterGain.gain.value = clampVolume(volume);
  masterGain.connect(ctx.destination);

  const now = ctx.currentTime;
  for (const spec of specs) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = spec.type ?? 'sine';
    osc.frequency.value = spec.frequency;
    const start = now + spec.delay;
    const end = start + spec.duration;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.9, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(start);
    osc.stop(end + 0.02);
  }
}

export function playOrderNotificationSound(volume = 0.7): void {
  // Bright two-note chime: G5 -> C6
  playTones(
    [
      { frequency: 784, duration: 0.18, delay: 0, type: 'triangle' },
      { frequency: 1047, duration: 0.28, delay: 0.18, type: 'triangle' },
    ],
    volume,
  );
}

export function playMessageNotificationSound(volume = 0.7): void {
  // Soft double ping: E5 short, then E5 again softer
  playTones(
    [
      { frequency: 659, duration: 0.12, delay: 0, type: 'sine' },
      { frequency: 880, duration: 0.18, delay: 0.13, type: 'sine' },
    ],
    volume,
  );
}

export function playGeneralNotificationSound(volume = 0.7): void {
  // Short neutral beep: A5
  playTones(
    [{ frequency: 880, duration: 0.18, delay: 0, type: 'square' }],
    volume * 0.6,
  );
}
