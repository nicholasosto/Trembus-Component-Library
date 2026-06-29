import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumb } from './Breadcrumb';

const meta = {
  title: 'Components/Breadcrumb',
  component: Breadcrumb,
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

const trail = [
  { label: 'Home', href: '/' },
  { label: 'Components', href: '/components' },
  { label: 'Breadcrumb' },
];

/** Job: Afford Action — ancestor crumbs are real links; the last is the current page. */
export const Default: Story = {
  args: { items: trail },
};

/** Job: Reveal State — our-set current (top) vs a wrapped router link that sets
 *  its own aria-current (bottom). Both render identically. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <Breadcrumb items={trail} />
      <Breadcrumb aria-label="Router breadcrumb">
        <Breadcrumb.Item asChild>
          <a href="/">Home</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item asChild>
          <a href="/components">Components</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item asChild>
          <a href="/components/breadcrumb" aria-current="page">
            Breadcrumb
          </a>
        </Breadcrumb.Item>
      </Breadcrumb>
    </div>
  ),
};

/** Job: Acknowledge Input — Tab through the ancestor links; the current crumb is inert. */
export const Interaction: Story = {
  render: () => (
    <Breadcrumb>
      <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
      <Breadcrumb.Item href="/components">Components</Breadcrumb.Item>
      <Breadcrumb.Item current>Breadcrumb</Breadcrumb.Item>
    </Breadcrumb>
  ),
};
