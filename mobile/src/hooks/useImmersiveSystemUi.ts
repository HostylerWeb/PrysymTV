import { useEffect } from 'react';
import { Platform, StatusBar as RNStatusBar } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';

/** Hide Android/iOS system chrome while immersive video is active. */
export function useImmersiveSystemUi(immersive: boolean) {
  useEffect(() => {
    if (Platform.OS === 'android') {
      if (immersive) {
        RNStatusBar.setHidden(true, 'fade');
        void NavigationBar.setVisibilityAsync('hidden');
        void NavigationBar.setBehaviorAsync('overlay-swipe');
        return () => {
          RNStatusBar.setHidden(false, 'fade');
          void NavigationBar.setVisibilityAsync('visible');
        };
      }

      RNStatusBar.setHidden(false, 'fade');
      void NavigationBar.setVisibilityAsync('visible');
      return;
    }

    if (immersive) {
      RNStatusBar.setHidden(true, 'fade');
      return () => {
        RNStatusBar.setHidden(false, 'fade');
      };
    }

    RNStatusBar.setHidden(false, 'fade');
  }, [immersive]);
}
