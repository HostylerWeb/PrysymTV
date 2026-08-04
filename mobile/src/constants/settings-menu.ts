/** Mirrors web ProfileSettingsScreen + settings menu items */
export type SettingsScreen =
  | 'menu'
  | 'notifications'
  | 'dashboard'
  | 'help'
  | 'premium'
  | 'history'
  | 'go-live'
  | 'upload'
  | 'verticals'
  | 'podcasts'
  | 'playlists'
  | 'social'
  | 'shipping';

export const SETTINGS_MENU: {
  screen: SettingsScreen;
  label: string;
  route: string;
  icon: string;
}[] = [
  { screen: 'notifications', label: 'Notifications', route: '/settings/notifications', icon: 'notifications-outline' },
  { screen: 'dashboard', label: 'Performance & Revenue', route: '/settings/dashboard', icon: 'bar-chart-outline' },
  { screen: 'premium', label: 'Premium & coins', route: '/premium', icon: 'diamond-outline' },
  { screen: 'history', label: 'Watch history', route: '/history', icon: 'time-outline' },
  { screen: 'shipping', label: 'Shipping details', route: '/settings/shipping', icon: 'cube-outline' },
  { screen: 'upload', label: 'Upload', route: '/settings/upload', icon: 'cloud-upload-outline' },
  { screen: 'go-live', label: 'Go live', route: '/go-live', icon: 'radio-outline' },
  { screen: 'verticals', label: 'Verticals', route: '/settings/verticals', icon: 'grid-outline' },
  { screen: 'podcasts', label: 'Podcasts', route: '/settings/podcasts', icon: 'headset-outline' },
  { screen: 'playlists', label: 'Playlists', route: '/settings/playlists', icon: 'list-outline' },
  { screen: 'social', label: 'Social links', route: '/settings/social', icon: 'link-outline' },
  { screen: 'help', label: 'Help & support', route: '/help', icon: 'help-circle-outline' },
];

export const LEGAL_LINKS = [
  { label: 'Terms of Service', route: '/terms' },
  { label: 'Privacy Policy', route: '/privacy' },
  { label: 'Cookie Policy', route: '/cookies' },
  { label: 'Community Guidelines', route: '/guidelines' },
  { label: 'Advertise', route: '/advertise' },
];
