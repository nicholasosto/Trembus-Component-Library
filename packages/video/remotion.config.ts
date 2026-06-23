import { Config } from '@remotion/cli/config';

// Plain CSS imports (incl. the @trembus token bundle) work with Remotion's default
// webpack — no override needed (overrides are only for SCSS/Tailwind/special loaders).
Config.setVideoImageFormat('jpeg');
Config.setConcurrency(2);
