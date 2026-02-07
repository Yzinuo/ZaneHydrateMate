import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GlassCard } from './GlassCard';

describe('GlassCard', () => {
  it('renders children correctly', () => {
    render(
      <GlassCard>
        <div data-testid="child">Hello World</div>
      </GlassCard>
    );
    
    expect(screen.getByTestId('child')).toHaveTextContent('Hello World');
  });

  it('applies custom className', () => {
    const { container } = render(
      <GlassCard className="custom-class">
        <div>Content</div>
      </GlassCard>
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(
      <GlassCard onClick={handleClick}>
        <div>Clickable</div>
      </GlassCard>
    );
    
    screen.getByText('Clickable').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
