import { Redirect } from 'expo-router';

/** Mirrors web /advertisers → /advertise?register=1 */
export default function AdvertisersRedirect() {
  return <Redirect href="/advertise?register=1" />;
}
