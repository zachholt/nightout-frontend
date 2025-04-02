// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver = {
    ...config.resolver,
    assetExts: [...config.resolver.assetExts, 'png', 'jpg', 'jpeg', 'gif', 'webp', 'PNG'],
  sourceExts: [...config.resolver.sourceExts, 'js', 'jsx', 'json', 'ts', 'tsx', 'cjs']
  };

module.exports = config;
