import { Howl, Howler } from 'howler';

export type UiSoundId =
  | 'pop'
  | 'tab'
  | 'click'
  | 'modal_open'
  | 'modal_close'
  | 'nav_forward'
  | 'success';

const UI_SOUND_SRC: Record<UiSoundId, string> = {
  pop: '/sounds/ui/pop.wav',
  tab: '/sounds/ui/tab.wav',
  click: '/sounds/ui/click.wav',
  modal_open: '/sounds/ui/modal_open.wav',
  modal_close: '/sounds/ui/modal_close.wav',
  nav_forward: '/sounds/ui/nav_forward.wav',
  success: '/sounds/ui/success.wav',
};

const DEFAULT_VOLUME = 0.4;

const registry = new Map<UiSoundId, Howl>();

const getHowl = (id: UiSoundId): Howl => {
  let howl = registry.get(id);
  if (!howl) {
    howl = new Howl({
      src: [UI_SOUND_SRC[id]],
      volume: DEFAULT_VOLUME,
      preload: true,
      html5: false,
    });
    registry.set(id, howl);
  }
  return howl;
};

export const preloadUiSounds = (): void => {
  if (typeof window === 'undefined') return;
  (Object.keys(UI_SOUND_SRC) as UiSoundId[]).forEach((id) => {
    getHowl(id).load();
  });
};

export const resumeHowlerContext = (): void => {
  const ctx = Howler.ctx;
  if (ctx?.state === 'suspended') {
    void ctx.resume();
  }
};

export const playUiSound = (id: UiSoundId): void => {
  try {
    getHowl(id).play();
  } catch {
    // Howler unavailable or blocked
  }
};
