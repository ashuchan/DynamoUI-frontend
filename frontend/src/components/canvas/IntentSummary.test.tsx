import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IntentSummary } from './IntentSummary';

describe('IntentSummary', () => {
  it('renders placeholder when intent is empty', () => {
    render(<IntentSummary intent={{}} />);
    expect(screen.getByTestId('canvas-intent-empty')).toBeInTheDocument();
  });

  it('renders chips for each populated dimension with humanised labels', () => {
    render(
      <IntentSummary
        intent={{
          domain: 'saas_b2b',
          aesthetic_mood: 'modern_saas',
          operation_profile: 'review_audit',
          density: 'compact',
          primary_entity: 'Invoice',
        }}
      />,
    );
    expect(screen.getByTestId('canvas-intent-chips')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-chip-domain')).toHaveTextContent(
      'SaaS B2B',
    );
    expect(screen.getByTestId('canvas-chip-theme')).toHaveTextContent(
      'Modern SaaS',
    );
    expect(screen.getByTestId('canvas-chip-mode')).toHaveTextContent(
      'Review / Audit',
    );
    expect(screen.getByTestId('canvas-chip-density')).toHaveTextContent(
      'Compact',
    );
    expect(screen.getByTestId('canvas-chip-primary')).toHaveTextContent(
      'Invoice',
    );
  });

  it('omits chips for unfilled dimensions', () => {
    render(<IntentSummary intent={{ domain: 'fintech' }} />);
    expect(screen.getByTestId('canvas-chip-domain')).toBeInTheDocument();
    expect(screen.queryByTestId('canvas-chip-theme')).toBeNull();
    expect(screen.queryByTestId('canvas-chip-mode')).toBeNull();
  });
});
