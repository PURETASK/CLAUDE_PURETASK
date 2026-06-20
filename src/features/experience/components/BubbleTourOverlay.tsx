'use client';

import Image from 'next/image';
import { useEffect, useRef, type ReactNode } from 'react';

import { useFocusTrap, useLockBodyScroll } from '@/features/experience/hooks/use-focus-trap';
import { playModalOpen, unlockAudio } from '@/lib/sound/sound-manager';

type Props = {
  open: boolean;
  children: ReactNode;
  panelClassName?: string;
};

/** Full-screen tour shell using bubble lens styling. */
export const BubbleTourOverlay = ({ open, children, panelClassName = '' }: Props) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useLockBodyScroll(open);
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;
    unlockAudio();
    playModalOpen();
    panelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="bubble-modal-backdrop z-[110]" role="presentation">
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`bubble-modal-lens bubble-modal-lens--tour mx-auto max-w-sm outline-none ${panelClassName}`}
      >
        {children}
      </div>
    </div>
  );
};

type SlideProps = {
  icon: string;
  title: string;
  body: string;
  bgClass?: string;
  iconBgClass?: string;
};

export const BubbleTourSlide = ({
  icon,
  title,
  body,
  bgClass = 'bg-brand-50',
  iconBgClass = 'bg-brand-100',
}: SlideProps) => (
  <div className={`rounded-3xl p-8 ${bgClass}`}>
    <div
      className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl ${iconBgClass}`}
    >
      <Image src={icon} alt="" width={40} height={40} className="object-contain" />
    </div>
    <h2 className="text-center text-xl font-bold text-neutral-900">{title}</h2>
    <p className="mt-2 text-center text-sm text-neutral-600">{body}</p>
  </div>
);
