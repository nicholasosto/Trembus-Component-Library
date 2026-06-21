import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { a11yViolations } from '../../test/a11y';
import { Brief } from './Brief';
import type { BriefContract } from './Brief';

const doc: BriefContract = {
  view: 'brief',
  kind: 'claude',
  id: 'claude.test',
  title: 'Test guide',
  summary: 'A tiny brief.',
  sections: [
    { heading: 'Commands', kind: 'commands', items: [{ text: 'pnpm dev', desc: 'storybook' }] },
    { heading: 'Conventions', kind: 'rules', items: ['Tokens only.', 'import type.'] },
  ],
};

describe('Brief', () => {
  it('reveals the title and section content', () => {
    render(<Brief data={doc} />);
    expect(screen.getByRole('heading', { name: 'Test guide' })).toBeInTheDocument();
    expect(screen.getByText('pnpm dev')).toBeInTheDocument();
  });

  it('coerces bare-string items to text', () => {
    render(<Brief data={doc} />);
    // 'Tokens only.' was authored as a plain string, not { text }.
    expect(screen.getByText('Tokens only.')).toBeInTheDocument();
  });

  it('toggles a section via its disclosure button', () => {
    render(<Brief data={doc} />);
    const toggle = screen.getByRole('button', { name: 'Commands' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('degrades an unknown kind to prose (lenient render)', () => {
    render(
      <Brief
        data={{ sections: [{ heading: 'Mystery', kind: 'wat' as never, items: ['still shows'] }] }}
      />,
    );
    expect(screen.getByText('still shows')).toBeInTheDocument();
  });

  it('renders with only the minimum (no sections)', () => {
    render(<Brief data={{ title: 'Bare' }} />);
    expect(screen.getByText('No sections.')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Brief data={doc} />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
