const fs = require('fs');
const path = require('path');

const podspecPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo',
  'node_modules',
  'expo-constants',
  'ios',
  'EXConstants.podspec',
);

if (!fs.existsSync(podspecPath)) {
  process.exit(0);
}

const original = fs.readFileSync(podspecPath, 'utf8');
const patched = original
  .replace(
    'env_vars = ENV[\'PROJECT_ROOT\'] ? "PROJECT_ROOT=#{ENV[\'PROJECT_ROOT\']} " : ""',
    'env_vars = ENV[\'PROJECT_ROOT\'] ? "export PROJECT_ROOT=\\"#{ENV[\'PROJECT_ROOT\']}\\"\\n" : ""',
  )
  .replace(
    ':script => "bash -l -c \\"#{env_vars}$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh\\"",',
    ':script => "#{env_vars}bash -l \\"$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh\\"",',
  );

if (patched !== original) {
  fs.writeFileSync(podspecPath, patched);
  console.log('Patched expo-constants iOS podspec for project paths with spaces.');
}
