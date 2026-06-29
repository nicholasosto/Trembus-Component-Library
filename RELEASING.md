# Releasing the `@trembus/*` packages

The five libraries — `@trembus/tokens`, `@trembus/icons`, `@trembus/ui`, `@trembus/viz`,
`@trembus/game-viz` — are published to **public npm** under the `@trembus` scope, MIT licensed.
(`@trembus/video`
and the `demos/*` apps are private and never published.)

## Versioning — independent, per package

Packages are versioned **independently** and follow [SemVer](https://semver.org). A release
bumps **only the package(s) that actually changed** — you cannot republish an unchanged
package over an existing version, and `workspace:^` cross-package deps are rewritten to a
real range (`^x.y.z`) at publish time, so untouched packages keep resolving.

- **patch** (`0.1.0 → 0.1.1`) — bug fixes, no API change.
- **minor** (`0.1.0 → 0.2.0`) — new backward-compatible features (a new component, new props).
- **major** — reserved for breaking changes (still `0.x` today, so treat minor as the ceiling).

Record changes in [`CHANGELOG.md`](CHANGELOG.md) under a `## [@trembus/<pkg> X.Y.Z]` heading
(Keep a Changelog format).

## Runbook (single changed package)

```sh
# 1. bump the version in packages/<pkg>/package.json, and add a CHANGELOG section.
# 2. green gate (build is part of it; attw runs in verify:exports).
pnpm --filter @trembus/<pkg> validate

# 3. commit + push (releases land on main).
git add packages/<pkg> CHANGELOG.md && git commit -m "release(<pkg>): @trembus/<pkg> X.Y.Z — …"
git push origin main

# 4. dry-run to inspect the tarball (no registry write).
pnpm --filter @trembus/<pkg> publish --dry-run

# 5. publish (must be pnpm, NOT npm — see below).
pnpm --filter @trembus/<pkg> publish --access public

# 6. verify it landed (propagation can lag a few seconds).
npm view @trembus/<pkg> version
```

**Always `pnpm publish`, never `npm publish`.** pnpm rewrites the `workspace:^` dependency
(e.g. on `@trembus/tokens`) to a real `^x.y.z` range during packing; plain `npm publish` would
ship a broken `workspace:^` in the published `package.json`.

## Authentication — 2FA, security keys, and automation tokens

npm 2FA on this account is satisfied by a **WebAuthn security key**, which works for the npm
website and `npm login` but **cannot satisfy the CLI publish challenge** — the publish step
only accepts a TOTP code via `--otp=<digits>`, and there is no browser hand-off for it. A
security-key-only login therefore dead-ends at `EOTP` / `OTP required for authentication`.

The fix is an **npm access token that bypasses 2FA**:

1. On npmjs.com → **Access Tokens → Generate New Token**, create either a classic
   **Automation** token or a **Granular Access Token** with **Read and write** packages
   permission (scoped to `@trembus`) and **Bypass two-factor authentication** enabled.
2. Store it locally (treat it like a password — never commit it):

   ```sh
   npm config set //registry.npmjs.org/:_authToken=YOUR_TOKEN
   ```

3. Run the publish — no `--otp` needed.
4. **Revoke the token** after the release (or set a short expiry); it can publish without 2FA.

For automated/CI releases, prefer npm's **Trusted Publishing** (GitHub Actions OIDC) over a
long-lived bypass token.

## Gotchas

- **Clean working tree.** `pnpm publish` refuses to publish from a dirty tree. If untracked
  scratch files are present you can pass `--no-git-checks`, but prefer cleaning/ignoring them.
- **Build-first gate.** Root `validate` runs `pnpm -r build` first so `@trembus/tokens`'s
  `dist` exists before downstream typecheck/test/attw. A standalone `pnpm --filter … validate`
  on a fresh clone needs tokens built first.
- **attw / ESM-only.** Packages are ESM-only; `verify:exports` runs `attw --profile esm-only`.
  The `node16 (from CJS)` row is expected to warn and is ignored.
- **No git tags** are used today; if you start tagging, use `@trembus/<pkg>@X.Y.Z`.
