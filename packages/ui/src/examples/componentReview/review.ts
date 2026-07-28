// The 2026-07-25 component review, as data. Mirrors COMPONENT-REVIEW.md at the repo
// root — that file is the canonical record; this is the same verdicts shaped for the
// library's own Brief + DecisionMap so the audit is legible in the gallery.
import type { BriefContract, DecisionMapContract } from '../../index';

/** The review document — Brief renders each section as a real collapsible disclosure. */
export const REVIEW: BriefContract = {
  view: 'brief',
  kind: 'spec',
  id: 'review.trembus-components',
  title: 'Component review — the library as a set',
  summary:
    'A one-time audit of 60 contracted components across @trembus/ui · viz · game-viz, ' +
    'added one or two at a time. The question: are pairs that look alike — Meter / Progress ' +
    'was the prompt — one component wearing two names? Answer: no. Zero merges. The debt sat ' +
    'one level down, in stateful code repeated where a canonical version already existed.',
  meta: [
    { label: 'components', value: 60 },
    { label: 'families reviewed', value: 8 },
    { label: 'merges', value: 0 },
    { label: 'extractions', value: 1 },
    { label: 'deprecations', value: 0 },
  ],
  sections: [
    {
      id: 'method',
      heading: 'The method — three tests, in order',
      kind: 'rules',
      note: 'A family only reaches the next test if it passes the previous one.',
      items: [
        {
          text: 'Intent — do they answer different consumer questions?',
          desc: "If a consumer staring at both can't tell which to reach for, they are one component (or the docs lie).",
        },
        {
          text: 'Semantics — do they need different ARIA or DOM?',
          desc: 'If merging would force the consumer to pick an ARIA role, the split is load-bearing. Choosing semantics for the consumer is the library’s job.',
        },
        {
          text: 'Duplication — is the same code in both?',
          desc: 'If yes, and 1–2 passed, extract a shared internal. Do NOT merge.',
        },
        {
          text: 'Corollary: duplication is only debt when it is stateful, divergent, or ignores a canonical version.',
          desc: 'cx exists three times, byte-identical, each copy carrying its rationale. That stays — a five-line leaf util duplicated on purpose beats a cross-package coupling.',
        },
      ],
    },
    {
      id: 'verdicts',
      heading: 'Verdicts — eight families, zero merges',
      kind: 'decisions',
      note: 'Every member already names its near-neighbours with the reason, including across package lines. The intent test is passed by construction.',
      items: [
        { text: 'Fill bars — Meter · Progress · Gauge', choice: 'Keep; reword one variant' },
        {
          text: 'Charts — BarChart · Funnel · Treemap · DonutChart · LineChart · Sparkline',
          choice: 'Keep; harden Treemap',
        },
        {
          text: 'Collections — Table · VirtualAssetGrid · FolderTree · viz Tree',
          choice: 'Keep',
        },
        { text: 'Bars — Toolbar · CommandBar · NavBar · Breadcrumb', choice: 'Keep' },
        { text: 'Overviews — Hub · viz SystemMap · viz Strata', choice: 'Keep' },
        {
          text: 'Process — Timeline · Swimlane · RunHistory · game-viz Chronicle',
          choice: 'Keep',
        },
        { text: 'Status — Badge · Callout · EmptyState · DataStatusBar', choice: 'Keep' },
        {
          text: 'Frames — MediaFrame · Effigy · EpisodeDeck · Reliquary · SoulCard',
          choice: 'Keep; fix the docs drift',
        },
      ],
    },
    {
      id: 'yardstick',
      heading: 'Why Meter / Progress is the yardstick, not the problem',
      kind: 'prose',
      body:
        'Both are ~50-line wrappers over the same FillBarShell internal: track geometry, ' +
        'aria-value* plumbing, icon chip, value label and tone→token mapping are already one ' +
        'implementation. What differs is what should — role="progressbar" (advancing toward ' +
        'completion) versus role="meter" (a measurement in a known range). Merging them would ' +
        'hand the consumer an ARIA-role decision, which is a regression, not a simplification. ' +
        'Shared internal, two semantic faces, cross-documented boundary: that is the target ' +
        'state, and it is what every other family was measured against.',
    },
    {
      id: 'extracted',
      heading: 'Extracted — the one real duplication',
      kind: 'artifacts',
      items: [
        {
          text: 'useSelection',
          desc: 'The controlled/uncontrolled selectedId spine, inlined verbatim in 9 places. @trembus/viz extracted the same five lines long ago — its JSDoc even says it "mirrors the inlined pattern the @trembus/ui Tier-1 viz repeated per component" — and it was never back-ported. Now it is.',
          ref: 'packages/ui/src/internal/useSelection.ts',
          status: '9 sites · −31 lines',
        },
        {
          text: 'Left inline on purpose — three sites whose selection genuinely differs',
          desc: 'DecisionMap seeds its initial state lazily from the data (decided beats recommended); FolderTree and VirtualAssetGrid pair selection with a separate roving-focus id. Each now carries a comment saying so, so the next reader does not "fix" it.',
          status: 'annotated',
        },
      ],
    },
    {
      id: 'declined',
      heading: 'Considered and declined',
      kind: 'boundaries',
      note: 'Recorded with reasoning so they are not re-opened.',
      items: [
        {
          text: 'A shared aria-live inspector across 17 sites',
          desc: 'Eleven are visible panels sharing only <div aria-live="polite"> — the contents are entirely per-component. Two are three-line SR-only announcers. And the re-announce fix cannot be generalised: it needs an activation counter, which a selection has no equivalent of. Cost exceeded benefit.',
          status: 'declined',
        },
        {
          text: 'A shared roving-tabindex hook across 8 sites',
          desc: 'Menu’s submenu routing, Toolbar’s rove-then-fall-through, Hub’s hex geometry and Timeline’s de-overlapped axis are not the same problem. Only FolderTree ↔ VirtualAssetGrid are near-copies.',
          status: 'not now',
        },
        {
          text: 'De-duplicating cx / vars across the three packages',
          desc: 'Behaviourally identical, each copy documented. Sharing them would buy a cross-package coupling for five lines.',
          status: 'intentional',
        },
        {
          text: 'Rebuilding Reliquary / Effigy / EpisodeDeck on ui primitives',
          desc: 'They import only game-viz’s own cx/vars, contradicting the docs. Refactoring three published components’ DOM is visual-regression risk with no consumer-visible gain, so the claim was corrected instead — and the Reliquary-on-Box idea queued.',
          status: 'queued',
        },
      ],
    },
    {
      id: 'corrections',
      heading: 'Corrections to this review',
      kind: 'checklist',
      note: 'Two of the three suspected gaps dissolved on inspection. Both were measurement artifacts of the audit itself, not library defects.',
      items: [
        {
          text: 'Story Job: labels — reported 22 mismatches, actually 0',
          desc: 'The label names the job a story demonstrates, which the contract maps — not the component’s lead job.',
          severity: 'success',
        },
        {
          text: 'Near-neighbour coverage — reported 53/60, actually 60/60',
          desc: 'The sweep grepped only "not for" / "not when" while the library also writes "Not a…", "→ `X`", "Anywhere else: use X", "instead:".',
          severity: 'success',
        },
        {
          text: 'Lesson: a grep for one phrasing measures the phrasing, not the property.',
          severity: 'warn',
        },
      ],
    },
    {
      id: 'followups',
      heading: 'Follow-ups',
      kind: 'checklist',
      items: [
        {
          text: 'Treemap’s boundary was soft — it offered a preference, never a rule. Hardened.',
          severity: 'success',
        },
        {
          text: 'Meter stopped calling its threshold variant "a gauge" — Gauge is a separate component and both carry role="meter", so SHAPE is the only separator. Both boundary lines now say so.',
          severity: 'success',
        },
        {
          text: '26 of 52 public names have no consumer proof — no demo, template or example page exercises them. Not a delete list; a confidence gap to feed into future example choices.',
          severity: 'info',
        },
      ],
    },
  ],
};

