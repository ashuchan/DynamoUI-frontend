import { ScopedThemeProvider } from './ScopedThemeProvider';
import { ArchetypePreview } from './ArchetypePreview';
import type { ConversationState, PreviewData } from '../../types/canvas';

interface Props {
  preview: PreviewData | null;
  sessionState?: ConversationState;
}

export function PreviewPanel({ preview, sessionState }: Props) {
  if (!preview) {
    return (
      <div
        className="flex items-center justify-center h-full"
        data-testid="canvas-preview-empty"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-lg bg-dui-surface-tertiary mx-auto" />
          <p className="text-sm text-dui-text-muted">
            Preview will appear as Canvas learns about your deployment
          </p>
        </div>
      </div>
    );
  }

  const primary = extractPrimaryColor(preview.theme_css);
  const isComplete = sessionState === 'complete';

  return (
    <div
      className="space-y-3"
      data-testid="canvas-preview-panel"
      data-session-state={sessionState ?? 'eliciting'}
    >
      <div className="flex items-center gap-3">
        <div
          aria-hidden
          className="w-3 h-3 rounded-full border border-dui-border"
          style={{ background: primary }}
        />
        <span className="text-xs text-dui-text-muted">
          Theme:{' '}
          <strong className="text-dui-text-primary">{preview.entity}</strong>
          {' · '}
          Archetype:{' '}
          <strong className="text-dui-text-primary">{preview.archetype}</strong>
          {' · '}
          Nav:{' '}
          <strong className="text-dui-text-primary">{preview.nav_style}</strong>
          {isComplete && (
            <>
              {' · '}
              <strong className="text-dui-success">Finalised</strong>
            </>
          )}
        </span>
      </div>

      <div
        className="rounded-lg border border-dui-border overflow-hidden"
        aria-busy={!isComplete && sessionState !== undefined}
      >
        <ScopedThemeProvider themeCSS={preview.theme_css}>
          <ArchetypePreview preview={preview} />
        </ScopedThemeProvider>
      </div>
    </div>
  );
}

export function extractPrimaryColor(css: string): string {
  const match = css.match(/--dui-primary:\s*([^;]+);/);
  return match?.[1]?.trim() ?? '#818cf8';
}
