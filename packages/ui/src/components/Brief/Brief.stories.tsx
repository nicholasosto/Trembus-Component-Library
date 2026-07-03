import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Brief, fromMarkdown } from './Brief';
import type { BriefContract } from './Brief';

// ── SCOPE A: an instruction doc (this project's own CLAUDE.md) ──────────────
// The generator's job here is pure transcription of the markdown outline.
const claudeMd: BriefContract = {
  view: 'brief',
  kind: 'claude',
  id: 'claude.trembus-ui',
  title: '@trembus/ui — guide for Claude',
  summary:
    'Web React component library (not Roblox). First-principles UX: tokens → primitives → components, each carrying a machine-checked "3 UI jobs" contract.',
  meta: [
    { label: 'package', value: '@trembus/ui' },
    { label: 'status', value: 'living' },
    { label: 'gate', value: 'pnpm validate' },
  ],
  sections: [
    {
      heading: 'Commands',
      kind: 'commands',
      items: [
        { text: 'pnpm run validate', desc: 'the full gate — run before declaring work done' },
        { text: 'pnpm test', desc: 'unit tests (jsdom + axe)' },
        { text: 'pnpm dev', desc: 'Storybook on :6006' },
        { text: 'pnpm check:contracts', desc: 'enforce the 3-jobs contract per component' },
      ],
    },
    {
      heading: 'Adding a component',
      kind: 'rules',
      note: 'Every component in src/components/<Name>/ has exactly five files.',
      items: [
        'Scaffold with node .claude/skills/new-component/scaffold.mjs <Name>.',
        'Export it from src/index.ts; contract.name must equal the directory name.',
        'Story names stay Default / States / Interaction — check:contracts verifies them.',
      ],
    },
    {
      heading: 'Conventions',
      kind: 'rules',
      items: [
        { text: 'Tokens only', desc: 'reference var(--tcl-*), never hardcode a hex' },
        { text: 'import type { … }', desc: 'verbatimModuleSyntax is on' },
        { text: 'Compose from primitives', desc: 'Box / Stack / Text / Pressable' },
      ],
    },
    {
      heading: 'Gotchas',
      kind: 'checklist',
      items: [
        {
          text: 'Required prop + render-only story → put a default in meta args',
          severity: 'warn',
        },
        {
          text: 'Keep interaction handlers off composite-role containers (tablist/menu)',
          severity: 'warn',
        },
        {
          text: 'Portals render synchronously — parent focus/measure sees the node same commit',
          severity: 'info',
        },
        { text: 'ESM-only package — verify:exports runs --profile esm-only', severity: 'info' },
      ],
    },
    {
      heading: 'Required artifacts',
      kind: 'artifacts',
      items: [
        { text: 'barrel', desc: 'every component re-exported', ref: 'src/index.ts' },
        {
          text: 'contract checker',
          desc: 'enforces the 5-file shape + 3 jobs',
          ref: 'scripts/check-contracts.ts',
        },
        {
          text: 'a11y helper',
          desc: 'axe assertions for every component test',
          ref: 'src/test/a11y.ts',
        },
      ],
    },
    {
      heading: 'Visualizations',
      kind: 'prose',
      body: 'Data-driven viz components (Hub, Brief) consume the Trembus Visual Grammar JSON contracts. Mirror the schema as a TS type so ONE contract renders in both the static HTML kit and React. Title these Visualizations/* in Storybook.',
    },
  ],
};

