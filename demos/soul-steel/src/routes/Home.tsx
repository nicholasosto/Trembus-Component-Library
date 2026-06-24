import { Link, useNavigate } from 'react-router-dom';
import { Box, Inline, Stack, Text } from '@trembus/ui';
import { CinematicHero } from '@trembus/game-viz';
import type { CinematicHeroContract } from '@trembus/game-viz';
import { NAV_ROUTES } from '../app/nav';

export function Home() {
  const navigate = useNavigate();

  // CinematicHero actions support `onPress` (vs `href`) — use it to keep
  // navigation client-side via react-router instead of a full page load.
  const hero: CinematicHeroContract = {
    view: 'cinematic-hero',
    tone: 'danger',
    kicker: 'A @trembus demo site · ui · viz · game-viz',
    title: [{ text: 'Soul' }, { text: 'Steel', outline: true }],
    tagline:
      'A multi-page site built entirely from the Trembus component library — the same tokens, primitives, and cinematic components that ship in Storybook, here wired into real routes.',
    highlight: 'real routes',
    actions: [
      { label: 'Meet the roster', icon: '◈', variant: 'primary', onPress: () => navigate('/roster') },
      {
        label: 'Browse episodes',
        icon: '▶',
        variant: 'secondary',
        onPress: () => navigate('/episodes'),
      },
    ],
    accolades: [
      { value: '3', source: 'packages composed' },
      { value: '3', source: 'routed pages' },
      { value: 'AA', source: 'contrast kept' },
    ],
  };

  return (
    <Stack gap={7}>
      <CinematicHero data={hero} />

      <Stack gap={4}>
        <Text as="h2" size="lg" weight="semibold">
          Explore the demo
        </Text>
        <Inline gap={5} wrap>
          {NAV_ROUTES.filter((route) => route.path !== '/').map((route) => (
            <Box
              key={route.path}
              as={Link}
              to={route.path}
              surface="raised"
              border
              radius="lg"
              p={6}
              className="card-link"
              style={{ flex: '1 1 280px', minWidth: 240 }}
            >
              <Stack gap={2}>
                <Text as="span" size="xs" mono tone="dim">
                  {route.label.toUpperCase()}
                </Text>
                <Text as="span" size="md" weight="semibold">
                  {route.blurb}
                </Text>
              </Stack>
            </Box>
          ))}
        </Inline>
      </Stack>
    </Stack>
  );
}
