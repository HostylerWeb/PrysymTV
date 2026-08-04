#!/usr/bin/env node
/**
 * Generates two Android notification drawables:
 *   notification_icon       – small status-bar icon: white ▶ on transparent (SVG source)
 *   notification_large_icon – shade large icon: full-colour flat PNG of the app logo
 *
 * The large icon MUST be a plain PNG drawable, NOT @mipmap/ic_launcher (adaptive
 * icons are XML composites; BitmapFactory.decodeResource returns null for them,
 * which is why the logo was missing from the notification shade).
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SMALL_SIZES = { mdpi: 24, hdpi: 36, xhdpi: 48, xxhdpi: 72, xxxhdpi: 96 };
// Large-icon sizes follow the same density buckets but are much bigger
const LARGE_SIZES = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };

const root = path.resolve(__dirname, '..');
const svgSource = path.join(root, 'assets', 'notification-icon.svg');
const logoSource = path.join(root, 'assets', 'icon.png');
const resRoot = path.join(root, 'android', 'app', 'src', 'main', 'res');

async function main() {
  if (!fs.existsSync(svgSource)) {
    console.error('Missing', svgSource);
    process.exit(1);
  }
  if (!fs.existsSync(logoSource)) {
    console.error('Missing', logoSource);
    process.exit(1);
  }

  // Small icon asset (used by app.json expo-notifications plugin)
  await fs.promises.writeFile(
    path.join(root, 'assets', 'notification-icon.png'),
    await sharp(svgSource).resize(96, 96).png().toBuffer(),
  );

  // Small icon drawables
  for (const [folder, size] of Object.entries(SMALL_SIZES)) {
    const dir = path.join(resRoot, `drawable-${folder}`);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(
      path.join(dir, 'notification_icon.png'),
      await sharp(svgSource).resize(size, size).png().toBuffer(),
    );
    console.log(`notification_icon.png       → drawable-${folder} (${size}px)`);
  }

  // Large icon drawables (full-colour flat PNG — required for BitmapFactory)
  for (const [folder, size] of Object.entries(LARGE_SIZES)) {
    const dir = path.join(resRoot, `drawable-${folder}`);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(
      path.join(dir, 'notification_large_icon.png'),
      await sharp(logoSource).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(),
    );
    console.log(`notification_large_icon.png → drawable-${folder} (${size}px)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
