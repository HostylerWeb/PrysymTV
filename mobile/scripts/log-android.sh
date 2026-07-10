#!/usr/bin/env bash
adb logcat -c
echo "Watching PrysymTV logs (Ctrl+C to stop)..."
echo "Reproduce the crash on your phone now."
adb logcat ReactNativeJS:V ReactNative:V ExpoVideo:V AndroidRuntime:E Expo:V '*:S'
