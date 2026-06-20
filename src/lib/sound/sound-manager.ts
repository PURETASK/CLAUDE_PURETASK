import {
  playUiSound,
  preloadUiSounds,
  resumeHowlerContext,
  type UiSoundId,
} from '@/lib/sound/ui-sounds';

const STORAGE_KEY = 'puretask-sound-enabled';

let audioContext: AudioContext | null = null;
let howlerPreloaded = false;

export const isSoundEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  return localStorage.getItem(STORAGE_KEY) === 'true';
};

export const setSoundEnabled = (enabled: boolean): void => {
  localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
  if (enabled && typeof window !== 'undefined') {
    ensureHowlerReady();
  }
};

export const unlockAudio = (): void => {
  if (!isSoundEnabled()) return;
  ensureHowlerReady();
  resumeHowlerContext();
  getAudioContext();
};

const ensureHowlerReady = (): void => {
  if (howlerPreloaded || typeof window === 'undefined') return;
  preloadUiSounds();
  howlerPreloaded = true;
};

const play = (id: UiSoundId, fallback: () => void): void => {
  if (!isSoundEnabled()) return;
  ensureHowlerReady();
  resumeHowlerContext();
  try {
    playUiSound(id);
  } catch {
    fallback();
  }
};

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
};

const playTone = (opts: {
  frequency: number;
  duration: number;
  type?: OscillatorType;
  gain: number;
  attack?: number;
  decay?: number;
}): void => {
  if (!isSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = opts.type ?? 'sine';
    osc.frequency.setValueAtTime(opts.frequency, now);

    const attack = opts.attack ?? 0.008;
    const decay = opts.decay ?? opts.duration;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(opts.gain, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, now + decay);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + opts.duration + 0.05);
  } catch {
    // Audio unsupported or blocked
  }
};

const playNoiseBurst = (duration: number, gain: number): void => {
  if (!isSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    source.buffer = buffer;

    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(gain, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start(now);
  } catch {
    // ignore
  }
};

export const playPop = (): void => {
  play('pop', () => {
    playNoiseBurst(0.06, 0.12);
    playTone({ frequency: 520, duration: 0.14, gain: 0.08, type: 'sine' });
    window.setTimeout(() => {
      playTone({ frequency: 880, duration: 0.1, gain: 0.05, type: 'triangle' });
    }, 40);
  });
};

export const playTab = (): void => {
  play('tab', () => {
    playTone({ frequency: 640, duration: 0.07, gain: 0.06, type: 'sine' });
  });
};

export const playClick = (): void => {
  play('click', () => {
    playTone({ frequency: 420, duration: 0.05, gain: 0.05, type: 'sine' });
  });
};

export const playModalOpen = (): void => {
  play('modal_open', () => {
    playTone({ frequency: 380, duration: 0.12, gain: 0.07, type: 'sine' });
    playTone({ frequency: 760, duration: 0.16, gain: 0.04, type: 'sine' });
  });
};

export const playModalClose = (): void => {
  play('modal_close', () => {
    playTone({ frequency: 300, duration: 0.12, gain: 0.06, type: 'sine' });
  });
};

export const playNavForward = (): void => {
  play('nav_forward', () => {
    playTone({ frequency: 400, duration: 0.08, gain: 0.06, type: 'sine' });
    window.setTimeout(() => {
      playTone({ frequency: 600, duration: 0.1, gain: 0.05, type: 'sine' });
    }, 60);
  });
};

export const playSuccess = (): void => {
  play('success', () => {
    playTone({ frequency: 523, duration: 0.1, gain: 0.07, type: 'sine' });
    window.setTimeout(
      () => playTone({ frequency: 784, duration: 0.14, gain: 0.06, type: 'sine' }),
      90,
    );
  });
};
