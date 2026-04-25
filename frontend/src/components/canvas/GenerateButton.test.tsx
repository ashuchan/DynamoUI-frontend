import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GenerateButton } from './GenerateButton';
import { canvasClient } from '../../lib/canvasClient';

function renderWithClient(ui: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.spyOn(canvasClient, 'generate');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GenerateButton', () => {
  it('is disabled while session state is incomplete', () => {
    renderWithClient(
      <GenerateButton sessionId="sid" disabled artifactsUrl={null} />,
    );
    const btn = screen.getByTestId('canvas-generate-button');
    expect(btn).toBeDisabled();
  });

  it('is disabled when no session is active even if `disabled` is false', () => {
    renderWithClient(
      <GenerateButton sessionId={null} disabled={false} artifactsUrl={null} />,
    );
    expect(screen.getByTestId('canvas-generate-button')).toBeDisabled();
  });

  it('triggers generate() and swaps to a download link on success', async () => {
    (canvasClient.generate as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      status: 'ok',
      files: ['theme.css'],
      artifacts_url: '/api/v1/canvas/session/sid/artifacts',
    });

    renderWithClient(
      <GenerateButton
        sessionId="sid"
        disabled={false}
        artifactsUrl="/api/v1/canvas/session/sid/artifacts"
      />,
    );

    fireEvent.click(screen.getByTestId('canvas-generate-button'));

    await waitFor(() => {
      expect(screen.getByTestId('canvas-download-link')).toBeInTheDocument();
    });
    const link = screen.getByTestId('canvas-download-link') as HTMLAnchorElement;
    expect(link.getAttribute('download')).toBe('canvas-output.zip');
    expect(link.href).toContain('/session/sid/artifacts');
  });
});
