import type { ReactNode } from 'react';

type Props = { children: ReactNode };

/** Settings pages render their own headers/back links; the hub at /app/settings is the index. */
const SettingsLayout = ({ children }: Props) => <>{children}</>;

export default SettingsLayout;
