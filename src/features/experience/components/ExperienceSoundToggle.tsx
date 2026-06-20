'use client';

import { useEffect, useState } from 'react';

import { isSoundEnabled, setSoundEnabled, unlockAudio } from '@/lib/sound/sound-manager';

export const ExperienceSoundToggle = () => {
  const [enabled, setEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setEnabled(isSoundEnabled());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-tier1">
      <div>
        <p className="font-[family-name:var(--font-display)] font-semibold text-neutral-900">
          Bubble sounds
        </p>
        <p className="mt-1 text-sm text-neutral-600">
          Pops and clicks when you navigate tabs and pages. Off by default.
        </p>
      </div>
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => {
          const next = e.target.checked;
          setEnabled(next);
          setSoundEnabled(next);
          if (next) unlockAudio();
        }}
        className="h-5 w-5 rounded border-neutral-300 text-brand-600 focus:ring-brand-600"
      />
    </label>
  );
};
