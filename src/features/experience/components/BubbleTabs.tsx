'use client';

import type { ReactNode } from 'react';

import { useBubbleExperience } from '@/features/experience/bubble-experience-context';
import { unlockAudio } from '@/lib/sound/sound-manager';

export type BubbleTab = {
  id: string;
  label: string;
  panel: ReactNode;
};

type Props = {
  tabs: BubbleTab[];
  activeId: string;
  onChange: (id: string) => void;
};

export const BubbleTabs = ({ tabs, activeId, onChange }: Props) => {
  const { triggerPop } = useBubbleExperience();
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];

  return (
    <section>
      <div className="bubble-tabs__list" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === activeId}
            className={`bubble-tabs__trigger ${tab.id === activeId ? 'bubble-tabs__trigger--active' : ''}`}
            onClick={() => {
              if (tab.id === activeId) return;
              unlockAudio();
              triggerPop('tab');
              window.setTimeout(() => onChange(tab.id), 100);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-6" role="tabpanel">
        {active?.panel}
      </div>
    </section>
  );
};
