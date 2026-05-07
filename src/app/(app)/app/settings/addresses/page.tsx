import { redirect } from 'next/navigation';

const LegacyAddressesPage = () => {
  redirect('/settings/addresses');
};

export default LegacyAddressesPage;
