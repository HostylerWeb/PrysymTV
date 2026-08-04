const { withAndroidManifest, AndroidConfig } = require('expo/config-plugins');

/** Colored app icon on the left of the notification row (Expo reads this meta-data key). */
function withNotificationLargeIcon(config) {
  return withAndroidManifest(config, (config) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(
      config.modResults,
    );
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      mainApplication,
      'expo.modules.notifications.large_notification_icon',
      '@drawable/notification_large_icon',
      'resource',
    );
    return config;
  });
}

module.exports = withNotificationLargeIcon;
