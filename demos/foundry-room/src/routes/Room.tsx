import { useState } from 'react';
import { Badge, Box, Callout, FolderTree, Inline, Stack, Text } from '@trembus/ui';
import type { FolderNode } from '@trembus/ui';
import { MaidDock } from '../components/MaidDock';
import { DeepCleanFlow } from '../components/DeepCleanFlow';
import { ROOM, STATUS_LABEL, STATUS_TONE, VERDICTS } from '../data';

interface Selected {
  id: string;
  label: string;
}

export function Room() {
  const [flowOpen, setFlowOpen] = useState(false);
  const [cleaned, setCleaned] = useState(false);
  const [tidied, setTidied] = useState(false);
  const [selected, setSelected] = useState<Selected | null>(null);

  const verdict = selected ? VERDICTS[selected.id] : undefined;

  return (
    <Stack gap={6}>
      <Stack gap={2}>
        <Inline gap={3} align="baseline" wrap>
          <Text size="xl" style={{ fontWeight: 680 }}>
            Room
          </Text>
          <Text mono tone="faint">
            Foundry / _inbox
          </Text>
        </Inline>
        <Inline gap={3} align="center" wrap>
          <Badge tone="neutral" dot>
            24 files
          </Badge>
          <Badge tone="warning" dot>
            6 misplaced
          </Badge>
          <Badge tone="info" dot>
            2 unestablished
          </Badge>
        </Inline>
      </Stack>

      {cleaned && (
        <Callout tone="success" title="Deep Clean applied">
          6 files routed to their lawful homes · 3 duplicates archived · 2 shapes parked. Reversible
          for 30 days.
        </Callout>
      )}
      {tidied && !cleaned && (
        <Callout tone="info" title="Tidy Room" onDismiss={() => setTidied(false)}>
          The lighter pass gathers scattered files by kind (loose images together, spreadsheets
          together) — no doors crossed, no policy decided. Run Deep Clean for the governed pass.
        </Callout>
      )}

      <div className="room-grid">
        <Box surface="sunken" border="soft" radius="lg" p={4} className="room-tree">
          <FolderTree
            data={ROOM}
            label="Room contents"
            filter
            defaultExpandedIds={['inbox', 'misc', 'downloads', 'notes']}
            onSelect={(id: string, node: FolderNode) =>
              setSelected(node.kind === 'folder' ? null : { id, label: node.label })
            }
          />
        </Box>

        <Stack gap={4}>
          <MaidDock onTidy={() => setTidied(true)} onDeepClean={() => setFlowOpen(true)} />

          <Box surface="raised" border="soft" radius="lg" p={4}>
            <Stack gap={2}>
              <Text size="xs" mono tone="faint" style={{ letterSpacing: '0.12em' }}>
                INSPECTOR
              </Text>
              {selected && verdict ? (
                <Stack gap={2}>
                  <Text mono>{selected.label}</Text>
                  <Inline gap={2} align="center">
                    <Badge tone={STATUS_TONE[verdict.status]} dot>
                      {STATUS_LABEL[verdict.status]}
                    </Badge>
                  </Inline>
                  <Text size="sm" tone="dim">
                    {verdict.note}
                  </Text>
                </Stack>
              ) : (
                <Text size="sm" tone="dim">
                  Select a file to see the Maid&rsquo;s verdict — where it belongs, or whether its
                  shape has no law yet.
                </Text>
              )}
            </Stack>
          </Box>
        </Stack>
      </div>

      <DeepCleanFlow
        open={flowOpen}
        onClose={() => setFlowOpen(false)}
        onImplemented={() => setCleaned(true)}
      />
    </Stack>
  );
}