// ── the kinds legend — one section of every kind (Afford Action demo) ───────
const kindsLegend: BriefContract = {
  view: 'brief',
  kind: 'spec',
  id: 'brief.section-kinds',
  title: 'Section kinds — the rendering legend',
  summary:
    'Every section kind the Brief contract supports. Each heading is a disclosure button — click to collapse.',
  sections: [
    {
      heading: 'prose',
      kind: 'prose',
      body: 'A paragraph of explanation. Any unknown kind falls back to this.',
    },
    {
      heading: 'rules',
      kind: 'rules',
      items: ['First directive.', 'Second directive, with a rationale.'],
    },
    {
      heading: 'commands',
      kind: 'commands',
      items: [{ text: 'pnpm dev', desc: 'start Storybook' }],
    },
    {
      heading: 'checklist',
      kind: 'checklist',
      items: [
        { text: 'an info item', severity: 'info' },
        { text: 'a warning item', severity: 'warn' },
        { text: 'a danger item', severity: 'danger' },
      ],
    },
    {
      heading: 'phases',
      kind: 'phases',
      items: [
        { text: 'done phase', status: 'done' },
        { text: 'active phase', status: 'active' },
        { text: 'pending phase', status: 'pending' },
      ],
    },
    {
      heading: 'artifacts',
      kind: 'artifacts',
      items: [{ text: 'barrel', desc: 'exports', ref: 'src/index.ts' }],
    },
    {
      heading: 'boundaries',
      kind: 'boundaries',
      items: [{ text: 'project root', ref: 'Trembus-Component-Library/' }],
    },
    {
      heading: 'decisions',
      kind: 'decisions',
      items: [{ text: 'Schema format?', choice: 'JSON Schema draft-07, mirrored as a TS type' }],
    },
    {
      heading: 'reference',
      kind: 'reference',
      items: [{ text: 'agents.md standard', ref: 'https://agents.md' }],
    },
  ],
};

// ── SCOPE B: an instruction doc that also carries a light plan ──────────────
const withPlan: BriefContract = {
  view: 'brief',
  kind: 'plan',
  id: 'plan.brief-rollout',
  title: 'Brief rollout — agent plan',
  summary:
    'Scope B: one contract spans an instruction doc AND a lightweight plan — rules up top, phases + decisions below.',
  meta: [
    { label: 'mood', value: 'grinding' },
    { label: 'updated', value: '2026-06-21' },
  ],
  sections: [
    {
      heading: 'Operating rules',
      kind: 'rules',
      items: ['Read the manifest first.', 'Local markdown is the source of truth.'],
    },
    {
      heading: 'Phases',
      kind: 'phases',
      items: [
        { text: 'Phase 1 — schema + component', status: 'done' },
        { text: 'Phase 2 — generator + lenient validator', status: 'active' },
        { text: 'Phase 3 — round-trip md ⇄ contract', status: 'pending' },
      ],
    },
    {
      heading: 'Decisions',
      kind: 'decisions',
      items: [
        {
          text: 'Scope of one contract',
          choice: 'Medium — bless claude/agents/plan + a phases kind',
        },
      ],
    },
  ],
};

// ── SCOPE C: any sectioned markdown (a design spec) ─────────────────────────
const genericDoc: BriefContract = {
  view: 'brief',
  kind: 'spec',
  id: 'spec.any-markdown',
  title: 'Any sectioned markdown — a design spec',
  summary:
    'Scope C: the Brief renders arbitrary docs — design notes, specs, READMEs — so long as they are sections of prose/lists.',
  sections: [
    {
      heading: 'Problem',
      kind: 'prose',
      body: 'Generic docs vary wildly. A permissive contract renders them, but a looser vocabulary gives the generator fewer guardrails — more drift, more fix-ups.',
    },
    {
      heading: 'Approach',
      kind: 'rules',
      items: ['Lenient parse, strict render.', 'Unknown kinds degrade to prose.'],
    },
    {
      heading: 'Open questions',
      kind: 'checklist',
      items: [
        { text: 'Where does spec end and plan begin?', severity: 'warn' },
        { text: 'Do we need a tables / kv kind?', severity: 'info' },
      ],
    },
    {
      heading: 'References',
      kind: 'reference',
      items: [
        { text: 'agents.md standard', ref: 'https://agents.md' },
        { text: 'plan-board schema', ref: 'visual-grammar/schema/plan-board.schema.json' },
      ],
    },
  ],
};

