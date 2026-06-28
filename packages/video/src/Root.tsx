import { Composition } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Cinzel';
import { HeroPromo } from './HeroPromo';
import { AddComponentTutorial } from './tutorial/AddComponentTutorial';
import { totalDurationInFrames } from './tutorial/script';
import { WorkflowDemo } from './workflow/WorkflowDemo';
import { T as workflowT } from './workflow/timeline';
// The whole point: render the REAL @trembus components, styled by the REAL token
// bundle. webpack ingests these CSS subpath exports as-is (@layer cascade intact).
// game-viz for the cinematic promo; ui for the Swimlane / RunHistory in the demo.
import '@trembus/game-viz/styles.css';
import '@trembus/ui/styles.css';

// The repo references --tcl-font-display ('Cinzel', Optima, …) but ships no font
// face, so on a headless render box the gold liturgical title would fall back to a
// generic serif. Registering Cinzel here (render-blocking via the package's own
// delayRender) makes the existing token value resolve to the intended face.
loadFont();

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HeroPromo"
        component={HeroPromo}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="AddComponentTutorial"
        component={AddComponentTutorial}
        durationInFrames={totalDurationInFrames}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="WorkflowDemo"
        component={WorkflowDemo}
        durationInFrames={workflowT.total}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
