import type { ComponentContract } from '../../types/contract';

export const calloutContract: ComponentContract = {
  name: 'Callout',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'maps a status tone to the color-coded ontology (info/success/warning/danger/neutral/accent) via tokens — a tinted surface, left accent rail, and tone icon make the intent perceivable at a glance.',
      story: 'Tones',
    },
    affordAction: {
      satisfiedBy:
        'when dismissable it exposes a close button with an accessible label; otherwise it is a static banner whose body can carry inline code and links.',
      story: 'Default',
    },
    acknowledgeInput: {
      satisfiedBy:
        'the dismiss button responds to click and Enter/Space, firing onDismiss so the host can remove the banner; the button carries a focus ring.',
      story: 'Interaction',
    },
  },
  a11y: { keyboard: ['Tab', 'Enter', 'Space'], focusRing: true },
  tokensUsed: ['--tcl-status-*', '--tcl-accent', '--tcl-surface', '--tcl-focus-ring'],
};

export default calloutContract;
