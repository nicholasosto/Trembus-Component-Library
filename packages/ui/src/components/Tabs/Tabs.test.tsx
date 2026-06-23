import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '../../test/a11y';
import { Tabs } from './Tabs';

function Example() {
  return (
    <Tabs defaultValue="a">
      <Tabs.List aria-label="Sections">
        <Tabs.Tab value="a">Alpha</Tabs.Tab>
        <Tabs.Tab value="b">Beta</Tabs.Tab>
        <Tabs.Tab value="c">Gamma</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="a">Panel A</Tabs.Panel>
      <Tabs.Panel value="b">Panel B</Tabs.Panel>
      <Tabs.Panel value="c">Panel C</Tabs.Panel>
    </Tabs>
  );
}

describe('Tabs', () => {
  it('shows the default tab and its panel only', () => {
    render(<Example />);
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Panel A')).toBeVisible();
    expect(screen.queryByText('Panel B')).not.toBeInTheDocument();
  });

  it('switches the panel on click', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole('tab', { name: 'Beta' }));
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Panel B')).toBeVisible();
  });

  it('navigates with roving tabindex (Arrow / Home)', async () => {
    const user = userEvent.setup();
    render(<Example />);
    const alpha = screen.getByRole('tab', { name: 'Alpha' });
    alpha.focus();
    await user.keyboard('{ArrowRight}');
    const beta = screen.getByRole('tab', { name: 'Beta' });
    expect(beta).toHaveFocus();
    expect(beta).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Home}');
    expect(alpha).toHaveFocus();
    expect(alpha).toHaveAttribute('aria-selected', 'true');
  });

  it('has no axe violations', async () => {
    const { container } = render(<Example />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
