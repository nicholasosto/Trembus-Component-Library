import { Box, Stack, Text } from '@trembus/ui';
import { Effigy, Reliquary, SoulCard } from '@trembus/game-viz';
import type { EffigyContract, SoulCardContract } from '@trembus/game-viz';

const mara: SoulCardContract = {
  view: 'soul-card',
  index: 'SOUL · IV',
  state: 'UNBOUND',
  stateTone: 'danger',
  name: 'Mara of the Salt',
  epithet: 'Saltwitch, Thirteenth of her Line',
  tone: 'danger',
  stats: [
    { label: 'House', value: 'Coven of the Cold Coast' },
    { label: 'Bound Epoch', value: 'I · Age of Tides' },
    { label: 'Integrity', value: 'VOLATILE' },
    { label: 'Weapon', value: 'Ninety-nine tongues' },
  ],
  description:
    'A witch made from drowned sailors. Every sound she makes is in a different voice. She is searching for the one voice that was hers.',
  quote: '“All of my mouths are borrowed. None of them lie.”',
  back: {
    heading: 'The Drowning',
    body: 'Drowned off the Cold Coast in the Age of Tides; the sea kept her voice and returned ninety-nine others.',
    items: [
      { label: 'Rite', value: 'The Hundredth Voice' },
      { label: 'Ward', value: 'Salt across the threshold' },
      { label: 'Bane', value: 'Her name, spoken true' },
    ],
    quote: '“Tell me which voice was mine and I will give you the other ninety-eight.”',
  },
};

const knight: SoulCardContract = {
  index: 'SOUL · I',
  state: 'CONTAINED',
  stateTone: 'success',
  name: 'The Kept Knight',
  epithet: 'Subject 001, Order of the Rusted Cross',
  tone: 'accent',
  stats: [
    { label: 'House', value: 'Order of the Rusted Cross' },
    { label: 'Bound Epoch', value: 'IX · Age of Iron' },
    { label: 'Integrity', value: '34.7%' },
    { label: 'Weapon', value: 'A single nail' },
  ],
  description:
    'Forged in the drowned cathedral of Vaskerholm. He does not remember dying. He remembers the hammer.',
  quote: '“I was made to hold. So I hold.”',
  back: {
    heading: 'The Forging',
    body: 'Hammered from a drowned cathedral bell. Each strike bound another soul to the steel.',
    items: [
      { label: 'Rite', value: 'The Last Nail' },
      { label: 'Ward', value: 'A name no one remembers' },
    ],
    quote: '“I was made to hold. So I hold.”',
  },
};

const effigy: EffigyContract = {
  src: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
  alt: 'A low-poly figurine standing in for the Kept Cosmonaut relic',
  poster: 'https://modelviewer.dev/assets/poster-astronaut.png',
  index: 'RELIC · 008',
  caption: 'Orbit · zoom · pause',
  reveal: 'auto',
  autoRotate: true,
  cameraControls: true,
  tone: 'accent',
};

export function Roster() {
  return (
    <Stack gap={7}>
      <Stack gap={2}>
        <Text as="h1" size="xl" weight="bold" className="page-title">
          The Roster
        </Text>
        <Text tone="dim">
          Character dossiers (<Text as="span" mono>SoulCard</Text>) and a reliquary-framed 3D effigy
          — every component from <Text as="span" mono>@trembus/game-viz</Text>, on a real route.
        </Text>
      </Stack>

      <div className="soul-grid">
        <SoulCard data={mara} />
        <SoulCard data={knight} />
        <Reliquary
          label="RELIC · 008"
          tag="THE KEPT COSMONAUT"
          tone="accent"
          aria-label="The Kept Cosmonaut reliquary"
          status={[
            { label: 'TETHER — NOMINAL', tone: 'success' },
            { label: 'DRIFT DETECTED', tone: 'warning' },
          ]}
        >
          <Box p={2}>
            <Effigy data={effigy} ratio="1 / 1" />
          </Box>
        </Reliquary>
      </div>
    </Stack>
  );
}
