# @trembus/game-viz — component capsules

> Stamp 2026-07-24 · tokens 0.2.2 · icons 0.3.0 · ui 0.9.0 · viz 0.5.1 · game-viz 0.4.1

Expressive game / cinematic UI in a liturgical-gothic idiom: HUD frames, character
dossiers, episode decks, title plates, 3D relics. "Theatrical surface, accessible spine" —
decorative chrome is `aria-hidden`, every interactive bit is a real focusable control,
motion sits behind `prefers-reduced-motion`.

- **MUST: import ALL THREE style entries** — `@trembus/ui/styles.css`,
  `@trembus/viz/styles.css`, `@trembus/game-viz/styles.css`. Since 0.4.0 this package's
  stylesheet carries ONLY its own component CSS.
- **Default to plain ui.** Reach for game-viz only when the page deliberately speaks this
  idiom AND accepts the weight tier (pulls ui + viz; Effigy lazy-loads ~300 KB model-viewer).
- The intended display type is Cinzel — opt-in via `@fontsource/cinzel` (falls back to serif).
- The `reliquary` theme (`data-theme="reliquary"`, blood-red accent) is these components'
  home turf; they work in all three themes.

**Skins over base components** (same data contract, same interaction spine — choose the
base first, swap to the skin if the idiom fits):

| Skin (game-viz) | Base           | Contract                                                      |
| --------------- | -------------- | ------------------------------------------------------------- |
| Chronicle       | ui Timeline    | `TimelineContract` (re-exported as `ChronicleContract`)       |
| Constellation   | viz TalentTree | `TalentTreeContract` (re-exported as `ConstellationContract`) |

### Reliquary · hud · reveal-state

HUD frame: corner-reticle chrome, label/tag tabs, status readouts. Presentational — it
frames YOUR content.
Key props: `label` · `tag` · `status: {label, tone?}[]` · `tone` · `aria-label` (names the framed group) · children.
Use when: framing a stat block, minimap, or panel in a game HUD.
Storybook: game-reliquary--default

### SoulCard · dossier · reveal-state

Flippable character dossier: portrait face (name, epithet, stats, quote) + optional back
face (details). Hidden face is `inert`.
Key data: `{index?, state?, stateTone?, portrait?, portraitAlt?, name, epithet?, stats?: {label, value}[], description?, quote?, back?: {heading?, body?, items?, quote?}, tone? (default danger)}`.
Key props: `flipped`/`defaultFlipped`/`onFlip` (flip only exists when `back` is set).
Storybook: game-soulcard--default

### EpisodeDeck · deck · **afford-action**

Season/episode selector list — numerals, codes, availability states.
Key data: `episodes: {id?, numeral? (auto Roman from position), title, code?, state?: available|streaming|locked, releaseAt?, synopsis?}[]`.
Key props: sel-trio · `tone`.
Use when: chaptered content selection (episodes, missions, acts).
Storybook: game-episodedeck--default

### CinematicHero · title · reveal-state

Title/identity hero: kicker, fill+outline display-type title lines, tagline with
highlight, action buttons, accolades. No selection model.
Key data: `{kicker?, title: string | {text, outline?}[], tagline?, highlight? (substring to accent), actions?: {label, href? | onPress?, meta?, variant?: primary|secondary, icon?}[], accolades?: {value, source?}[], tone?}`.
Key props: `data` · `className`.
Use when: landing/marketing/title screens — the package's most reusable piece outside games.
Storybook: game-cinematichero--default

### Effigy · 3d · reveal-state

Interactive glTF/GLB turntable (wraps `<model-viewer>`): poster, camera orbit,
auto-rotate with a reduced-motion-aware pause control.
Key data: `{src, alt (REQUIRED — WCAG 1.1.1), poster?, index?, caption?, loading?: auto|lazy|eager, reveal?: auto|interaction, cameraControls?, autoRotate?, ar?, environmentImage?, tone?}`.
Key props: `ratio` (default '1/1').
Gotchas: model-viewer is lazy-imported on mount, browser-only (SSR-safe) — needs a
bundler with dynamic `import()`. glTF/GLB only; other formats → MediaFrame's poster/doc fallback.
Storybook: game-effigy--default

### MediaFrame · media · reveal-state

Polymorphic media surface: picks the right renderer from the data — `image` → `<img>`,
`audio` → AudioWaveform, `model` → Effigy turntable, `doc`/unknown → glyph plate; loading → Skeleton.
Key data: `{medium: image|audio|model|doc, mediumType?, src?, poster?, ext, alt (REQUIRED), tone?, glyph?}`.
Key props: `ratio` · `interactive` (wraps in a Pressable firing `onActivate` — not
available for the 3D turntable, which owns its pointer) · `loading` · `onActivate`.
Use when: one grid must render mixed asset types (the asset-browser tile).
Storybook: game-mediaframe--default

### Chronicle · skin · reveal-state

Gothic skin over ui **Timeline** — ornate rail, plate chrome, archive tab. Same data,
same keyboard/selection spine, passed straight through.
Key props: `data: TimelineContract` · sel-trio · `tone` (default danger) · `archive?` (tab label).
Use when: a Timeline on a lore/game page. Otherwise use Timeline.
Storybook: game-chronicle--default

### Constellation · skin · **afford-action**

Night-star-chart skin over viz **TalentTree** — stars for nodes, constellations for
branches. The skin owns zero behavior: full allocation engine passthrough.
Key props: `data: TalentTreeContract` · `allocated`/`defaultAllocated`/`onAllocatedChange` · `readOnly` · sel-trio · `tone` (default accent) · `designation?` (tab label).
Use when: a TalentTree in the gothic idiom. Otherwise use TalentTree.
Storybook: game-constellation--default
