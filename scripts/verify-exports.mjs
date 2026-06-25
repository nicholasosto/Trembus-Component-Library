// Shared, package-parameterized export verifier (run per package as
// `node ../../scripts/verify-exports.mjs [attw passthrough args]`).
//
// Why a Node script instead of `publint && attw --pack`:
//   - `attw --pack` and publint EACH run their own `pnpm pack`, both writing the
//     same <name>-<version>.tgz into the package dir → publint's async tarball
//     cleanup races attw's pack → intermittent `ENOENT … trembus-*.tgz` under
//     parallel load (`pnpm -r publish`).
//   - A shell one-liner that packs once then globs `.pack/*.tgz` is fragile too:
//     pnpm's script runner does not reliably expand globs, so the tools receive
//     the literal `*.tgz`.
// So: pack ONCE into an isolated temp dir, discover the tarball via `fs` (no
// glob), and point both publint and attw at that single file. Deterministic,
// shell-independent, and parallel-safe (each package gets its own mkdtemp dir).
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const attwArgs = process.argv.slice(2).join(' ');
const dir = mkdtempSync(join(tmpdir(), 'tcl-verify-'));

const sh = (command, opts = {}) =>
  spawnSync(command, { stdio: 'inherit', shell: true, ...opts }).status ?? 1;

let code = 0;
try {
  // Pack the current package (cwd) once. Ignore stdout so the pnpm update-notifier
  // banner can't interfere; we locate the tarball from disk, not from stdout.
  const packed = spawnSync(`pnpm pack --pack-destination ${JSON.stringify(dir)}`, {
    stdio: ['ignore', 'ignore', 'inherit'],
    shell: true,
  });
  if (packed.status !== 0) {
    code = packed.status ?? 1;
  } else {
    const tgz = readdirSync(dir).find((f) => f.endsWith('.tgz'));
    if (!tgz) {
      console.error('verify-exports: pnpm pack produced no tarball');
      code = 1;
    } else {
      const tarball = JSON.stringify(join(dir, tgz));
      code = sh(`publint ${tarball}`) || sh(`attw ${tarball} --profile esm-only ${attwArgs}`);
    }
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}

process.exit(code);
