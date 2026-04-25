const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

config.resolver.extraNodeModules = {
  'agora-rn-uikit': path.resolve(workspaceRoot, 'node_modules/agora-rn-uikit'),
  'react-native-agora': path.resolve(workspaceRoot, 'node_modules/react-native-agora'),
  'agora-react-native-rtm': path.resolve(workspaceRoot, 'node_modules/agora-react-native-rtm'),
};

// 3. Re-configure to correctly find react-native
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
