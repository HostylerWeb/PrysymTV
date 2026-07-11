const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const legalRoot = path.resolve(workspaceRoot, 'lib/legal');

const config = getDefaultConfig(projectRoot);

// Watch mobile + shared legal docs only (not the whole monorepo — avoids inotify ENOSPC).
config.watchFolders = [projectRoot, legalRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.extraNodeModules = {
  '@legal': legalRoot,
};

module.exports = config;
