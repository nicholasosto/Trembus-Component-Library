// Shared, package-parameterized export verifier (run per package as
// `node ../../scripts/verify-exports.mjs [attw passthrough args]`).
//
// Why a Node script instead of `publint && attw --pack`:
//   - `attw --pack` and publint EACH run their own `pnpm pack`, both writing the
//     same <name>-<version>.tgz into the package dir → publint's async tarball
//     cleanup races attw's pack → intermittent `ENOENT … trembus-*.tgz` under
//     parallel load (`pnpm -r publish`).
//   - A shell one-liner that packs once then globs `.pack/*.tgz` is fragile:
//     pnpm's script runner does not reliably expand globs.
//
// So: pack ONCE and point both publint and attw at that single tarball. We read
// the tarball location from `pnpm pack --json` (the authoritative `filename`)
// rather than guessing it: inside `pnpm publish`'s prepublishOnly the outer run
// redirects where the nested pack writes, so `--pack-destination` + a dir listing
// is unreliable — `--json` always reports where the tarball actually landed.
// Deterministic, shell-independent, parallel-safe; exit code propagates.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const attwArgs = process.argv.slice(2).join(' ');
const dir = mkdtempSync(join(tmpdir(), 'tcl-verify-'));

const sh = (command) => spawnSync(command, { stdio: 'inherit', shell: true }).status ?? 1;

let code = 0;
let tarball;
try {
  // Pack once. Capture stdout (the JSON); pass stderr through (banners, warnings).
  const packed = spawnSync(`pnpm pack --json --pack-destination ${JSON.stringify(dir)}`, {
    encoding: 'utf8',
    shell: true,
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  const out = packed.stdout ?? '';
  if (packed.status !== 0) {
    process.stderr.write(out);
    code = packed.status ?? 1;
  } else {
    let filename;
    try {
      filename = JSON.parse(out).filename;
    } catch {
      // Defensive: if anything leaked onto stdout alongside the JSON.
      filename = (out.match(/"filename"\s*:\s*"([^"]+\.tgz)"/) ?? [])[1];
    }
    if (!filename) {
      console.error('verify-exports: could not determine packed tarball from `pnpm pack --json`:\n' + out);
      code = 1;
    } else {
      tarball = filename;
      const t = JSON.stringify(filename);
      code = sh(`publint ${t}`) || sh(`attw ${t} --profile esm-only ${attwArgs}`);
    }
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
  // The tarball may live outside `dir` if the outer publish redirected it.
  if (tarball) rmSync(tarball, { force: true });
}

process.exit(code);