// ── SCOPE D: a full architecture brief — every section kind, every item facet ──
// A client–server web application described end to end. Grounded in the Asset-Studio
// Command Center (a Vite + React SPA served by a Node dev server and a static file host),
// but authored as a general reference an agent could act on cold.
const webArchitecture: BriefContract = {
  view: 'brief',
  kind: 'spec',
  id: 'arch.client-server-web',
  title: 'Client–Server Web Architecture',
  summary:
    'A full-stack web application: a browser SPA client talking to an HTTP/JSON API server over one typed contract, fronted by a static asset tier and backed by a data layer. Dev and prod run the SAME client bundle — only the server in front of it changes.',
  meta: [
    { label: 'stack', value: 'React · Vite · Node' },
    { label: 'transport', value: 'HTTP / JSON' },
    { label: 'status', value: 'living', tone: '#2f9e44' },
    { label: 'version', value: '2.1.0' },
  ],
  sections: [
    {
      heading: 'Topology',
      kind: 'prose',
      note: 'One request, end to end.',
      body: 'The browser loads a static HTML shell plus a content-hashed JS/CSS bundle from the asset tier. The SPA boots, then talks to the API server over HTTP — JSON request/response, credentials riding an httpOnly cookie. The server authenticates, validates against the shared schema, applies business logic, and reads or writes the data tier (records in SQL, blobs in object storage). Streamed or large responses — media, server-sent events — bypass the JSON path.\n\nDev and prod serve the identical client bundle. In dev, a single Vite server both serves the SPA with HMR and proxies /api to the server process. In prod, a reverse proxy fronts a static host for assets and the API server for /api — so the client can never tell which tier answered.',
    },
    {
      heading: 'Tier boundaries',
      kind: 'boundaries',
      note: 'Each tier owns exactly one job; only the contract crosses between them.',
      items: [
        {
          text: 'Client — browser SPA',
          desc: 'render, local/optimistic state, routing — never trusts its own input',
          ref: 'src/',
        },
        {
          text: 'API server',
          desc: 'auth, validation, business logic — the single source of authority',
          ref: 'server/',
        },
        {
          text: 'Static / asset tier',
          desc: 'immutable hashed bundles + media, cache-forever',
          ref: 'previews/app/',
        },
        {
          text: 'Data tier',
          desc: 'SQL for records, object storage for blobs — reached only by the server',
          ref: 'db/ · storage/',
        },
        {
          text: 'Edge / reverse proxy',
          desc: 'TLS termination, /api-vs-static routing, gzip/brotli',
          ref: 'nginx.conf',
        },
      ],
    },
    {
      heading: 'Commands',
      kind: 'commands',
      items: [
        { text: 'pnpm dev', desc: 'Vite dev server + /api proxy on :5175, HMR + live-regen' },
        { text: 'pnpm build', desc: 'typecheck, then hashed production bundle → previews/app/' },
        { text: 'pnpm preview', desc: 'serve the built bundle (shell only — no API middleware)' },
        { text: 'python -m http.server 4317', desc: 'the prod-parity static host for previews/' },
        { text: 'docker compose up', desc: 'proxy + api + db together, prod parity locally' },
      ],
    },
    {
      heading: 'Operating rules',
      kind: 'rules',
      note: 'Invariants that keep the tiers decoupled and independently deployable.',
      items: [
        {
          text: 'The contract is the boundary',
          desc: 'client and server import ONE typed schema; never reach around it',
        },
        {
          text: 'The server owns authority',
          desc: 'every mutation re-validated server-side — the client is a cache, not a source of truth',
        },
        {
          text: 'Keep the API stateless',
          desc: 'no server-side session memory; auth rides a cookie/token so any node can answer',
        },
        {
          text: 'Same bundle, both environments',
          desc: 'dev and prod ship identical client code — only the server in front differs',
        },
        {
          text: 'Assets are immutable',
          desc: 'content-hashed filenames cache forever; index.html is the only never-cached entry',
        },
      ],
    },
    {
      heading: 'Key modules',
      kind: 'artifacts',
      items: [
        {
          text: 'app entry',
          desc: 'boots React, mounts the router',
          ref: 'src/main.tsx',
          status: 'stable',
        },
        {
          text: 'API client',
          desc: 'the only module that touches window.fetch',
          ref: 'src/api/client.ts',
          status: 'stable',
        },
        {
          text: 'shared contract',
          desc: 'request/response types imported by BOTH tiers',
          ref: 'shared/contract.ts',
          status: 'stable',
        },
        {
          text: 'server entry',
          desc: 'route table, middleware chain, listen()',
          ref: 'server/index.ts',
          status: 'active',
        },
        {
          text: 'dev server plugins',
          desc: 'live contract regen + media proxy + POST /api/reveal',
          ref: 'vite.config.ts',
          status: 'active',
        },
      ],
    },
    {
      heading: 'Production readiness',
      kind: 'checklist',
      note: 'Gate before shipping to a public origin.',
      items: [
        { text: 'Secrets in env / a vault — never in the bundle or git', severity: 'danger' },
        {
          text: 'CORS locked to known origins; credentialed requests require an allowlisted origin',
          severity: 'danger',
        },
        { text: 'All input validated server-side against the schema', severity: 'danger' },
        { text: 'Rate-limit + body-size cap on every mutating route', severity: 'warn' },
        { text: 'HTTPS only — HSTS + secure / httpOnly / SameSite cookies', severity: 'warn' },
        { text: 'Structured request logs carry a correlation id', severity: 'info' },
        { text: 'Health / readiness endpoint for the load balancer', severity: 'info' },
      ],
    },
    {
      heading: 'Rollout phases',
      kind: 'phases',
      items: [
        { text: 'Shell + static hosting', desc: 'SPA served, no API yet', status: 'done' },
        { text: 'API + typed contract', desc: 'CRUD over JSON', status: 'done' },
        { text: 'Auth + sessions', desc: 'cookie auth, role-based access', status: 'active' },
        { text: 'Caching + CDN', desc: 'edge cache for assets and read APIs', status: 'pending' },
        {
          text: 'Horizontal scale',
          desc: 'stateless API behind a load balancer',
          status: 'pending',
        },
      ],
    },
    {
      heading: 'Architecture decisions',
      kind: 'decisions',
      items: [
        {
          text: 'Client rendering model?',
          choice: 'SPA / client-side render — the app is behind auth, so SEO is a non-goal',
        },
        {
          text: 'Client ↔ server transport?',
          choice:
            'REST / JSON over HTTP — simplest contract; GraphQL deferred until clients diverge',
        },
        {
          text: 'Where does session state live?',
          choice: 'Stateless server + httpOnly cookie — any node answers, no sticky sessions',
        },
        {
          text: 'How do dev and prod differ?',
          choice:
            'Vite dev server with an /api proxy in dev; reverse proxy + static host + API in prod',
        },
      ],
    },
    {
      heading: 'Reference',
      kind: 'reference',
      items: [
        {
          text: 'MDN — Client–Server overview',
          ref: 'https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanics/Client-Server_overview',
        },
        { text: 'Vite — server options & build', ref: 'https://vitejs.dev/guide/' },
        {
          text: 'OWASP — REST Security Cheat Sheet',
          ref: 'https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html',
        },
        { text: 'The Twelve-Factor App', ref: 'https://12factor.net' },
      ],
    },
  ],
};

