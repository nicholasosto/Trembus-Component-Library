import { Badge, Box, Callout, Inline, Stack, Table, Text } from '@trembus/ui';
import { LAWS } from '../data';

export function Laws() {
  const totalGoverned = LAWS.reduce((sum, l) => sum + l.governs, 0);

  return (
    <Stack gap={6}>
      <Stack gap={2}>
        <Text size="xl" style={{ fontWeight: 680 }}>
          Law Library
        </Text>
        <Text tone="dim">
          <Text as="span" style={{ fontWeight: 600 }}>
            {LAWS.length} laws
          </Text>{' '}
          governing{' '}
          <Text as="span" style={{ fontWeight: 600 }}>
            {totalGoverned} files
          </Text>{' '}
          across 3 rooms.
        </Text>
      </Stack>

      <Box surface="raised" border="soft" radius="lg" p={2}>
        <Table density="comfortable" style={{ width: '100%' }}>
          <Table.Caption>Every routing policy in the Foundry, newest first.</Table.Caption>
          <Table.Head>
            <Table.Row>
              <Table.HeaderCell>Law</Table.HeaderCell>
              <Table.HeaderCell>Matches when</Table.HeaderCell>
              <Table.HeaderCell>Routes to</Table.HeaderCell>
              <Table.HeaderCell align="end">Governs</Table.HeaderCell>
              <Table.HeaderCell align="end">Status</Table.HeaderCell>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {LAWS.map((law) => (
              <Table.Row key={law.id}>
                <Table.Cell>
                  <Text style={{ fontWeight: 600 }}>{law.name}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text as="span" size="sm" mono tone="dim">
                    {law.match}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text as="span" size="sm" mono>
                    {law.door}
                  </Text>
                </Table.Cell>
                <Table.Cell numeric>{law.governs}</Table.Cell>
                <Table.Cell align="end">
                  {law.fresh ? (
                    <Badge tone="accent" variant="outline">
                      new
                    </Badge>
                  ) : (
                    <Badge tone="success" dot>
                      active
                    </Badge>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Box>

      <Callout tone="info" title="1 shape still parked">
        <Inline gap={2} align="center" wrap>
          <Text as="span" size="sm">
            <Text as="span" size="sm" mono>
              tabular/export
            </Text>{' '}
            has no law — drafting one from a parked row un-parks it and auto-routes the next match.
          </Text>
        </Inline>
      </Callout>
    </Stack>
  );
}
