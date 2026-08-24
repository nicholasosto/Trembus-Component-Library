import { useEffect, useState } from 'react';
import { Badge, Button, Callout, Dialog, Inline, Stack, Stepper, Text } from '@trembus/ui';
import type { StepperStep } from '@trembus/ui';
import { STEPS } from '../data';

type Phase = 'confirm' | 'running' | 'result';

const STEP_MS = 850;

/**
 * The governed Deep Clean flow as an in-app modal sequence:
 * confirm → live progress (the new `Stepper`) → proposed plan. The whole thing is
 * one controlled `Dialog`; the body and footer swap by phase.
 */
export function DeepCleanFlow({
  open,
  onClose,
  onImplemented,
}: {
  open: boolean;
  onClose: () => void;
  onImplemented: () => void;
}) {
  const [phase, setPhase] = useState<Phase>('confirm');
  const [step, setStep] = useState(0);

  // Reset every time the dialog is opened.
  useEffect(() => {
    if (open) {
      setPhase('confirm');
      setStep(0);
    }
  }, [open]);

  // Drive the stepper while running.
  useEffect(() => {
    if (!open || phase !== 'running') return;
    if (step >= STEPS.length) {
      const t = setTimeout(() => setPhase('result'), STEP_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [open, phase, step]);

  const previewSteps: StepperStep[] = STEPS.map((s) => ({ label: s.label, status: 'pending' }));

  const liveSteps: StepperStep[] = STEPS.map((s, i) => ({
    label: s.label,
    status: i < step ? 'done' : i === step ? 'active' : 'pending',
    description: i < step ? s.done : i === step ? s.running : undefined,
  }));

  const title =
    phase === 'confirm'
      ? 'Run Deep Clean?'
      : phase === 'running'
        ? 'Deep Clean in progress'
        : 'Proposed reorg plan';

  const description =
    phase === 'confirm'
      ? 'The Maid studies every file, then drafts a plan. Nothing moves until you Implement.'
      : phase === 'running'
        ? '_inbox room · reading contents, drafting a plan'
        : '_inbox room · draft · nothing moved yet';

  let footer;
  if (phase === 'confirm') {
    footer = (
      <Inline gap={3} justify="end">
        <Button variant="ghost" tone="neutral" onPress={onClose}>
          Cancel
        </Button>
        <Button tone="accent" onPress={() => setPhase('running')}>
          Approve &amp; run
        </Button>
      </Inline>
    );
  } else if (phase === 'running') {
    footer = (
      <Inline gap={3} justify="end">
        <Button variant="outline" tone="neutral" onPress={onClose}>
          Cancel run
        </Button>
      </Inline>
    );
  } else {
    footer = (
      <Inline gap={3} align="center">
        <Button variant="ghost" tone="danger" onPress={onClose}>
          Reject
        </Button>
        <span style={{ flex: 1 }} />
        <Button variant="outline" tone="neutral" onPress={onClose}>
          Park for later
        </Button>
        <Button
          tone="accent"
          onPress={() => {
            onImplemented();
            onClose();
          }}
        >
          Implement
        </Button>
      </Inline>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} title={title} description={description} footer={footer}>
      {phase === 'confirm' && (
        <Stack gap={4}>
          <Text size="sm" tone="dim">
            What happens when you approve:
          </Text>
          <Stepper steps={previewSteps} size="sm" label="Deep Clean steps" />
          <Callout tone="success" title="Read-only pass">
            Your laws decide every move; shapes with no law are parked, never guessed. The whole plan
            is reversible.
          </Callout>
        </Stack>
      )}

      {phase === 'running' && <Stepper steps={liveSteps} label="Deep Clean progress" />}

      {phase === 'result' && (
        <Stack gap={4}>
          <Inline gap={3} wrap>
            <Badge tone="success" dot>
              6 routed
            </Badge>
            <Badge tone="neutral" dot>
              3 duplicates archived
            </Badge>
            <Badge tone="info" dot>
              2 parked
            </Badge>
          </Inline>
          <Text size="sm" tone="dim">
            6 misplaced files route to 4 lawful homes; 3 exact duplicates go to{' '}
            <Text as="span" size="sm" mono>
              _archive/duplicates/
            </Text>
            ; 2 shapes with no law wait in{' '}
            <Text as="span" size="sm" mono>
              parked/
            </Text>
            .
          </Text>
          <Callout tone="info" title="2 shapes still need a law">
            <Text as="span" size="sm" mono>
              roster.csv
            </Text>{' '}
            and{' '}
            <Text as="span" size="sm" mono>
              stats_export.xlsx
            </Text>{' '}
            are parked — draft a law from the Laws page and they route themselves next time.
          </Callout>
        </Stack>
      )}
    </Dialog>
  );
}
