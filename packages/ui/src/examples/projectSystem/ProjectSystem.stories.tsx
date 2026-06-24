import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, Hub, Inline, Stack, Swimlane, Text } from '../../index';
// Tier-2 Lineage lives in @trembus/viz. This example spans both packages (as a real
// consumer of the project-system would) and ui has no dependency on viz, so it reaches
// the component by source path — story-only, no change to the published dependency graph.
import { Lineage } from '../../../../viz/src/index';
import { PROJECT_ENTITIES } from './entities.fixture';
import { toHubContract, toLineageContract, toSwimlaneContract } from './toContracts';
import type { EntityKind } from './projectEntity';

/**
 * `Examples/Project System` — the Soul-Steel `_project/` planning graph rendered through
 * three @trembus components from ONE `ProjectEntity[]`. Proof of the schema's §6 claim:
 * the planning model and the component library already speak the same Visual-Grammar
 * contracts, so a thin pure adapter is the whole bridge.
 */
const meta: Meta = {
  title: 'Examples/Project System',
};
export default meta;

type Story = StoryObj;

const KINDS: EntityKind[] = ['decision', 'session', 'report', 'pipeline', 'roadmap'];

function SectionLabel({ tag, title, blurb }: { tag: string; title: string; blurb: string }) {
  return (
    <Stack gap={1}>
      <Inline gap={2} align="baseline">
        <Badge tone="accent" variant="soft">
          {tag}
        </Badge>
        <Text size="lg" weight="semibold">
          {title}
        </Text>
      </Inline>
      <Text size="sm">{blurb}</Text>
    </Stack>
  );
}

export const Default: Story = {
  render: () => {
    const hub = toHubContract(PROJECT_ENTITIES);
    const lineage = toLineageContract(PROJECT_ENTITIES);
    const swimlane = toSwimlaneContract(PROJECT_ENTITIES);
    return (
      <Stack gap={7} style={{ maxWidth: 1000, margin: '0 auto' }}>
        <Stack gap={2}>
          <Text size="xl" weight="bold">
            Soul Steel · _project/ system
          </Text>
          <Text size="base">
            One ProjectEntity contract → three @trembus views. {PROJECT_ENTITIES.length} real
            planning entities (snapshot 2026-06-24), each node, edge and tally derived by the
            adapter — nothing authored twice.
          </Text>
          <Inline gap={2} wrap>
            {KINDS.map((k) => (
              <Badge key={k} tone="neutral" variant="outline" dot>
                {PROJECT_ENTITIES.filter((e) => e.kind === k).length} {k}
              </Badge>
            ))}
          </Inline>
        </Stack>

        <Stack gap={3}>
          <SectionLabel
            tag="Hub"
            title="Rollup — all five kinds"
            blurb="Each kind is a petal; its count and dominant-status line are tallied from the entities. Schema §6, 'rollup of all kinds → Hub'."
          />
          <Hub data={hub} />
        </Stack>

        <Stack gap={3}>
          <SectionLabel
            tag="Lineage"
            title="Governance graph — the links[] primitive"
            blurb="The ADR → M3 → M4 → M5 → inventory delivery spine. The adapter auto-scopes to the connected component, so dangling and external targets simply drop out. Schema §5/§6."
          />
          <Lineage data={lineage} />
        </Stack>

        <Stack gap={3}>
          <SectionLabel
            tag="Swimlane"
            title="Sessions by agent"
            blurb="The agent tag becomes the lane (neutral planning vs codex execution); session status becomes the step state. Schema §4b/§6."
          />
          <Swimlane data={swimlane} />
        </Stack>
      </Stack>
    );
  },
};
