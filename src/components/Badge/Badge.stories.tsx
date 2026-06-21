import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';
import type { BadgeTone } from './Badge';

const TONES: BadgeTone[] = ['accent', 'success', 'info', 'warning', 'danger', 'neutral'];

const meta = {
  title: 'Components/Badge',
  component: Badge,
  args: { children: 'Badge' },
  argTypes: {
    tone: { control: 'select', options: TONES },
    variant: { control: 'inline-radio', options: ['soft', 'solid', 'outline'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Afford Action — none; a status output with an optional dot glyph. */
export const Default: Story = { args: { tone: 'success', children: 'Shipped', dot: true } };

/** Job: Acknowledge Input — none; the label is plain text for assistive tech. */
export const Tones: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {TONES.map((t) => (
        <Badge key={t} {...args} tone={t} dot>
          {t}
        </Badge>
      ))}
    </div>
  ),
};

/** Job: Reveal State — every tone × variant of the color-coded ontology. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {(['soft', 'solid', 'outline'] as const).map((v) => (
        <div key={v} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {TONES.map((t) => (
            <Badge key={t} tone={t} variant={v}>
              {t}
            </Badge>
          ))}
        </div>
      ))}
    </div>
  ),
};
