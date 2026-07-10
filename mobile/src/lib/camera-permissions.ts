import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';

export async function ensureLiveCameraPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return true;
  }

  if (Platform.OS === 'android') {
    const grants = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ]);
    const cameraGranted =
      grants[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
    const micGranted =
      grants[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
    if (!cameraGranted || !micGranted) {
      Alert.alert(
        'Camera & microphone required',
        'Allow camera and microphone access to broadcast live from your phone.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => void Linking.openSettings() },
        ],
      );
      return false;
    }
    return true;
  }

  const camera = await ImagePicker.requestCameraPermissionsAsync();
  const microphone = await Audio.requestPermissionsAsync();
  const granted = camera.status === 'granted' && microphone.status === 'granted';
  if (!granted) {
    Alert.alert(
      'Camera & microphone required',
      'Allow camera and microphone access in Settings to go live.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Open Settings', onPress: () => void Linking.openSettings() },
      ],
    );
  }
  return granted;
}
