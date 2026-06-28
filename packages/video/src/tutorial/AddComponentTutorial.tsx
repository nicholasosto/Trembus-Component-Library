import type { ReactNode } from 'react';
import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { SceneView } from './scenes';
import { SCENES } from './script';
import type { Transition } from './script';

/**
 * Build the `<TransitionSeries.Transition>` for a scene's entrance. The element is
 * constructed inside the switch so each branch carries a CONCRETE presentation type
 * — returning `fade() | slide() | wipe()` as a union wouldn't satisfy Transition's
 * generic `presentation` prop.
 */
function transitionFor(t: Transition, key: string): ReactNode {
  const timing = linearTiming({ durationInFrames: t.frames });
  switch (t.type) {
    case 'fade':
      return <TransitionSeries.Transition key={key} presentation={fade()} timing={timing} />;
    case 'slide':
      return (
        <TransitionSeries.Transition
          key={key}
          presentation={slide({ direction: t.direction ?? 'from-right' })}
          timing={timing}
        />
      );
    case 'wipe':
      return (
        <TransitionSeries.Transition
          key={key}
          presentation={wipe({ direction: t.direction ?? 'from-left' })}
          timing={timing}
        />
      );
  }
}

/**
 * "Add a Component" — the scenes stitched together with `@remotion/transitions`.
 * Each scene declares the transition that precedes it (`scene.enter`); we flatten
 * the list into the alternating Sequence / Transition children TransitionSeries
 * expects. Total length is derived in `script.ts` (`totalDurationInFrames`) so the
 * <Composition> stays in sync when a scene's timing changes.
 */
export function AddComponentTutorial() {
  const children: ReactNode[] = [];
  SCENES.forEach((scene, i) => {
    if (i > 0 && scene.enter) {
      children.push(transitionFor(scene.enter, `t-${scene.id}`));
    }
    children.push(
      <TransitionSeries.Sequence key={scene.id} durationInFrames={scene.durationInFrames}>
        <SceneView scene={scene} />
      </TransitionSeries.Sequence>,
    );
  });
  return <TransitionSeries>{children}</TransitionSeries>;
}
