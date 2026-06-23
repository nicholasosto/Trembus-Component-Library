import { Composition } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Cinzel';
import { HeroPromo } from './HeroPromo';
// The whole point: render the REAL @trembus components, styled by the REAL token
// bundle. webpack ingests this CSS subpath export as-is (@layer cascade intact).
import '@trembus/game-viz/styles.css';

// The repo references --tcl-font-display ('Cinzel', Optima, …) but ships no font
// face, so on a headless render box the gold liturgical title would fall back to a
// generic serif. Registering Cinzel here (render-blocking via the package's own
// delayRender) makes the existing token value resolve to the intended face.
loadFont();

export const RemotionRoot = () => {
  return (
    <Composition
      id="HeroPromo"
      component={HeroPromo}
      durationInFrames={240}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
