import type { Meta, StoryObj } from '@storybook/react-vite';
import { NavBar } from './NavBar';

const meta = {
  title: 'Components/NavBar',
  component: NavBar,
  args: { 'aria-label': 'Primary' },
} satisfies Meta<typeof NavBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Afford Action — a bar of real navigation links; the current one is active. */
export const Default: Story = {
  render: (args) => (
    <NavBar {...args}>
      <NavBar.Link href="/" active>
        Home
      </NavBar.Link>
      <NavBar.Link href="/roster">Roster</NavBar.Link>
      <NavBar.Link href="/episodes">Episodes</NavBar.Link>
      <NavBar.Link href="/chronicle">Chronicle</NavBar.Link>
    </NavBar>
  ),
};

/** Job: Reveal State — our-set active (top) vs a wrapped router link that sets its
 *  own aria-current (bottom). Both tint identically. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <NavBar aria-label="Our-set active">
        <NavBar.Link href="/" active>
          Home
        </NavBar.Link>
        <NavBar.Link href="/two">Two</NavBar.Link>
      </NavBar>
      <NavBar aria-label="Router-set active (asChild)">
        <NavBar.Link asChild>
          <a href="/" aria-current="page">
            Home
          </a>
        </NavBar.Link>
        <NavBar.Link asChild>
          <a href="/two">Two</a>
        </NavBar.Link>
      </NavBar>
    </div>
  ),
};

/** Job: Acknowledge Input — Tab moves between links in DOM order with the focus ring. */
export const Interaction: Story = {
  render: (args) => (
    <NavBar {...args}>
      <NavBar.Link href="/">Home</NavBar.Link>
      <NavBar.Link href="/two">Two</NavBar.Link>
      <NavBar.Link href="/three">Three</NavBar.Link>
    </NavBar>
  ),
};
