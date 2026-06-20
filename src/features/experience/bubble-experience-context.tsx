'use client';

import { usePathname } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { isSoundEnabled, playPop, playTab, unlockAudio } from '@/lib/sound/sound-manager';
import { preloadUiSounds } from '@/lib/sound/ui-sounds';

import type { BubblePhase, BubbleTransitionReason } from './types';

type BubbleExperienceContextValue = {
  phase: BubblePhase;
  contentVisible: boolean;
  triggerPop: (reason?: BubbleTransitionReason) => void;
  registerPopHandler: (handler: (() => void) | null) => void;
};

const BubbleExperienceContext = createContext<BubbleExperienceContextValue | null>(null);

const POP_MS = 480;
const ENTER_MS = 560;

export const BubbleExperienceProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const [phase, setPhase] = useState<BubblePhase>('idle');
  const [contentVisible, setContentVisible] = useState(true);
  const isFirstPath = useRef(true);
  const manualPopHandler = useRef<(() => void) | null>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  const runPopSequence = useCallback((reason: BubbleTransitionReason) => {
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    clearTimers();

    if (reducedMotion) {
      setContentVisible(false);
      timers.current.push(
        window.setTimeout(() => {
          setContentVisible(true);
        }, 120),
      );
      return;
    }

    setPhase('popping');
    setContentVisible(false);

    if (reason === 'tab') {
      playTab();
    } else {
      playPop();
    }

    manualPopHandler.current?.();

    timers.current.push(
      window.setTimeout(() => {
        setPhase('entering');
        setContentVisible(true);
      }, POP_MS),
    );

    timers.current.push(
      window.setTimeout(() => {
        setPhase('idle');
      }, POP_MS + ENTER_MS),
    );
  }, []);

  const triggerPop = useCallback(
    (reason: BubbleTransitionReason = 'navigation') => {
      unlockAudio();
      runPopSequence(reason);
    },
    [runPopSequence],
  );

  const registerPopHandler = useCallback((handler: (() => void) | null) => {
    manualPopHandler.current = handler;
  }, []);

  useEffect(() => {
    if (isFirstPath.current) {
      isFirstPath.current = false;
      return;
    }
    runPopSequence('navigation');
    return clearTimers;
  }, [pathname, runPopSequence]);

  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    if (isSoundEnabled()) preloadUiSounds();
  }, []);

  const value = useMemo(
    () => ({ phase, contentVisible, triggerPop, registerPopHandler }),
    [phase, contentVisible, triggerPop, registerPopHandler],
  );

  return (
    <BubbleExperienceContext.Provider value={value}>{children}</BubbleExperienceContext.Provider>
  );
};

export const useBubbleExperience = (): BubbleExperienceContextValue => {
  const ctx = useContext(BubbleExperienceContext);
  if (!ctx) {
    throw new Error('useBubbleExperience must be used within BubbleExperienceProvider');
  }
  return ctx;
};
