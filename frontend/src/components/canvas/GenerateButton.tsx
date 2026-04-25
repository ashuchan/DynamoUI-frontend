import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Download, Loader2 } from 'lucide-react';
import { canvasClient } from '../../lib/canvasClient';
import { canvasQueryKeys } from '../../hooks/canvas/useCanvasSession';
import type { GenerateResponse } from '../../types/canvas';

interface Props {
  sessionId: string | null;
  disabled: boolean;
  artifactsUrl: string | null;
}

export function GenerateButton({ sessionId, disabled, artifactsUrl }: Props) {
  const [generated, setGenerated] = useState(false);
  const queryClient = useQueryClient();

  const generate = useMutation<GenerateResponse, Error, void>({
    mutationFn: () => {
      if (!sessionId) {
        return Promise.reject(new Error('No active Canvas session'));
      }
      return canvasClient.generate(sessionId);
    },
    onSuccess: () => {
      setGenerated(true);
      // Server flips state → COMPLETE; refresh session so intent polling stops.
      queryClient.invalidateQueries({
        queryKey: canvasQueryKeys.session(sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: canvasQueryKeys.intent(sessionId),
      });
    },
  });

  if (generated && artifactsUrl) {
    return (
      <a
        href={artifactsUrl}
        download="canvas-output.zip"
        data-testid="canvas-download-link"
        className="flex items-center gap-2 rounded-md bg-dui-success px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
      >
        <Download size={14} />
        Download Output
      </a>
    );
  }

  const isPending = generate.isPending;

  return (
    <button
      type="button"
      onClick={() => generate.mutate()}
      disabled={disabled || isPending || !sessionId}
      data-testid="canvas-generate-button"
      className="flex items-center gap-2 rounded-md bg-dui-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {isPending ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          Generating…
        </>
      ) : (
        <>
          <CheckCircle size={14} />
          Generate
        </>
      )}
    </button>
  );
}
