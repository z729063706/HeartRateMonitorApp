const path = require("path");
const { mkdirSync } = require("fs");

const PROJECT_ROOT = path.resolve(__dirname, "..");

const outDir = path.resolve(PROJECT_ROOT, ".vscode", ".react");

mkdirSync(outDir, { recursive: true });

require("child_process").execSync(`node node_modules/react-native/local-cli/cli.js start`, {
  cwd: PROJECT_ROOT,
  stdio: "inherit"
});
