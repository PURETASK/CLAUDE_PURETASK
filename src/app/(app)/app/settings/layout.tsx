import type { ReactNode } from 'react';

import { SettingsBubbleNav } from '@/features/experience/components/SettingsBubbleNav';

type Props = { children: ReactNode };

const SettingsLayout = ({ children }: Props) => (
  <div className="flex flex-col gap-6">
    <SettingsBubbleNav />
    {children}
  </div>
);

export default SettingsLayout;
