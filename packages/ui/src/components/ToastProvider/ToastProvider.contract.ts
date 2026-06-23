import type { ComponentContract } from '../../types/contract';

export const toastProviderContract: ComponentContract = {
  name: 'ToastProvider',
  leadJob: 'acknowledge-input',
  jobs: {
    revealState: {
      satisfiedBy: 'each toast shows a tone-coded result (success/info/warning/danger/neutral) in a portal viewport.',
      story: 'States',
    },
    affordAction: {
      satisfiedBy: 'exposes useToast(); a dismiss button affords closing; auto-dismiss with pause-on-hover.',
      story: 'Default',
    },
    acknowledgeInput: {
      satisfiedBy: 'a triggered action is acknowledged by an announced toast (role=status/alert + aria-live).',
      story: 'Interaction',
    },
  },
  a11y: { role: 'status', focusRing: true },
  tokensUsed: ['--tcl-surface-raised', '--tcl-status-*', '--tcl-elevation-3', '--tcl-z-toast'],
};

export default toastProviderContract;
