// Example PAGE — the library auditing itself. NOT a library component (no single
// 3-jobs contract), so it lives in src/examples/, outside src/components/, where
// check:contracts never looks.
//
// The point: a review of 60 components is exactly the document Brief was built for
// (collapsible sections, decisions with a `choice`, checklists with severity), and
// the contested calls are exactly what DecisionMap was built for (options, a
// recommendation with strength + confidence, consequence cascades). Rendering the
// audit through the audited library is the strongest possible dog-food.
//
// The canonical record is COMPONENT-REVIEW.md at the repo root; ./review.ts mirrors
// its verdicts as data. Composed from the public barrel ('../../index').
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, Brief, Callout, DecisionMap, Inline, Stack, Text } from '../../index';
import { FILL_BAR_DECISION, INSPECTOR_DECISION, REVIEW } from './review';

function ComponentReview() {
  const [width, setWidth] = useState<number | undefined>(undefined);

  return (
    <Stack gap={6} style={{ maxWidth: 1180, margin: '0 auto' }}>
      <Stack gap={2}>
        <Inline gap={3} align="center" wrap>
          <Text as="h1" size="xl" weight="semibold">
            Component review
          </Text>
          <Badge tone="success">0 merges</Badge>
          <Badge tone="info">1 extraction</Badge>
          <Badge tone="neutral">2026-07-25</Badge>
        </Inline>
        <Text tone="dim" size="sm">
          60 contracted components across @trembus/ui · viz · game-viz, reviewed as a set for the
          first time. Drag the document’s right edge to re-measure it.
        </Text>
      </Stack>

      <Callout tone="success" title="Headline">
        Every family came back <strong>keep</strong>. The overlap the review went looking for was
        already resolved one layer down — shared internals plus cross-documented boundaries — so the
        work became one real extraction, two doc fixes, and a written record of what was
        deliberately <em>not</em> done.
      </Callout>

      <Brief data={REVIEW} resizable width={width} onWidthChange={setWidth} />

      <Stack gap={3}>
        <Text as="h2" size="lg" weight="semibold">
          The question that started it
        </Text>
        <DecisionMap data={FILL_BAR_DECISION} />
      </Stack>

      <Stack gap={3}>
        <Text as="h2" size="lg" weight="semibold">
          A finding that did not survive contact with the code
        </Text>
        <Text tone="dim" size="sm">
          Worth keeping visible: the review’s second-largest “duplication” dissolved once all 17
          sites were read. Declining it is the finding.
        </Text>
        <DecisionMap data={INSPECTOR_DECISION} />
      </Stack>
    </Stack>
  );
}

const meta = {
  title: 'Examples/Component Review',
  component: ComponentReview,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ComponentReview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
