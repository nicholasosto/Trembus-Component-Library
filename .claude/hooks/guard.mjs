// PreToolUse hook: block hand-edits to generated artifacts and the lockfile.
// Receives the tool-call JSON on stdin; exit 2 blocks the edit and surfaces the message.
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
  if (/(\/dist\/|\/storybook-static\/|pnpm-lock\.yaml$)/.test(file)) {
    console.error('Blocked: generated/lock file — regenerate via pnpm, do not hand-edit.');
    process.exit(2);
  }
});
