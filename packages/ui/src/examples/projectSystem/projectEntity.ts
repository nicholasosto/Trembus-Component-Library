/**
 * `ProjectEntity` — a faithful mirror of the Soul-Steel `_project/` planning contract
 * (`documents/specs/project-system/schema.md` §2 + `project-entity.schema.json`).
 *
 * This is the schema's own anticipated **Phase E** distribution (§8 #4): with two
 * consumers, the component library mirrors a small TS type with a CI equality check
 * rather than publishing `@trembus/project-schema`. Keep it in lockstep with the JSON
 * schema — three primitives and no more:
 *
 *   Identity (kind · id · title) · State (status · updated) · Relation (links[])
 *
 * `kind` and `id` are loader-derived from the file's path (folder + filename stem),
 * never hand-authored. `status` is `string` in the core contract; the validator
 * narrows it to a per-kind enum (§4a) — mirrored as {@link STATUS_ENUMS} for tone-mapping.
 */

export type EntityKind = 'decision' | 'session' | 'report' | 'pipeline' | 'roadmap';

/** The per-kind `status` enums (schema §4a). Exported so the adapter can tone-map and
 *  a host can flag an off-enum status the way the validator would. */
export const STATUS_ENUMS = {
  session: ['planned', 'active', 'blocked', 'completed', 'shelved'],
  decision: ['proposed', 'accepted', 'superseded', 'rejected'],
  report: ['draft', 'complete'],
  pipeline: ['design', 'qualify', 'build', 'ship', 'archive', 'shelved'],
  roadmap: ['proposed', 'active', 'superseded', 'complete'],
} as const satisfies Record<EntityKind, readonly string[]>;

/** Typed edges (schema §5) — the primitive that turns the flat folder into a graph. */
export type EntityRel =
  | 'supersedes'
  | 'superseded-by'
  | 'predecessor'
  | 'successor'
  | 'milestone'
  | 'implements'
  | 'decided-in'
  | 'references';

export interface EntityLink {
  rel: EntityRel;
  /** `'<kind-folder>/<stem>'` (e.g. `'decisions/0009-unified-registry'`), a milestone
   *  marker (`'M5'`), or an external ref (`'slice.md#M5'`). */
  target: string;
}

export interface ProjectEntity {
  // ── Identity ── kind + id are loader-derived from the path; title is the only authored one.
  kind: EntityKind;
  id: string;
  title: string;
  // ── State ──
  status: string; // narrowed per-kind by the validator; see STATUS_ENUMS
  updated: string; // ISO 'YYYY-MM-DD'
  // ── Relation ──
  links?: EntityLink[];
  // ── Accidental facets ── optional, never required (priority · agent · scope · horizon …).
  tags?: Record<string, string | number>;
}
