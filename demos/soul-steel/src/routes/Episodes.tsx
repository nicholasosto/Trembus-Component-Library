import { useState } from 'react';
import { Box, Inline, Stack, Text } from '@trembus/ui';
import { EpisodeDeck } from '@trembus/game-viz';
import type { EpisodeDeckContract } from '@trembus/game-viz';
import { Lineage } from '@trembus/viz';
import type { GraphContract } from '@trembus/viz';

const season: EpisodeDeckContract = {
  view: 'episode-deck',
  title: 'Episode deck',
  caption: 'Season One · select a chapter to inspect it.',
  episodes: [
    {
      id: 'ep01',
      title: 'The Invocation',
      code: 'S01 · EP 01',
      state: 'streaming',
      synopsis: "A blacksmith's daughter drives the last nail into the last knight.",
    },
    {
      id: 'ep02',
      title: 'The Ninth Gate',
      code: 'S01 · EP 02',
      state: 'available',
      synopsis: 'The cathedral opens a door that was bricked shut for a reason.',
    },
    {
      id: 'ep03',
      title: 'Mara Under the Salt',
      code: 'S01 · EP 03',
      state: 'available',
      synopsis: 'Ninety-nine voices, and not one of them hers — yet.',
    },
    { id: 'ep04', title: 'The Kept Knight Speaks', code: 'S01 · EP 04', state: 'locked', releaseAt: 'APR 26' },
    { id: 'ep05', title: 'All Rites Broken', code: 'S01 · EP 05', state: 'locked', releaseAt: 'MAY 03' },
    { id: 'ep06', title: 'Ferrum · Anima · Ignis', code: 'S01 · EP 06', state: 'locked', releaseAt: 'MAY 10' },
  ],
};

const arc: GraphContract = {
  view: 'lineage',
  brand: 'Soul Steel',
  code: 'season.one.arc',
  title: 'Season One — narrative spine',
  caption: 'Episodes in order, with the two souls whose threads cross them.',
  direction: 'LR',
  nodes: [
    { id: 'ep01', label: 'The Invocation', kind: 'episode', tone: 'accent', sub: 'EP 01' },
    { id: 'ep02', label: 'The Ninth Gate', kind: 'episode', sub: 'EP 02' },
    { id: 'ep03', label: 'Mara Under the Salt', kind: 'episode', sub: 'EP 03' },
    { id: 'ep04', label: 'The Kept Knight Speaks', kind: 'episode', sub: 'EP 04' },
    { id: 'ep05', label: 'All Rites Broken', kind: 'episode', sub: 'EP 05' },
    {
      id: 'ep06',
      label: 'Ferrum · Anima · Ignis',
      kind: 'finale',
      tone: 'danger',
      sub: 'EP 06',
      note: 'The forge consumes its maker.',
    },
    { id: 'mara', label: 'Mara of the Salt', kind: 'soul', tone: 'info', note: 'Her voice arc threads ep03 → ep05.' },
    { id: 'knight', label: 'The Kept Knight', kind: 'soul', tone: 'success', note: 'Subject 001; finally speaks in ep04.' },
  ],
  edges: [
    { from: 'ep01', to: 'ep02' },
    { from: 'ep02', to: 'ep03' },
    { from: 'ep03', to: 'ep04' },
    { from: 'ep04', to: 'ep05' },
    { from: 'ep05', to: 'ep06' },
    { from: 'mara', to: 'ep03', dashed: true, label: 'introduces' },
    { from: 'mara', to: 'ep05', dashed: true, label: 'resolves' },
    { from: 'knight', to: 'ep04', dashed: true, label: 'speaks' },
    { from: 'knight', to: 'ep06', dashed: true, label: 'forged' },
  ],
};

export function Episodes() {
  const [selectedId, setSelectedId] = useState('ep01');
  const selected = season.episodes.find((episode) => episode.id === selectedId);

  return (
    <Stack gap={7}>
      <Stack gap={2}>
        <Text as="h1" size="xl" weight="bold" className="page-title">
          Episodes
        </Text>
        <Text tone="dim">
          An <Text as="span" mono>EpisodeDeck</Text> (game-viz) wired to this page's state, beside a{' '}
          <Text as="span" mono>Lineage</Text> (viz) of the arc — two packages on one route.
        </Text>
      </Stack>

      <Inline gap={6} align="start" wrap>
        <div style={{ flex: '1 1 360px', minWidth: 300, maxWidth: 460 }}>
          <EpisodeDeck data={season} selectedId={selectedId} onSelect={setSelectedId} />
        </div>

        <Box surface="raised" border radius="lg" p={6} style={{ flex: '1 1 320px', minWidth: 280 }}>
          <Stack gap={3}>
            <Text size="xs" mono tone="faint">
              NOW INSPECTING
            </Text>
            <Text as="h2" size="lg" weight="semibold">
              {selected ? selected.title : 'Select an episode'}
            </Text>
            {selected?.code ? (
              <Text size="sm" mono tone="dim">
                {selected.code}
              </Text>
            ) : null}
            <Text tone="dim">
              {selected?.synopsis ?? 'This chapter keeps its secrets — no synopsis yet.'}
            </Text>
          </Stack>
        </Box>
      </Inline>

      <Stack gap={3}>
        <Text as="h2" size="lg" weight="semibold">
          Season arc
        </Text>
        <Box surface="sunken" border="soft" radius="lg" p={4}>
          <Lineage data={arc} />
        </Box>
      </Stack>
    </Stack>
  );
}
