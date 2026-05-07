import { redirect } from 'next/navigation';

const LegacySettingsPage = () => {
  redirect('/settings');
};

export default LegacySettingsPage;
