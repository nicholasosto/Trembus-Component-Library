// PostToolUse hook: format the just-edited file with Prettier.
// Receives the tool-call JSON on stdin; formats .ts/.tsx/.css/.md/.json files.
import { execSync } from 'node:child_process';
import process from 'node:process';

let data = '';
process.stdin.on('data', (c) => (data += c));
process.stdin.on('end', () => {
  let file = '';
  try {
    file = (JSON.parse(data).tool_input || {}).file_path || '';
  } catch {
    // ignore malformed input
  }
  if (file && /\.(ts|tsx|css|md|json)$/.test(file)) {
    try {
      execSync(`pnpm exec prettier --write ${JSON.stringify(file)}`, { stdio: 'ignore' });
    } catch {
      // formatting is best-effort; never block on it
    }
  }
});
