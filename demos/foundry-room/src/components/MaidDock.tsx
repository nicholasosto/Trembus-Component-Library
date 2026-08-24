import { Box, Button, Inline, Stack, Text, Tooltip } from '@trembus/ui';

const SPARKLE = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3l1.7 4.5L18 9l-4.3 1.5L12 15l-1.7-4.5L6 9l4.3-1.5z" />
    <path d="M18.5 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
  </svg>
);

/**
 * The Maid dock — the room steward's two controls, each revealing its detail on
 * hover via the library `Tooltip`. Deep Clean drives the governed flow; Tidy is
 * the lighter pass. Pure composition of @trembus/ui primitives.
 */
export function MaidDock({ onTidy, onDeepClean }: { onTidy: () => void; onDeepClean: () => void }) {
  return (
    <Box surface="raised" border="soft" radius="lg" p={5}>
      <Stack gap={4}>
        <Inline gap={3} align="center">
          <span
            aria-hidden="true"
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 34,
              height: 34,
              borderRadius: 9,
              color: 'var(--tcl-accent)',
              background: 'color-mix(in oklab, var(--tcl-accent) 18%, var(--tcl-surface))',
              border: '1px solid color-mix(in oklab, var(--tcl-accent) 45%, transparent)',
            }}
          >
            {SPARKLE}
          </span>
          <Stack gap={0}>
            <Text style={{ fontWeight: 650 }}>The Maid</Text>
            <Text size="xs" tone="faint">
              room steward
            </Text>
          </Stack>
        </Inline>

        <div style={{ height: 1, background: 'var(--tcl-border)' }} />

        <Stack gap={3}>
          <Tooltip content="Basic organization, plus junk / dupe / archive identification.">
            <Button variant="outline" tone="info" onPress={onTidy}>
              Tidy Room
            </Button>
          </Tooltip>
          <Tooltip content="Full organization by your laws — routes each file, and surfaces shapes with no policy yet.">
            <Button variant="solid" tone="accent" onPress={onDeepClean}>
              Deep Clean
            </Button>
          </Tooltip>
        </Stack>
      </Stack>
    </Box>
  );
}
