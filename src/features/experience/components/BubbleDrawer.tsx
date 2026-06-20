'use client';

import { useCallback, useEffect, useId, useRef, type ReactNode } from 'react';

import { useFocusTrap, useLockBodyScroll } from '@/features/experience/hooks/use-focus-trap';
import { playModalClose, playModalOpen, unlockAudio } from '@/lib/sound/sound-manager';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  description?: string;
  footer?: ReactNode;
};

/** Slide-up bubble panel — payment flows, mobile-first sheets. */
export const BubbleDrawer = ({ open, onClose, title, children, description, footer }: Props) => {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    playModalClose();
    onClose();
  }, [onClose]);

  useFocusTrap(panelRef, open);
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;
    unlockAudio();
    playModalOpen();
    panelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, handleClose]);

  if (!open) return null;

  return (
    <div
      className="bubble-drawer-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className="bubble-drawer-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bubble-drawer-panel__handle" aria-hidden />
        <div className="border-b border-neutral-200/80 px-5 pb-4 pt-2">
          <h2
            id={titleId}
            className="font-[family-name:var(--font-display)] text-lg font-bold text-brand-900"
          >
            {title}
          </h2>
          {description ? (
            <p id={descId} className="mt-1 text-sm text-neutral-600">
              {description}
            </p>
          ) : null}
        </div>
        <div className="max-h-[50vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <div className="border-t border-neutral-200/80 px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
};
