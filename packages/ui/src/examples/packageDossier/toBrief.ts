// Pure adapter: a PackageDossier's API fields → a Brief document. The dossier
// header (name, badges, summary, stats) is owned by the page chrome, so this
// Brief carries only the REFERENCE — Setup plus the progressively-disclosed API.
// One contract renders the same way a consumer's Brief would.
import type { BriefContract, BriefSection } from '../../index';
import type { ApiMember, PackageDossier } from './packages';

/** Section ids collapsed on first render — the API reveals on click. */
export const COLLAPSED_SECTIONS = ['types', 'interfaces', 'functions', 'conventions'];

/** An API category → a ref-family Brief section: name — gloss · `signature` · [stability]. */
function apiSection(id: string, heading: string, members: ApiMember[]): BriefSection {
  return {
    id,
    heading,
    kind: 'reference',
    items: members.map((m) => ({
      text: m.name,
      desc: m.gloss,
      ref: m.signature,
      status: m.stability,
    })),
  };
}

export function toBrief(pkg: PackageDossier): BriefContract {
  return {
    kind: 'spec',
    title: 'Reference',
    summary: `The public surface of ${pkg.name}. Expand a section to read it.`,
    sections: [
      {
        id: 'setup',
        heading: 'Setup',
        kind: 'commands',
        note: `Add the package, then import from ${pkg.name}.`,
        items: pkg.setup.map((s) => ({ text: s.command, desc: s.note })),
      },
      apiSection('types', 'Types', pkg.types),
      apiSection('interfaces', 'Interfaces', pkg.interfaces),
      apiSection('functions', 'Functions', pkg.functions),
      {
        id: 'conventions',
        heading: 'Conventions',
        kind: 'checklist',
        items: pkg.conventions.map((c) => ({ text: c.text, desc: c.desc, severity: c.severity })),
      },
    ],
  };
}
