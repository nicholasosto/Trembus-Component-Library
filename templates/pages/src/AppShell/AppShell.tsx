/* @trembus-template app-shell v1.0.0 · AppShell.tsx (main) · chrome is template-owned — edit only inside @tcl-slot regions; re-apply via the trembus-template skill */
import type { ReactNode } from 'react';
import { Box, Button, Inline, NavBar, SkipLink, Text } from '@trembus/ui';
import { useTheme } from './useTheme';
import './app-shell.css';

export interface AppShellProps {
  /** Page content. Router apps typically replace the main-content slot body
   *  with their outlet (e.g. react-router's `<Outlet />`) instead. */
  children?: ReactNode;
}

/** Light/dark toggle wired to `data-theme` on <html> (the @trembus/tokens
 *  mechanism). Exported so apps can move or remove it from the header-actions
 *  slot without stranding the hook. */
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  return (
    <Button
      variant="outline"
      tone="neutral"
      size="sm"
      onPress={toggle}
      aria-label={`Switch to ${nextTheme} theme`}
    >
      {nextTheme === 'dark' ? 'Dark' : 'Light'} mode
    </Button>
  );
}

/**
 * The site shell: SkipLink, a sticky header (brand · primary nav · actions),
 * the main content region, and a footer. Router-agnostic — the nav-links slot
 * ships plain `NavBar.Link href` anchors; swap in your router's links via the
 * asChild recipe in the slot comment.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="tcl-root app-shell">
      <SkipLink href="#main" />

      <Box as="header" surface="raised" border="soft" px={6} py={4} className="app-shell__header">
        <Inline align="center" justify="between" gap={5} wrap>
          <Inline align="baseline" gap={3}>
            {/* @tcl-slot:brand START — app-owned: product name + optional tagline. */}
            <Text as="span" className="app-shell__brand">
              Your Product
            </Text>
            <Text size="xs" mono tone="faint">
              powered by @trembus/ui
            </Text>
            {/* @tcl-slot:brand END */}
          </Inline>

          <NavBar aria-label="Primary">
            {/* @tcl-slot:nav-links START — app-owned: primary navigation. Router apps
                wrap their link component instead of using href, e.g. react-router:
                <NavBar.Link asChild><NavLink to="/work" end>Work</NavLink></NavBar.Link>
                (the wrapped link then owns aria-current). Template updates never edit
                inside this slot. */}
            <NavBar.Link href="#/" active>
              Home
            </NavBar.Link>
            <NavBar.Link href="#/work">Work</NavBar.Link>
            <NavBar.Link href="#/about">About</NavBar.Link>
            {/* @tcl-slot:nav-links END */}
          </NavBar>

          <Inline align="center" gap={3}>
            {/* @tcl-slot:header-actions START — app-owned: header controls (search,
                account, …). ThemeToggle is exported from this file — keep, move, or
                delete it freely. */}
            <ThemeToggle />
            {/* @tcl-slot:header-actions END */}
          </Inline>
        </Inline>
      </Box>

      <Box as="main" id="main" tabIndex={-1} px={6} py={7} className="app-shell__main">
        {/* @tcl-slot:main-content START — app-owned: the page body. Router apps put
            their outlet here (e.g. <Outlet />) and drop the children prop. */}
        {children}
        {/* @tcl-slot:main-content END */}
      </Box>

      <Box as="footer" surface="sunken" border="soft" px={6} py={5}>
        {/* @tcl-slot:footer-content START — app-owned. */}
        <Text size="sm" tone="dim">
          Built on{' '}
          <Text as="span" size="sm" mono>
            @trembus/ui
          </Text>
          .
        </Text>
        {/* @tcl-slot:footer-content END */}
      </Box>
    </div>
  );
}
