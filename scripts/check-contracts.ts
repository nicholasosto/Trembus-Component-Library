/**
 * First-principles contract checker — the CI gate that enforces the "3 jobs"
 * discipline against a SINGLE source of truth (each component's *.contract.ts).
 * It does NOT restate the rules; it validates that every component:
 *   1. has the canonical 5-file shape,
 *   2. ships a contract declaring all three irreducible UI jobs,
 *   3. has a Storybook story for each job (the contract's claim is demonstrated),
 *   4. is exported from the package's public barrel (src/index.ts).
 *
 * Workspace-aware: scans every package in the registry, or one named package.
 *   pnpm check:contracts            # all packages
 *   tsx scripts/check-contracts.ts ui   # just @trembus/ui
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import type { ComponentContract } from '../packages/tokens/src/contract';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Package key → source root (relative to the repo root). Each package exposing
// contracted components keeps them under src/components/ and re-exports from
// src/index.ts.
const PACKAGES: Record<string, string> = {
  ui: 'packages/ui',
  viz: 'packages/viz',
};

const errors: string[] = [];
const ok: string[] = [];

function collectBarrelExports(indexPath: string): Set<string> {
  const text = readFileSync(indexPath, 'utf8');
  const names = new Set<string>();
  for (const m of text.matchAll(/export\s*\{([\s\S]*?)\}/g)) {
    for (const part of m[1].split(',')) {
      const id = part
        .trim()
        .split(/\s+as\s+/)[0]
        .trim();
      if (id) names.add(id);
    }
  }
  return names;
}

function storyExports(storiesText: string): Set<string> {
  const names = new Set<string>();
  for (const m of storiesText.matchAll(/export\s+const\s+(\w+)\s*[:=]/g)) {
    names.add(m[1]);
  }
  return names;
}

async function checkPackage(label: string, pkgRoot: string): Promise<void> {
  const componentsDir = join(pkgRoot, 'src', 'components');
  const indexPath = join(pkgRoot, 'src', 'index.ts');
  // A package with no contracted components yet (e.g. a freshly scaffolded one)
  // is valid — nothing to check.
  if (!existsSync(componentsDir)) return;

  const barrel = existsSync(indexPath) ? collectBarrelExports(indexPath) : new Set<string>();
  const dirs = readdirSync(componentsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const name of dirs) {
    const tag = `${label}/${name}`;
    const dir = join(componentsDir, name);
    const required = [
      `${name}.tsx`,
      `${name}.css`,
      `${name}.contract.ts`,
      `${name}.stories.tsx`,
      `${name}.test.tsx`,
    ];
    const missing = required.filter((f) => !existsSync(join(dir, f)));
    if (missing.length) {
      errors.push(`${tag}: missing required file(s): ${missing.join(', ')}`);
      continue;
    }

    // 2. Contract presence + shape.
    const contractMod = (await import(pathToFileURL(join(dir, `${name}.contract.ts`)).href)) as {
      default?: ComponentContract;
    };
    const contract = contractMod.default;
    if (!contract) {
      errors.push(`${tag}: ${name}.contract.ts has no default export`);
      continue;
    }
    const jobKeys = ['revealState', 'affordAction', 'acknowledgeInput'] as const;
    const stories = storyExports(readFileSync(join(dir, `${name}.stories.tsx`), 'utf8'));

    for (const job of jobKeys) {
      const sat = contract.jobs?.[job];
      if (!sat?.satisfiedBy || !sat?.story) {
        errors.push(`${tag}: contract job "${job}" must declare satisfiedBy + story`);
        continue;
      }
      // 3. The named story must exist.
      if (!stories.has(sat.story)) {
        errors.push(
          `${tag}: contract job "${job}" references story "${sat.story}" which is not exported in ${name}.stories.tsx`,
        );
      }
    }

    if (contract.name !== name) {
      errors.push(`${tag}: contract.name "${contract.name}" does not match directory "${name}"`);
    }

    // 4. Public export.
    if (!barrel.has(name)) {
      errors.push(`${tag}: not exported from ${label}'s src/index.ts`);
    }

    if (!errors.some((e) => e.startsWith(`${tag}:`))) {
      ok.push(tag);
    }
  }
}

async function main(): Promise<void> {
  const arg = process.argv[2];
  const keys = arg ? [arg] : Object.keys(PACKAGES);

  for (const key of keys) {
    const pkgRoot = PACKAGES[key];
    if (!pkgRoot) {
      errors.push(`unknown package "${key}" (known: ${Object.keys(PACKAGES).join(', ')})`);
      continue;
    }
    await checkPackage(key, join(root, pkgRoot));
  }

  if (ok.length) {
    console.log(`✓ contracts valid: ${ok.join(', ')}`);
  }
  if (errors.length) {
    console.error('\n✗ contract check failed:');
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`\nAll ${ok.length} component contract(s) satisfy the three UI jobs.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
