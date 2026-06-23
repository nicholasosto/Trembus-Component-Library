import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button/Button';
import { Card } from './Card';

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — header/body/footer grouped on one surface. */
export const Default: Story = {
  render: () => (
    <Card style={{ maxWidth: 360 }}>
      <Card.Header>Delete project?</Card.Header>
      <Card.Body>
        This permanently removes the project and all of its data. This action cannot be undone.
      </Card.Body>
      <Card.Footer>
        <Button variant="ghost" tone="neutral">
          Cancel
        </Button>
        <Button tone="danger">Delete</Button>
      </Card.Footer>
    </Card>
  ),
};

/** Job: Afford Action — an interactive card with a hover affordance. */
export const Interactive: Story = {
  render: () => (
    <Card interactive style={{ maxWidth: 360 }}>
      <Card.Body>
        <strong>Trembus Visual Grammar</strong>
        <p style={{ margin: '4px 0 0', color: 'var(--tcl-text-dim)' }}>
          Hover me — interactive cards lift on hover.
        </p>
      </Card.Body>
    </Card>
  ),
};

/** Job: Acknowledge Input — section combinations. */
export const Sections: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16, maxWidth: 360 }}>
      <Card>
        <Card.Body>Body only.</Card.Body>
      </Card>
      <Card>
        <Card.Header>Header + body</Card.Header>
        <Card.Body>Some content.</Card.Body>
      </Card>
    </div>
  ),
};