/** The user's actual question, as a settled decision. */
export const FILL_BAR_DECISION: DecisionMapContract = {
  view: 'decision-map',
  title: 'Should Meter and Progress be one component?',
  context:
    'They take nearly the same props (value · max · tone · variant · size · glow · showValue · ' +
    'icon · label) and already share their entire geometry through the FillBarShell internal.',
  status: 'decided',
  decidedId: 'keep',
  decidedNote:
    'Kept. The overlap is real but it is already resolved at the right layer — one shared ' +
    'internal, two semantic faces. The remaining difference is exactly the part a consumer ' +
    'should not have to decide.',
  recommendation: {
    optionId: 'keep',
    strength: 'strong',
    rationale:
      'role="progressbar" and role="meter" are different promises to assistive tech. A merged ' +
      'component would need a role prop — pushing an ARIA decision onto every consumer to save ' +
      'one export.',
    confidence: 92,
  },
  options: [
    {
      id: 'keep',
      label: 'Keep both',
      summary: 'Two names, one shared FillBarShell. Cross-document the boundary.',
      tone: 'success',
      effort: 'low',
      reversibility: 'reversible',
      confidence: 92,
      consequences: [
        {
          label: 'Consumers keep picking by intent — "is it advancing?" — never by ARIA role.',
          likelihood: 'certain',
        },
        {
          label: 'The pattern becomes the yardstick for the other seven families.',
          likelihood: 'likely',
          then: [
            {
              label: 'Reviewed against it, all seven also came back "keep".',
              likelihood: 'certain',
            },
          ],
        },
      ],
    },
    {
      id: 'merge-role',
      label: 'Merge with a role prop',
      summary: 'One FillBar taking role="progressbar" | "meter".',
      tone: 'danger',
      effort: 'medium',
      reversibility: 'one-way',
      confidence: 80,
      consequences: [
        {
          label: 'Every consumer must now understand the ARIA distinction to call it correctly.',
          likelihood: 'certain',
          then: [{ label: 'Wrong role silently ships as an a11y defect.', likelihood: 'likely' }],
        },
        {
          label: 'Two public exports break for no capability gain.',
          likelihood: 'certain',
        },
      ],
    },
    {
      id: 'merge-variant',
      label: 'Fold Progress into Meter',
      summary: 'Meter absorbs the segments variant; Progress is deprecated.',
      tone: 'warning',
      effort: 'medium',
      reversibility: 'one-way',
      confidence: 74,
      consequences: [
        {
          label: '"Progress" is the word consumers search for — losing it costs discoverability.',
          likelihood: 'likely',
        },
        {
          label: 'Meter’s variant list grows to four, and its docs must explain ARIA anyway.',
          likelihood: 'certain',
        },
      ],
    },
  ],
};

