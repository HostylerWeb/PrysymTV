import { Redirect } from 'expo-router';

export default function UploadRedirect() {
  return <Redirect href="/settings/upload?type=video" />;
}
