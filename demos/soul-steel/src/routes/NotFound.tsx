import { Link } from 'react-router-dom';
import { Box, Stack, Text } from '@trembus/ui';

export function NotFound() {
  return (
    <Box surface="raised" border radius="lg" p={8}>
      <Stack gap={4} align="start">
        <Text as="h1" size="xl" weight="bold" className="page-title">
          Lost in the cathedral
        </Text>
        <Text tone="dim">That page has not been forged. (404)</Text>
        <Box as={Link} to="/" surface="sunken" border px={4} py={3} radius="md" className="card-link">
          <Text weight="medium">← Back to the title</Text>
        </Box>
      </Stack>
    </Box>
  );
}
