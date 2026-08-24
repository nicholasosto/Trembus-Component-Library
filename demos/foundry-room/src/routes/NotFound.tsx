import { Link } from 'react-router-dom';
import { Stack, Text } from '@trembus/ui';

export function NotFound() {
  return (
    <Stack gap={4}>
      <Text size="xl" style={{ fontWeight: 680 }}>
        Room not found
      </Text>
      <Text tone="dim">That door doesn&rsquo;t lead anywhere in this demo.</Text>
      <Text>
        <Link to="/" style={{ color: 'var(--tcl-accent)' }}>
          ← Back to the room
        </Link>
      </Text>
    </Stack>
  );
}
