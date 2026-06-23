// Styles must load first so the @layer order (from @trembus/tokens, via
// @trembus/ui) is established before any component CSS. Consumers using the
// prebuilt bundle import '@trembus/game-viz/styles.css'.
import './styles/index.css';

// ── expressive game / cinematic UI (build on @trembus/ui primitives) ──
export { Reliquary } from './components/Reliquary/Reliquary';
export type {
  ReliquaryProps,
  ReliquaryStatus,
  ReliquaryStatusTone,
} from './components/Reliquary/Reliquary';

export { SoulCard } from './components/SoulCard/SoulCard';
export type {
  SoulCardProps,
  SoulCardContract,
  SoulStat,
  SoulCardTone,
} from './components/SoulCard/SoulCard';

export { EpisodeDeck } from './components/EpisodeDeck/EpisodeDeck';
export type {
  EpisodeDeckProps,
  EpisodeDeckContract,
  Episode,
  EpisodeState,
  EpisodeDeckTone,
} from './components/EpisodeDeck/EpisodeDeck';

export { CinematicHero } from './components/CinematicHero/CinematicHero';
export type {
  CinematicHeroProps,
  CinematicHeroContract,
  CinematicHeroTone,
  HeroTitleLine,
  HeroAction,
  HeroAccolade,
} from './components/CinematicHero/CinematicHero';
export { Effigy } from './components/Effigy/Effigy';
export type { EffigyProps, EffigyContract, EffigyTone } from './components/Effigy/Effigy';
