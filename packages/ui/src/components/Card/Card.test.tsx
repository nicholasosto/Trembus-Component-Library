import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { a11yViolations } from '../../test/a11y';
import { Button } from '../Button/Button';
import { Card } from './Card';

describe('Card', () => {
  it('renders header, body, and footer content', () => {
    render(
      <Card>
        <Card.Header>Title</Card.Header>
        <Card.Body>Body text</Card.Body>
        <Card.Footer>Footer</Card.Footer>
      </Card>,
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Body text')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('applies the interactive modifier', () => {
    const { container } = render(
      <Card interactive>
        <Card.Body>x</Card.Body>
      </Card>,
    );
    expect(container.querySelector('.tcl-card')).toHaveClass('tcl-card--interactive');
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <Card>
        <Card.Header>Settings</Card.Header>
        <Card.Body>Manage your preferences.</Card.Body>
        <Card.Footer>
          <Button>Save</Button>
        </Card.Footer>
      </Card>,
    );
    expect(await a11yViolations(container)).toEqual([]);
  });
});