// ── SCOPE E: a real engineering plan, transcribed ─────────────────────────────
// The Roblox OpenCloud MCP V1 launch plan (mono-game-mcp/game-development-mcp).
// A medium-complexity build plan whose own outline maps 1:1 onto the Brief kinds:
// decisions, boundaries, phases, rules, artifacts, a safety checklist, and verify
// commands — the shape the contract was designed to receive from a doc.
const openCloudPlan: BriefContract = {
  view: 'brief',
  kind: 'plan',
  id: 'plan.opencloud-mcp-v1',
  title: 'Roblox OpenCloud MCP — V1 Plan',
  summary:
    'Adopt game-development-mcp as the V1 base for the Roblox OpenCloud MCP: keep the modular TypeScript / Nx / stdio architecture, modernize stale Roblox routes to Cloud v2, refresh the Soul Steel defaults, add Open Cloud release + ops tools, and make every destructive action explicitly confirm-gated.',
  meta: [
    { label: 'base', value: 'game-development-mcp' },
    { label: 'transport', value: 'stdio MCP · Nx' },
    { label: 'universe', value: '6679100030' },
    { label: 'status', value: 'V1 planning', tone: '#1971c2' },
  ],
  sections: [
    {
      heading: 'V1 defaults',
      kind: 'prose',
      note: 'Environment variables still override these at call time.',
      body: 'V1 bakes two Soul Steel defaults into the shared config fallbacks — ROBLOX_UNIVERSE_ID 6679100030 (getDefaultUniverseId) and ROBLOX_PLACE_ID 102596975485791 (getDefaultPlaceId). The .env.example and the app README are updated to match, alongside the current tool groups, required Open Cloud scopes, and the stdout/stderr rules that keep MCP JSON-RPC safe.',
    },
    {
      heading: 'Architecture decisions',
      kind: 'decisions',
      items: [
        { text: 'Server model?', choice: 'stdio MCP inside the existing Nx monorepo — no rewrite' },
        {
          text: 'Roblox HTTP path?',
          choice: 'every call flows through robloxFetch() from @trembus/shared',
        },
        {
          text: 'Auth & credentials?',
          choice: 'env-only via ROBLOX_CLOUD_API_KEY — no set_api_key or persistence tool',
        },
        {
          text: 'Tool naming?',
          choice:
            'keep existing public tool names where practical, so clients need no broad rewrites',
        },
      ],
    },
    {
      heading: 'Out of scope',
      kind: 'boundaries',
      note: 'Older connector repos are superseded reference material only — never an import source.',
      items: [
        { text: 'roblox-cloud-mcp', desc: 'superseded — reference only', ref: 'roblox-cloud-mcp' },
        {
          text: 'roblox-cloud-services',
          desc: 'superseded — reference only',
          ref: 'roblox-cloud-services',
        },
        {
          text: 'roblox-dev connector',
          desc: 'superseded — reference only',
          ref: 'roblox-dev/connectors/roblox-cloud',
        },
        {
          text: 'Credential persistence',
          desc: 'no set_api_key tool; keys stay in the environment',
        },
      ],
    },
    {
      heading: 'Delivery phases',
      kind: 'phases',
      items: [
        {
          text: 'Config & docs',
          desc: 'new default IDs, .env.example, README tool groups + scopes',
          status: 'active',
        },
        {
          text: 'Route modernization',
          desc: 'Standard · Ordered DataStores · Messaging · Creator Store → Cloud v2',
          status: 'active',
        },
        {
          text: 'Release & ops tools',
          desc: 'place publish, server restart, snapshot, user restrictions',
          status: 'pending',
        },
        {
          text: 'Safety gate',
          desc: 'confirm: true on every destructive / live-impacting op',
          status: 'pending',
        },
        {
          text: 'Post-V1',
          desc: 'opt-in smoke tests, release checklist, typed schemas, plugin bundle',
          status: 'pending',
        },
      ],
    },
    {
      heading: 'Migration invariants',
      kind: 'rules',
      note: 'Applied uniformly across the Standard + Ordered DataStore v2 migration.',
      items: [
        { text: 'Default scope to global', desc: 'when the caller omits a scope' },
        { text: 'Map prefix → id.startsWith("prefix")', desc: 'official Cloud v2 filter syntax' },
        { text: 'Map limit / cursor → maxPageSize / pageToken', desc: 'pagination inputs' },
        {
          text: 'Send bodies as { value: parsedValue }',
          desc: 'parse JSON string values first; preserve users + attributes',
        },
        { text: 'Require confirm: true for deletes', desc: 'and every destructive route' },
      ],
    },
    {
      heading: 'New release / ops tools',
      kind: 'artifacts',
      items: [
        {
          text: 'place_publish_version',
          desc: 'publish an RBXL/RBXLX place file',
          ref: '/universes/v1/{universeId}/places/{placeId}/versions',
          status: 'new',
        },
        {
          text: 'universe_restart_servers',
          desc: 'restart default place servers (confirm)',
          status: 'new',
        },
        { text: 'datastore_snapshot', desc: 'snapshot the universe DataStore', status: 'new' },
        {
          text: 'user_restriction · get / list / update / logs',
          desc: 'read + audit; update requires confirm',
          status: 'new',
        },
      ],
    },
    {
      heading: 'Safety contract',
      kind: 'checklist',
      note: 'Every action below is refused without confirm: true.',
      items: [
        { text: 'Place publish', severity: 'danger' },
        { text: 'Universe server restart', severity: 'danger' },
        { text: 'DataStore / Ordered DataStore entry delete', severity: 'danger' },
        { text: 'Asset archive · restore · version rollback', severity: 'warn' },
        { text: 'User restriction update', severity: 'warn' },
        {
          text: 'Any future publish / restart / delete / archive / rollback / moderation op uses the same gate',
          severity: 'info',
        },
      ],
    },
    {
      heading: 'Verify',
      kind: 'commands',
      note: 'Mocked robloxFetch only — tests never call live Roblox APIs or mutate live state.',
      items: [
        { text: 'nx run shared:typecheck' },
        { text: 'nx run game-development-mcp:typecheck' },
        {
          text: 'nx run game-development-mcp:test',
          desc: 'DataStore URLs, scope / prefix / pagination, CRUD bodies, confirm gates',
        },
        { text: 'nx run game-development-mcp:lint' },
        { text: 'nx run game-development-mcp:build' },
        {
          text: 'rg "datastores/v1|ordered-data-stores/v1|creator-store-products" src',
          desc: 'acceptance: no legacy routes remain',
        },
      ],
    },
    {
      heading: 'Key paths',
      kind: 'reference',
      items: [
        { text: 'V1 base app', ref: 'apps/game-development-mcp' },
        { text: 'shared robloxFetch()', ref: 'libs/shared' },
        { text: 'env template', ref: '.env.example' },
        { text: 'tool + scope docs', ref: 'apps/game-development-mcp/README.md' },
      ],
    },
  ],
};

