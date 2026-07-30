// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// When enabled, Metro resolves TV-specific file extensions (e.g. *.tv.tsx)
if (process.env?.EXPO_TV === '1') {
  const originalSourceExts = config.resolver.sourceExts;
  config.resolver.sourceExts = [
    ...originalSourceExts.map((e) => `tv.${e}`),
    ...originalSourceExts,
  ];
}

module.exports = config;
