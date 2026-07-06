#!/usr/bin/env bash
adb logcat -c
echo "Watching PrysymTV logs (Ctrl+C to stop)..."
adb logcat ReactNativeJS:V ReactNative:V unknown:ReactHost:E unknown:BridgelessReact:W AndroidRuntime:E Expo:V '*:S'