const meta = {
  title: 'Visualizations/Brief',
  component: Brief,
  args: { data: claudeMd },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Brief>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — a whole instruction doc (Scope A: this project's CLAUDE.md). */
export const Default: Story = {};

/** Job: Afford Action — every section kind; each heading is a disclosure button. */
export const States: Story = { args: { data: kindsLegend } };

/** Job: Acknowledge Input — clicking a section toggles its body. */
export const Interaction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Commands' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  },
};

/** Scope B — an instruction doc that also carries a lightweight plan. */
export const WithPlan: Story = { args: { data: withPlan } };

/** Scope C — any sectioned markdown (a design spec). */
export const GenericDoc: Story = { args: { data: genericDoc } };

/** Scope D — a full architecture brief: every section kind + every item facet. */
export const WebServerArchitecture: Story = { args: { data: webArchitecture } };

/** Scope E — a real engineering plan (Roblox OpenCloud MCP V1) transcribed to a Brief. */
export const OpenCloudMcpPlan: Story = { args: { data: openCloudPlan } };

// A raw markdown doc — exactly what you'd paste from an AGENTS.md — converted to
// a contract at render time by fromMarkdown(). No model in the loop; deterministic.
const SAMPLE_MD = `---
kind: agents
id: agents.service-worker
---
# AGENTS.md — service-worker

An operating brief an agent can act on cold. Local markdown is the source of truth.

## Commands

- \`pnpm dev\` — start the worker on :8787
- \`pnpm test\` — vitest + miniflare
- \`pnpm deploy\` — wrangler publish (prod)

## Operating rules

- Read the manifest before moving files.
- Never write to KV without an explicit approval.
- Prefer warnings over blocking until hooks land.

## Gotchas

- **Durable Objects** are single-threaded — don't block the event loop.
- Secrets live in \`wrangler.toml\`, never in code.

## Boundaries

The worker owns auth + routing only; business logic lives in the API service.
`;

/** Generator: a raw markdown doc → BriefContract via fromMarkdown(), rendered live. */
export const FromMarkdown: Story = { args: { data: fromMarkdown(SAMPLE_MD) } };
