import { NavLink, Outlet } from 'react-router-dom';
import { Box, Button, Inline, Text } from '@trembus/ui';
import { useTheme } from '../theme';
import { NAV_ROUTES } from './nav';

/**
 * The app shell: a sticky header (brand + primary nav + theme toggle), the
 * routed `<Outlet />`, and a footer. Composed from @trembus/ui primitives; the
 * outer `.tcl-root` makes the whole tree inherit the themed font/bg/text.
 */
export function Shell() {
  const { theme, toggle } = useTheme();
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <div className="tcl-root app">
      <Box as="header" surface="raised" border="soft" px={6} py={4} className="app__header">
        <Inline align="center" justify="between" gap={5} wrap>
          <Inline align="baseline" gap={3}>
            <Text as="span" className="app__brand">
              Soul Steel
            </Text>
            <Text size="xs" mono tone="faint">
              @trembus demo
            </Text>
          </Inline>

          <Inline as="nav" aria-label="Primary" align="center" gap={1} wrap>
            {NAV_ROUTES.map((route) => (
              <NavLink key={route.path} to={route.path} end={route.path === '/'} className="nav-link">
                {route.label}
              </NavLink>
            ))}
          </Inline>

          <Button
            variant="outline"
            tone="neutral"
            size="sm"
            onPress={toggle}
            aria-label={`Switch to ${nextTheme} theme`}
          >
            {nextTheme === 'dark' ? 'Dark' : 'Light'} mode
          </Button>
        </Inline>
      </Box>

      <Box as="main" px={6} py={7} className="app__main">
        <Outlet />
      </Box>

      <Box as="footer" surface="sunken" border="soft" px={6} py={5}>
        <Text size="sm" tone="dim">
          A multi-page demo site composing{' '}
          <Text as="span" size="sm" mono>
            @trembus/ui
          </Text>
          ,{' '}
          <Text as="span" size="sm" mono>
            @trembus/viz
          </Text>
          , and{' '}
          <Text as="span" size="sm" mono>
            @trembus/game-viz
          </Text>{' '}
          through their published API.
        </Text>
      </Box>
    </div>
  );
}
