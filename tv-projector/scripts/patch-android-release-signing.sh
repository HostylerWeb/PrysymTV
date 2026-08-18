#!/usr/bin/env bash
# Re-apply release signing block after `npm run prebuild`.
# Safe to run multiple times.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GRADLE="$ROOT/android/app/build.gradle"

if [[ ! -f "$GRADLE" ]]; then
  echo "Missing $GRADLE — run: npm run prebuild" >&2
  exit 1
fi

if grep -q "keystorePropertiesFile" "$GRADLE"; then
  echo "Release signing already configured in build.gradle"
  exit 0
fi

python3 - "$GRADLE" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
text = path.read_text()

inject_before_android = """def keystorePropertiesFile = rootProject.file('keystore.properties')
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

"""

old_signing = """    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug"""

new_signing = """    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            signingConfig keystorePropertiesFile.exists()
                ? signingConfigs.release
                : signingConfigs.debug"""

if "keystorePropertiesFile" in text:
    print("Already patched")
    sys.exit(0)

if "android {" not in text:
    raise SystemExit("Could not find android { block")

text = text.replace("android {", inject_before_android + "android {", 1)
if old_signing not in text:
    raise SystemExit("Could not find default signingConfigs block — patch manually")

text = text.replace(old_signing, new_signing, 1)
path.write_text(text)
print("Patched", path)
PY

echo "Done. Ensure android/keystore.properties and android/app/prysymtv-tv-release.keystore exist."
