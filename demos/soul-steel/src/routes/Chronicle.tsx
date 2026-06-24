import { Stack, Text } from '@trembus/ui';
import { Chronicle as ChronicleViz } from '@trembus/game-viz';
import type { ChronicleContract } from '@trembus/game-viz';

const ironAge: ChronicleContract = {
  view: 'timeline',
  code: 'III',
  brand: 'The Reliquary',
  title: 'Chronicle of the Iron Age',
  caption: 'Click an event to inspect it; step the ages with the arrows.',
  meta: '1,204 years · 7 epochs',
  categories: [
    { key: 'war', label: 'Wars', tone: 'danger' },
    { key: 'rite', label: 'Rites', tone: 'info' },
    { key: 'fall', label: 'Falls', tone: 'neutral' },
    { key: 'pact', label: 'Pacts', tone: 'success' },
  ],
  events: [
    {
      id: 'drown',
      at: -4,
      dateLabel: '-IV A.V.',
      sub: 'Epoch · Tides',
      label: 'The Sea Takes Vaskerholm',
      category: 'fall',
      detail: 'The cathedral city drowns in a single tide. Nine thousand souls refuse to go with it.',
      note: 'The drowning is the founding wound — every later rite reaches back to it.',
    },
    {
      id: 'pact',
      at: 0,
      dateLabel: '0 A.V.',
      sub: 'Epoch · Tides',
      label: 'The First Pact',
      category: 'pact',
      detail: 'The Order is founded on the drowned altar. The first knight agrees to the first nail.',
      note: 'Anno Vinculum — "the year of the binding." The calendar starts here.',
    },
    {
      id: 'rite',
      at: 12,
      dateLabel: 'XII A.V.',
      sub: 'Epoch · Tides',
      label: 'The Silent Rite',
      category: 'rite',
      detail: 'Eight hundred souls bound in a single night. No one remembers who conducted the rite.',
    },
    {
      id: 'war',
      at: 211,
      dateLabel: 'CCXI A.V.',
      sub: 'Epoch · Silence',
      label: 'War of Cold Coasts',
      category: 'war',
      detail: 'The Coven of the Cold Coast breaks the pact. Salt meets steel for three generations.',
      note: 'The longest war of the age — and the one that made Mara of the Salt.',
    },
    {
      id: 'gate',
      at: 471,
      dateLabel: 'CDLXXI A.V.',
      sub: 'Epoch · Silence',
      label: 'The Ninth Gate Built',
      category: 'rite',
      detail: 'Warden Solveig takes her post. She does not leave it.',
    },
    {
      id: 'forge',
      at: 800,
      dateLabel: 'DCCC A.V.',
      sub: 'Epoch · Ash',
      label: 'The Forge Rekindled',
      category: 'war',
      detail: 'The Kept Knight is struck from a drowned cathedral bell. The first reliquary walks.',
    },
    {
      id: 'broken',
      at: 1200,
      dateLabel: 'MCC A.V.',
      sub: 'Epoch · Ash',
      label: 'All Rites Broken',
      category: 'fall',
      detail: 'The forge consumes its maker. The age ends as it began — under water, under salt.',
      note: 'The chronicle stops here. No one survived to write the next entry.',
    },
  ],
};

export function Chronicle() {
  return (
    <Stack gap={7}>
      <Stack gap={2}>
        <Text as="h1" size="xl" weight="bold" className="page-title">
          Chronicle
        </Text>
        <Text tone="dim">
          The <Text as="span" mono>Chronicle</Text> (game-viz) — a liturgical skin over the ui{' '}
          <Text as="span" mono>Timeline</Text>, the newest Tier-1 visualization — on a real route.
        </Text>
      </Stack>
      <ChronicleViz data={ironAge} defaultSelectedId="war" archive="The Reliquary Archive" />
    </Stack>
  );
}