/** The interesting declined one — a finding that did not survive contact with the code. */
export const INSPECTOR_DECISION: DecisionMapContract = {
  view: 'decision-map',
  title: 'Extract a shared aria-live inspector across the 17 hand-rolled readouts?',
  context:
    'CommandBar (ui 0.10.0) is the only one that re-announces when the same thing is invoked ' +
    'twice — identical text is not a DOM mutation, so a live region stays silent. The plan was ' +
    'to hoist that fix into a shared internal.',
  status: 'decided',
  decidedId: 'decline',
  decidedNote:
    'Declined after reading all 17 sites. The premise was wrong: this is not duplication, and ' +
    'the fix does not generalise. Recorded in COMPONENT-REVIEW.md §2.2 so it is not re-opened.',
  recommendation: {
    optionId: 'decline',
    strength: 'moderate',
    rationale:
      'Eleven sites share only a wrapper element and one attribute; their contents differ ' +
      'entirely. The re-announce needs an activation counter — an event saying "the user acted" ' +
      '— and a selection has none: FolderTree derives its message from filter state, so no ' +
      'counter can be inferred from the value alone.',
    confidence: 85,
  },
  options: [
    {
      id: 'decline',
      label: 'Decline, record the reasoning',
      summary: 'No new abstraction. Keep the knowledge as a CLAUDE.md gotcha.',
      tone: 'success',
      effort: 'low',
      reversibility: 'reversible',
      confidence: 85,
      consequences: [
        {
          label: 'New components with a genuinely repeatable action still get the fix, via the documented gotcha.',
          likelihood: 'likely',
        },
        {
          label: 'A future engineer sees why it was declined instead of re-deriving it.',
          likelihood: 'certain',
        },
      ],
    },
    {
      id: 'thread-nonce',
      label: 'Thread an activation nonce into all 11',
      summary: 'Wrap each inspector’s children in a keyed element so repeats re-announce.',
      tone: 'warning',
      effort: 'high',
      reversibility: 'reversible',
      confidence: 70,
      consequences: [
        {
          label: 'Adds a wrapper div to 11 components and remounts the inspector subtree on every selection.',
          likelihood: 'certain',
        },
        {
          label: 'Fixes only the case where a user re-clicks the datum that is already selected.',
          likelihood: 'certain',
          then: [{ label: 'Low-frequency action, modest benefit.', likelihood: 'likely' }],
        },
      ],
    },
    {
      id: 'wrapper-only',
      label: 'Extract the wrapper anyway',
      summary: 'A shared <Inspector> that renders <div aria-live> around children.',
      tone: 'danger',
      effort: 'low',
      reversibility: 'reversible',
      confidence: 78,
      consequences: [
        {
          label: 'Hoists one element and one attribute while fighting eleven CSS namespaces.',
          likelihood: 'certain',
        },
        { label: 'Reads as indirection with no payoff.', likelihood: 'likely' },
      ],
    },
  ],
};
