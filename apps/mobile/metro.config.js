// Metro config tuned for the Sintara CRM pnpm monorepo.
// Lets the mobile app resolve packages hoisted to the workspace root.
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the whole monorepo so shared packages trigger reloads.
config.watchFolders = [workspaceRoot];

// Resolve modules from the app first, then from the workspace root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// pnpm uses symlinks; Metro must follow them.
config.resolver.unstable_enableSymlinks = true;
config.resolver.disableHierarchicalLookup = false;

module.exports = withNativeWind(config, { input: './global.css' });
