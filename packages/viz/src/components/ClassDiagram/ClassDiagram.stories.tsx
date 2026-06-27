import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ClassDiagram } from './ClassDiagram';
import type { ClassDiagramContract } from './ClassDiagram';

// A small domain model exercising every relationship kind.
const shop: ClassDiagramContract = {
  view: 'class',
  brand: 'Trembus',
  code: 'model.shop',
  title: 'Storefront domain model',
  caption:
    'Arrowheads encode the relationship: ▷ inheritance, ◆ composition, ◇ aggregation, → uses.',
  direction: 'BT',
  nodes: [
    {
      id: 'entity',
      name: 'Entity',
      stereotype: '«abstract»',
      tone: 'neutral',
      attributes: [{ name: 'id: string', visibility: 'protected' }],
      methods: [{ name: 'equals(o): boolean', visibility: 'public' }],
      note: 'Base type for all persisted entities.',
    },
    {
      id: 'customer',
      name: 'Customer',
      tone: 'info',
      attributes: [
        { name: 'name: string', visibility: 'public' },
        { name: 'email: string', visibility: 'private' },
      ],
      methods: [{ name: 'placeOrder(): Order', visibility: 'public' }],
    },
    {
      id: 'order',
      name: 'Order',
      tone: 'accent',
      attributes: [
        { name: 'total: Money', visibility: 'private' },
        { name: 'status: Status', visibility: 'private' },
      ],
      methods: [
        { name: 'addLine(p, qty): void', visibility: 'public' },
        { name: 'checkout(): Invoice', visibility: 'public' },
      ],
    },
    {
      id: 'line',
      name: 'OrderLine',
      tone: 'accent',
      attributes: [
        { name: 'qty: number', visibility: 'public' },
        { name: 'price: Money', visibility: 'public' },
      ],
    },
    {
      id: 'product',
      name: 'Product',
      tone: 'success',
      attributes: [
        { name: 'sku: string', visibility: 'public' },
        { name: 'price: Money', visibility: 'public' },
      ],
    },
    {
      id: 'repo',
      name: 'Repository',
      stereotype: '«interface»',
      tone: 'warning',
      methods: [
        { name: 'find(id): T', visibility: 'public' },
        { name: 'save(e): void', visibility: 'public' },
      ],
    },
    {
      id: 'orderRepo',
      name: 'OrderRepository',
      tone: 'warning',
      methods: [{ name: 'findOpen(): Order[]', visibility: 'public' }],
    },
  ],
  edges: [
    { from: 'customer', to: 'entity', kind: 'inheritance' },
    { from: 'order', to: 'entity', kind: 'inheritance' },
    { from: 'order', to: 'line', kind: 'composition', fromLabel: '1', toLabel: '*' },
    { from: 'customer', to: 'order', kind: 'aggregation', fromLabel: '1', toLabel: '*' },
    { from: 'line', to: 'product', kind: 'association', toLabel: '1' },
    { from: 'orderRepo', to: 'repo', kind: 'realization' },
    { from: 'orderRepo', to: 'order', kind: 'dependency', label: 'manages' },
  ],
};

const meta = {
  title: 'Visualizations/ClassDiagram',
  component: ClassDiagram,
  args: { data: shop },
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ width: 820, maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ClassDiagram>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — compartmented classes + every UML relationship kind. */
export const Default: Story = {};

/** Job: Afford Action — stereotypes (interface/abstract/enum) and the LR direction. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '2.5rem' }}>
      <ClassDiagram data={{ ...shop, title: 'Left → right', direction: 'LR' }} />
      <ClassDiagram
        data={{
          view: 'class',
          title: 'Stereotypes',
          nodes: [
            {
              id: 'shape',
              name: 'Shape',
              stereotype: '«interface»',
              tone: 'info',
              methods: [{ name: 'area(): number', visibility: 'public' }],
            },
            {
              id: 'status',
              name: 'Status',
              stereotype: '«enum»',
              tone: 'success',
              attributes: [{ name: 'OPEN' }, { name: 'PAID' }, { name: 'SHIPPED' }],
            },
            {
              id: 'circle',
              name: 'Circle',
              tone: 'accent',
              attributes: [{ name: 'r: number', visibility: 'private' }],
              methods: [{ name: 'area(): number', visibility: 'public' }],
            },
          ],
          edges: [{ from: 'circle', to: 'shape', kind: 'realization' }],
        }}
      />
    </div>
  ),
};

/** Job: Acknowledge Input — selecting a class reveals members + relationships. */
export const Interaction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const order = canvas.getByRole('button', { name: /^Order,/ });
    await expect(order).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(order);
    await expect(order).toHaveAttribute('aria-pressed', 'true');
    const live = canvasElement.querySelector('[aria-live="polite"]') as HTMLElement;
    // Inspector names the relationship with a UML verb + the member list.
    await expect(within(live).getByText(/extends Entity/)).toBeInTheDocument();
    await expect(within(live).getByText(/owns OrderLine/)).toBeInTheDocument();
  },
};
