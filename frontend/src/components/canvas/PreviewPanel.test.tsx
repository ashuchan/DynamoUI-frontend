import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PreviewPanel, extractPrimaryColor } from './PreviewPanel';
import {
  DASHBOARD_PREVIEW,
  SAMPLE_THEME_CSS,
  withArchetype,
} from '../../test/canvasFixtures';

describe('extractPrimaryColor', () => {
  it('parses --dui-primary out of the CSS string', () => {
    expect(extractPrimaryColor(SAMPLE_THEME_CSS)).toBe('#2563eb');
  });

  it('falls back to the indigo default when token is missing', () => {
    expect(extractPrimaryColor('/* nothing */')).toBe('#818cf8');
  });
});

describe('PreviewPanel', () => {
  it('renders the empty state when no preview is provided', () => {
    render(<PreviewPanel preview={null} />);
    expect(screen.getByTestId('canvas-preview-empty')).toBeInTheDocument();
  });

  it('renders the dashboard archetype with metric cards + table', () => {
    render(<PreviewPanel preview={DASHBOARD_PREVIEW} />);
    expect(screen.getByTestId('canvas-preview-panel')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-archetype-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-preview-table')).toBeInTheDocument();
  });

  it('renders kanban columns from the status field', () => {
    render(<PreviewPanel preview={withArchetype('kanban')} />);
    const kanban = screen.getByTestId('canvas-archetype-kanban');
    expect(kanban).toBeInTheDocument();
    expect(kanban.textContent).toContain('pending');
    expect(kanban.textContent).toContain('shipped');
  });

  it('renders timeline archetype', () => {
    render(<PreviewPanel preview={withArchetype('timeline')} />);
    expect(screen.getByTestId('canvas-archetype-timeline')).toBeInTheDocument();
  });

  it('renders data_entry split pane archetype', () => {
    render(<PreviewPanel preview={withArchetype('data_entry')} />);
    expect(
      screen.getByTestId('canvas-archetype-data_entry'),
    ).toBeInTheDocument();
  });

  it('renders review_audit archetype', () => {
    render(<PreviewPanel preview={withArchetype('review_audit')} />);
    expect(
      screen.getByTestId('canvas-archetype-review_audit'),
    ).toBeInTheDocument();
  });

  it('does not leak :root into the document style', () => {
    const { container } = render(<PreviewPanel preview={DASHBOARD_PREVIEW} />);
    const style = container.querySelector('style');
    expect(style?.textContent ?? '').not.toContain(':root');
  });
});
