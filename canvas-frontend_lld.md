# DynamoUI Canvas — Frontend Implementation Guide
# `dynamoui-frontend` repo

*Implementation instructions for Claude Code · Canvas Feature Track · v1.0*

---

## 0. Context and Orientation

This document is the complete implementation guide for the **Canvas feature** in the
`dynamoui-frontend` repository. Read it fully before beginning any task.

Canvas is a split-pane conversational UI that lets operators configure their DynamoUI
deployment through a chat interface — generating themes, layout configs, and enriched
skill hints. The backend contract is defined in **LLD 9 (Canvas)** in the main repo.

### What already exists in this repo (do not recreate)

| Existing artifact | Location | Canvas relationship |
|---|---|---|
| `apiClient` | `src/lib/apiClient.ts` | **Extend** with Canvas endpoints — never fork |
| `DataTable` | `src/components/data-display/DataTable/` | **Reuse** in Preview panel — zero changes |
| `DetailCard` | `src/components/data-display/DetailCard/` | **Reuse** in Preview panel — zero changes |
| `NLInputBar` | `src/components/NLInputBar.tsx` | **Reuse** as chat input — zero changes |
| `--dui-*` CSS tokens | `src/themes/theme-default.css` | Canvas generates **additional** theme files |
| `tailwind.config.ts` | root | **Do not modify** — Canvas uses existing dui classes |
| React Query setup | `src/lib/queryClient.ts` | **Reuse** — Canvas hooks follow existing patterns |
| Route definitions | `src/router.tsx` | **Add** `/canvas` route only |

### What is new (Canvas only)

```
src/
├── pages/
│   └── Canvas.tsx                          ← new
├── components/
│   └── canvas/
│       ├── ChatPanel.tsx                   ← new
│       ├── MessageBubble.tsx               ← new
│       ├── IntentSummary.tsx               ← new
│       ├── PreviewPanel.tsx                ← new
│       ├── ScopedThemeProvider.tsx         ← new  (critical — see §4)
│       ├── ArchetypePreview.tsx            ← new
│       └── GenerateButton.tsx              ← new
├── lib/
│   └── canvasClient.ts                     ← new (extends apiClient pattern)
├── hooks/
│   └── canvas/
│       ├── useCanvasSession.ts             ← new
│       ├── useCanvasIntent.ts              ← new
│       └── useCanvasPreview.ts             ← new
└── types/
    └── canvas.ts                           ← new
```

---

## 1. Repo Setup — Before Any Code

### 1.1 Read these files first (every Claude Code session)

```bash
# Run at the start of every Claude Code session before touching Canvas files
cat CLAUDE.md
cat src/lib/apiClient.ts          # understand existing fetch pattern
cat src/themes/theme-default.css  # understand --dui-* token names exactly
cat tailwind.config.ts            # understand dui.* Tailwind class names
cat src/router.tsx                # understand existing route structure
cat src/lib/queryClient.ts        # understand React Query setup
```

### 1.2 Environment variables (add to `.env.example`)

```bash
# Canvas API base — same origin as existing API in dev
VITE_CANVAS_API_BASE=/api/v1/canvas

# Poll interval for intent updates during active session (ms)
VITE_CANVAS_INTENT_POLL_MS=2000
```

### 1.3 No new dependencies required

Canvas uses only what is already in `package.json`:
- React 18, TypeScript — already present
- TanStack Query — already present (React Query)
- Tailwind CSS — already present
- Lucide React — already present (use for chat/canvas icons)

Do **not** add: any new UI library, any CSS-in-JS package, any state management library.

---

## 2. Type Definitions

**File:** `src/types/canvas.ts`

Define all Canvas wire types here. These mirror the Pydantic models in `canvas/models.py`
on the backend (LLD 9, §5). Keep them in sync — if the backend changes a field, this
file changes too.

```typescript
// Mirrors canvas/models.py — Domain enum
export type Domain =
  | 'fintech' | 'logistics' | 'hr' | 'saas_b2b'
  | 'healthcare' | 'ecommerce' | 'legal'
  | 'education' | 'manufacturing' | 'generic';

// Mirrors AestheticMood enum
export type AestheticMood =
  | 'enterprise' | 'functional' | 'modern_saas'
  | 'friendly' | 'clinical' | 'bold_consumer';

// Mirrors OperationProfile enum
export type OperationProfile =
  | 'read_heavy' | 'write_heavy' | 'review_audit' | 'mixed';

// Mirrors DensityPreference enum
export type DensityPreference = 'compact' | 'standard' | 'comfortable';

// Mirrors LayoutArchetype enum
export type LayoutArchetype =
  | 'dashboard' | 'data_entry' | 'review_audit' | 'kanban' | 'timeline';

// Mirrors ConversationState enum
export type ConversationState = 'eliciting' | 'confirming' | 'complete';

// Mirrors CanvasIntent Pydantic model — all fields optional until conversation complete
export interface CanvasIntent {
  session_id: string;
  domain?: Domain;
  aesthetic_mood?: AestheticMood;
  operation_profile?: OperationProfile;
  density?: DensityPreference;
  primary_entity?: string;
  entity_priorities?: string[];
  key_status_fields?: string[];
  key_monetary_fields?: string[];
  key_datetime_fields?: string[];
  enable_kanban?: boolean;
  enable_timeline?: boolean;
  custom_theme_name?: string;
  operator_notes?: string;
}

// Chat message — stored in session
export interface CanvasMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Full session state from GET /session/{id}
export interface CanvasSession {
  session_id: string;
  state: ConversationState;
  messages: CanvasMessage[];
  partial_intent: Partial<CanvasIntent>;
}

// POST /session/message response
export interface MessageResponse {
  reply: string;
  intent_update: Partial<CanvasIntent> | null;
  session_state: ConversationState;
}

// GET /preview response — synthetic rows for live preview
export interface PreviewData {
  entity: string;
  fields: PreviewField[];
  rows: Record<string, unknown>[];
  archetype: LayoutArchetype;
  theme_css: string;       // full CSS string for the generated theme
  nav_style: 'sidebar' | 'top_nav';
  metric_fields: string[];
}

export interface PreviewField {
  name: string;
  label: string;
  display_hint: string;
  column_priority: 'high' | 'medium' | 'low';
  is_status: boolean;
  is_monetary: boolean;
}

// POST /generate response
export interface GenerateResponse {
  status: 'ok';
  files: string[];
  artifacts_url: string;
}
```

---

## 3. Canvas API Client

**File:** `src/lib/canvasClient.ts`

Follows the **exact same pattern** as `src/lib/apiClient.ts`. Uses the same `apiFetch`
internal function. Do not duplicate the fetch wrapper — import and reuse it.

```typescript
// src/lib/canvasClient.ts
import { apiFetch } from './apiClient';   // import the internal helper
import type {
  CanvasSession, CanvasIntent, MessageResponse,
  PreviewData, GenerateResponse
} from '../types/canvas';

const CANVAS_BASE = import.meta.env.VITE_CANVAS_API_BASE ?? '/api/v1/canvas';

// Helper scoped to canvas base
function canvasFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return apiFetch<T>(`${CANVAS_BASE}${path}`, init);
}

export const canvasClient = {
  // Create a new Canvas session (optionally pre-loading skill YAML context)
  createSession: () =>
    canvasFetch<{ session_id: string }>('/session', { method: 'POST' }),

  // Send a chat turn
  sendMessage: (sessionId: string, message: string) =>
    canvasFetch<MessageResponse>(`/session/${sessionId}/message`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  // Get current session state + messages
  getSession: (sessionId: string) =>
    canvasFetch<CanvasSession>(`/session/${sessionId}`),

  // Get current CanvasIntent (polled during elicitation)
  getIntent: (sessionId: string) =>
    canvasFetch<{ intent: Partial<CanvasIntent>; state: string }>(
      `/session/${sessionId}/intent`
    ),

  // Get synthetic preview data from current intent
  getPreview: (sessionId: string) =>
    canvasFetch<PreviewData>(`/session/${sessionId}/preview`),

  // Trigger generation pipeline from finalised intent
  generate: (sessionId: string) =>
    canvasFetch<GenerateResponse>(`/session/${sessionId}/generate`, {
      method: 'POST',
    }),

  // Download artifacts zip — returns a blob URL
  getArtifactsUrl: (sessionId: string) =>
    `${CANVAS_BASE}/session/${sessionId}/artifacts`,
};
```

**Constraint:** `apiFetch` must be exported from `apiClient.ts` if it is not already.
Check first — if it's a module-private function, export it with a named export. Do not
copy its implementation.

---

## 4. Scoped Theme Provider (Critical Component)

**File:** `src/components/canvas/ScopedThemeProvider.tsx`

This is the most architecturally sensitive component. It applies a generated theme CSS
string **only** to its children — never to `:root`, which would contaminate the whole
app. Use a generated unique class name + a `<style>` tag scoped to that class.

```typescript
// src/components/canvas/ScopedThemeProvider.tsx
import { useId, useMemo } from 'react';

interface Props {
  themeCSS: string;       // Full CSS string from PreviewData.theme_css
  children: React.ReactNode;
}

export function ScopedThemeProvider({ themeCSS, children }: Props) {
  // useId produces a stable unique id per component instance
  const uid = useId().replace(/:/g, '-');
  const scopeClass = `dui-canvas-preview-${uid}`;

  // Scope all :root declarations to .{scopeClass} by rewriting the CSS
  const scopedCSS = useMemo(() => {
    return themeCSS
      .replace(/:root\s*\{/g, `.${scopeClass} {`)
      .replace(/@media\s*\(prefers-color-scheme:\s*dark\)\s*\{\s*:root\s*\{/g,
        `@media (prefers-color-scheme: dark) { .${scopeClass} {`);
  }, [themeCSS, scopeClass]);

  return (
    <>
      <style>{scopedCSS}</style>
      <div className={scopeClass}>{children}</div>
    </>
  );
}
```

**Rules for this component:**
- Never use `dangerouslySetInnerHTML` on the style tag — React handles `<style>` children as text correctly.
- The CSS rewrite must handle both the `:root {}` block and the `@media (dark) { :root {} }` block.
- Test that changing `themeCSS` prop produces a new scoped style without leaking to the rest of the app.
- This component is **only** used inside `PreviewPanel`. Never use it elsewhere.

---

## 5. React Query Hooks

**File:** `src/hooks/canvas/useCanvasSession.ts`

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { canvasClient } from '../../lib/canvasClient';

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: canvasClient.createSession,
    onSuccess: (data) => {
      // Pre-populate the session cache
      queryClient.setQueryData(['canvas-session', data.session_id], null);
    },
  });
}

export function useSession(sessionId: string | null) {
  return useQuery({
    queryKey: ['canvas-session', sessionId],
    queryFn: () => canvasClient.getSession(sessionId!),
    enabled: !!sessionId,
    staleTime: 0,  // always fresh — messages change often
  });
}

export function useSendMessage(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => canvasClient.sendMessage(sessionId, message),
    onSuccess: () => {
      // Invalidate session and intent after each message
      queryClient.invalidateQueries({ queryKey: ['canvas-session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['canvas-intent', sessionId] });
    },
  });
}
```

**File:** `src/hooks/canvas/useCanvasIntent.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { canvasClient } from '../../lib/canvasClient';

const POLL_INTERVAL = Number(import.meta.env.VITE_CANVAS_INTENT_POLL_MS ?? 2000);

export function useCanvasIntent(sessionId: string | null, sessionState: string) {
  return useQuery({
    queryKey: ['canvas-intent', sessionId],
    queryFn: () => canvasClient.getIntent(sessionId!),
    enabled: !!sessionId,
    // Only poll while conversation is active — stop when complete
    refetchInterval: sessionState === 'complete' ? false : POLL_INTERVAL,
    staleTime: POLL_INTERVAL - 100,
  });
}
```

**File:** `src/hooks/canvas/useCanvasPreview.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { canvasClient } from '../../lib/canvasClient';

export function useCanvasPreview(sessionId: string | null, intentVersion: number) {
  return useQuery({
    queryKey: ['canvas-preview', sessionId, intentVersion],
    queryFn: () => canvasClient.getPreview(sessionId!),
    enabled: !!sessionId,
    staleTime: 10_000,  // preview is stable until intent changes
  });
}
```

`intentVersion` is a counter incremented by the parent whenever `partial_intent`
changes (detected via deep-equal comparison in the parent). This triggers a new
preview fetch only when the intent meaningfully changes, not on every poll tick.

---

## 6. Canvas Page Layout

**File:** `src/pages/Canvas.tsx`

The root page component. Manages session lifecycle and wires child components.

```typescript
// src/pages/Canvas.tsx
import { useState, useEffect, useRef } from 'react';
import { ChatPanel } from '../components/canvas/ChatPanel';
import { PreviewPanel } from '../components/canvas/PreviewPanel';
import { IntentSummary } from '../components/canvas/IntentSummary';
import { GenerateButton } from '../components/canvas/GenerateButton';
import { useCreateSession, useSession } from '../hooks/canvas/useCanvasSession';
import { useCanvasIntent } from '../hooks/canvas/useCanvasIntent';
import { useCanvasPreview } from '../hooks/canvas/useCanvasPreview';

export function CanvasPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [intentVersion, setIntentVersion] = useState(0);
  const prevIntentRef = useRef<string>('');

  const createSession = useCreateSession();
  const { data: session } = useSession(sessionId);
  const { data: intentData } = useCanvasIntent(sessionId, session?.state ?? 'eliciting');
  const { data: preview } = useCanvasPreview(sessionId, intentVersion);

  // Start session on mount
  useEffect(() => {
    createSession.mutate(undefined, {
      onSuccess: (data) => setSessionId(data.session_id),
    });
  }, []);

  // Detect intent changes to trigger preview refresh
  useEffect(() => {
    const serialised = JSON.stringify(intentData?.intent ?? {});
    if (serialised !== prevIntentRef.current) {
      prevIntentRef.current = serialised;
      setIntentVersion((v) => v + 1);
    }
  }, [intentData?.intent]);

  const isComplete = session?.state === 'complete';

  return (
    <div className="flex flex-col h-screen bg-dui-surface">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-dui-border">
        <div>
          <h1 className="text-lg font-semibold text-dui-text">DynamoUI Canvas</h1>
          <p className="text-sm text-dui-text-secondary">
            Describe your deployment and Canvas will configure it for you
          </p>
        </div>
        <GenerateButton
          sessionId={sessionId}
          disabled={!isComplete}
          artifactsUrl={isComplete ? canvasClient.getArtifactsUrl(sessionId!) : null}
        />
      </header>

      {/* Main split pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Chat */}
        <div className="flex flex-col w-[420px] min-w-[320px] border-r border-dui-border">
          <ChatPanel
            sessionId={sessionId}
            messages={session?.messages ?? []}
            sessionState={session?.state ?? 'eliciting'}
          />
        </div>

        {/* Right: Preview + Intent Summary */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Intent summary bar */}
          <div className="border-b border-dui-border px-4 py-2">
            <IntentSummary intent={intentData?.intent ?? {}} />
          </div>
          {/* Live preview */}
          <div className="flex-1 overflow-auto p-4 bg-dui-surface-secondary">
            <PreviewPanel preview={preview ?? null} sessionState={session?.state} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Layout rules:**
- Chat panel is fixed width `420px`, min `320px`. Not resizable in v1.
- Preview panel takes remaining width.
- The full page is `h-screen` — no external scroll. Internal panels scroll independently.
- All colour classes use `dui-*` Tailwind tokens — zero hardcoded colours.

---

## 7. Chat Panel

**File:** `src/components/canvas/ChatPanel.tsx`

Renders the conversation. Reuses `NLInputBar` for input. Scrolls to the latest message
automatically on new message arrival.

```typescript
// src/components/canvas/ChatPanel.tsx
import { useRef, useEffect } from 'react';
import { useSendMessage } from '../../hooks/canvas/useCanvasSession';
import { MessageBubble } from './MessageBubble';
import { NLInputBar } from '../NLInputBar';   // ← reuse existing component
import type { CanvasMessage, ConversationState } from '../../types/canvas';

interface Props {
  sessionId: string | null;
  messages: CanvasMessage[];
  sessionState: ConversationState;
}

export function ChatPanel({ sessionId, messages, sessionState }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const sendMessage = useSendMessage(sessionId ?? '');

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  function handleSubmit(text: string) {
    if (!sessionId || !text.trim() || sessionState === 'complete') return;
    sendMessage.mutate(text.trim());
  }

  return (
    <div className="flex flex-col h-full">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-dui-text-muted text-center mt-8">
            Canvas is ready. Describe the tool you're building.
          </p>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {sendMessage.isPending && (
          <MessageBubble
            message={{ role: 'assistant', content: '…', timestamp: '' }}
            isLoading
          />
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input — reuse NLInputBar */}
      <div className="border-t border-dui-border p-3">
        <NLInputBar
          onSubmit={handleSubmit}
          disabled={!sessionId || sessionState === 'complete' || sendMessage.isPending}
          placeholder={
            sessionState === 'complete'
              ? 'Configuration complete — click Generate to download'
              : 'Describe your deployment...'
          }
        />
      </div>
    </div>
  );
}
```

**File:** `src/components/canvas/MessageBubble.tsx`

```typescript
import type { CanvasMessage } from '../../types/canvas';

interface Props {
  message: CanvasMessage;
  isLoading?: boolean;
}

export function MessageBubble({ message, isLoading }: Props) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={[
          'max-w-[85%] rounded-dui-lg px-3 py-2 text-sm',
          isUser
            ? 'bg-dui-primary text-dui-primary-foreground'
            : 'bg-dui-surface-secondary text-dui-text border border-dui-border',
          isLoading ? 'animate-pulse' : '',
        ].join(' ')}
      >
        {message.content}
      </div>
    </div>
  );
}
```

**NLInputBar reuse constraint:** Check how `NLInputBar` is currently called in the
main app — match the exact prop interface. If `NLInputBar` expects an `entity` prop,
pass `null` or a sensible default; do not modify `NLInputBar` itself.

---

## 8. Intent Summary Panel

**File:** `src/components/canvas/IntentSummary.tsx`

A compact single-row display of what Canvas has understood so far. Updates in real
time as the conversation progresses.

```typescript
// src/components/canvas/IntentSummary.tsx
import type { CanvasIntent } from '../../types/canvas';

const MOOD_LABELS: Record<string, string> = {
  enterprise: 'Enterprise',
  functional: 'Functional',
  modern_saas: 'Modern SaaS',
  friendly: 'Friendly',
  clinical: 'Clinical',
  bold_consumer: 'Bold Consumer',
};

const PROFILE_LABELS: Record<string, string> = {
  read_heavy: 'Read-heavy',
  write_heavy: 'Write-heavy',
  review_audit: 'Review / Audit',
  mixed: 'Mixed',
};

interface Props {
  intent: Partial<CanvasIntent>;
}

export function IntentSummary({ intent }: Props) {
  const chips = [
    intent.domain && { label: 'Domain', value: intent.domain.replace('_', ' ') },
    intent.aesthetic_mood && { label: 'Theme', value: MOOD_LABELS[intent.aesthetic_mood] },
    intent.operation_profile && { label: 'Mode', value: PROFILE_LABELS[intent.operation_profile] },
    intent.density && { label: 'Density', value: intent.density },
    intent.primary_entity && { label: 'Primary', value: intent.primary_entity },
  ].filter(Boolean) as { label: string; value: string }[];

  if (chips.length === 0) {
    return (
      <p className="text-xs text-dui-text-muted">
        Intent will appear here as the conversation progresses
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map(({ label, value }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1 rounded-dui-full bg-dui-surface-tertiary
                     px-2 py-0.5 text-xs text-dui-text"
        >
          <span className="text-dui-text-muted">{label}:</span>
          <span className="font-medium">{value}</span>
        </span>
      ))}
    </div>
  );
}
```

---

## 9. Preview Panel

**File:** `src/components/canvas/PreviewPanel.tsx`

The most complex component. Renders a live preview of the generated theme and layout
using the existing `DataTable` and `DetailCard` components wrapped in
`ScopedThemeProvider`. Uses synthetic data from `PreviewData.rows`.

```typescript
// src/components/canvas/PreviewPanel.tsx
import { ScopedThemeProvider } from './ScopedThemeProvider';
import { ArchetypePreview } from './ArchetypePreview';
import type { PreviewData, ConversationState } from '../../types/canvas';

interface Props {
  preview: PreviewData | null;
  sessionState?: ConversationState;
}

export function PreviewPanel({ preview, sessionState }: Props) {
  if (!preview) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-dui-lg bg-dui-surface-tertiary mx-auto" />
          <p className="text-sm text-dui-text-muted">
            Preview will appear as Canvas learns about your deployment
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Theme + archetype label */}
      <div className="flex items-center gap-3">
        <div
          className="w-3 h-3 rounded-full border border-dui-border"
          style={{ background: extractPrimaryColor(preview.theme_css) }}
        />
        <span className="text-xs text-dui-text-muted">
          Theme: <strong className="text-dui-text">{preview.entity}</strong>
          {' · '}
          Archetype: <strong className="text-dui-text">{preview.archetype}</strong>
        </span>
      </div>

      {/* Live preview — scoped to generated theme */}
      <div className="rounded-dui-lg border border-dui-border overflow-hidden">
        <ScopedThemeProvider themeCSS={preview.theme_css}>
          <ArchetypePreview preview={preview} />
        </ScopedThemeProvider>
      </div>
    </div>
  );
}

// Extract --dui-primary value from CSS string for the colour dot
function extractPrimaryColor(css: string): string {
  const match = css.match(/--dui-primary:\s*([^;]+);/);
  return match?.[1]?.trim() ?? '#2563eb';
}
```

**File:** `src/components/canvas/ArchetypePreview.tsx`

Renders the appropriate layout skeleton based on `preview.archetype`. Uses the real
`DataTable` for table-based archetypes with synthetic data.

```typescript
// src/components/canvas/ArchetypePreview.tsx
import { DataTable } from '../data-display/DataTable/DataTable';
import type { PreviewData } from '../../types/canvas';

interface Props {
  preview: PreviewData;
}

export function ArchetypePreview({ preview }: Props) {
  // Build DisplayConfig + FieldMeta from PreviewField[] for DataTable
  const displayConfig = buildDisplayConfig(preview);
  const fieldMeta = buildFieldMeta(preview);

  switch (preview.archetype) {
    case 'dashboard':
      return <DashboardArchetype preview={preview} displayConfig={displayConfig} fieldMeta={fieldMeta} />;
    case 'data_entry':
      return <DataEntryArchetype preview={preview} displayConfig={displayConfig} fieldMeta={fieldMeta} />;
    case 'review_audit':
      return <ReviewAuditArchetype preview={preview} displayConfig={displayConfig} fieldMeta={fieldMeta} />;
    case 'kanban':
      return <KanbanArchetype preview={preview} />;
    case 'timeline':
      return <TimelineArchetype preview={preview} />;
    default:
      return <DashboardArchetype preview={preview} displayConfig={displayConfig} fieldMeta={fieldMeta} />;
  }
}

// Dashboard: metric cards row + DataTable
function DashboardArchetype({ preview, displayConfig, fieldMeta }) {
  return (
    <div className="bg-dui-surface p-4 space-y-4">
      {/* Metric cards */}
      {preview.metric_fields.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {preview.metric_fields.slice(0, 4).map((field) => (
            <MetricCard key={field} field={field} rows={preview.rows} />
          ))}
        </div>
      )}
      {/* DataTable — reuse existing component with synthetic data */}
      <DataTable
        result={{ entity: preview.entity, rows: preview.rows, total_count: preview.rows.length, fields: preview.fields.map(f => f.name), query_time_ms: 0 }}
        displayConfig={displayConfig}
        fieldMeta={fieldMeta}
        onRowClick={() => {}}
        onFKClick={() => {}}
        mutationDefs={[]}
      />
    </div>
  );
}

// Data entry: split pane skeleton (list + empty form placeholder)
function DataEntryArchetype({ preview, displayConfig, fieldMeta }) {
  return (
    <div className="flex bg-dui-surface" style={{ height: 360 }}>
      <div className="w-1/2 border-r border-dui-border overflow-auto">
        <DataTable
          result={{ entity: preview.entity, rows: preview.rows.slice(0, 5), total_count: preview.rows.length, fields: preview.fields.map(f => f.name), query_time_ms: 0 }}
          displayConfig={displayConfig}
          fieldMeta={fieldMeta}
          onRowClick={() => {}}
          onFKClick={() => {}}
          mutationDefs={[]}
        />
      </div>
      <div className="w-1/2 p-4 bg-dui-surface-secondary">
        <p className="text-xs text-dui-text-muted mb-3">Edit panel</p>
        <div className="space-y-3">
          {preview.fields.slice(0, 5).map((f) => (
            <div key={f.name}>
              <label className="block text-xs font-medium text-dui-text-secondary mb-1">{f.label}</label>
              <div className="h-8 rounded-dui-sm bg-dui-surface border border-dui-border" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Review/Audit: full-width table, status column prominent
function ReviewAuditArchetype({ preview, displayConfig, fieldMeta }) {
  return (
    <div className="bg-dui-surface p-3">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium text-dui-text">
          {preview.entity} — {preview.rows.length} records
        </span>
        <div className="flex gap-2">
          <div className="h-7 w-20 rounded-dui-sm bg-dui-surface-tertiary border border-dui-border" />
          <div className="h-7 w-24 rounded-dui-sm bg-dui-primary opacity-80" />
        </div>
      </div>
      <DataTable
        result={{ entity: preview.entity, rows: preview.rows, total_count: preview.rows.length, fields: preview.fields.map(f => f.name), query_time_ms: 0 }}
        displayConfig={displayConfig}
        fieldMeta={fieldMeta}
        onRowClick={() => {}}
        onFKClick={() => {}}
        mutationDefs={[]}
      />
    </div>
  );
}

// Kanban: column skeleton (actual columns = status enum values from backend)
function KanbanArchetype({ preview }: { preview: PreviewData }) {
  const statusField = preview.fields.find(f => f.is_status);
  const statusValues = statusField
    ? [...new Set(preview.rows.map(r => String(r[statusField.name])))]
    : ['Pending', 'In Progress', 'Done'];

  return (
    <div className="flex gap-3 p-4 bg-dui-surface overflow-x-auto" style={{ minHeight: 280 }}>
      {statusValues.slice(0, 4).map((status) => (
        <div key={status} className="flex-shrink-0 w-52">
          <div className="bg-dui-surface-secondary rounded-dui-md p-2">
            <p className="text-xs font-semibold text-dui-text-secondary mb-2 px-1">{status}</p>
            {preview.rows
              .filter(r => statusField && r[statusField.name] === status)
              .slice(0, 3)
              .map((_, i) => (
                <div key={i} className="bg-dui-surface rounded-dui-sm border border-dui-border p-2 mb-2 text-xs text-dui-text">
                  {preview.fields[0] && String(preview.rows[i]?.[preview.fields[0].name] ?? '—')}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Timeline: vertical progression skeleton
function TimelineArchetype({ preview }: { preview: PreviewData }) {
  return (
    <div className="p-4 bg-dui-surface space-y-3">
      {preview.rows.slice(0, 5).map((row, i) => (
        <div key={i} className="flex gap-3 items-start">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-dui-primary mt-0.5" />
            {i < 4 && <div className="w-px flex-1 bg-dui-border mt-1" style={{ minHeight: 24 }} />}
          </div>
          <div className="flex-1 pb-3">
            <p className="text-xs font-medium text-dui-text">
              {preview.fields[0] && String(row[preview.fields[0].name] ?? '—')}
            </p>
            <p className="text-xs text-dui-text-muted">
              {preview.fields.find(f => f.name.includes('at') || f.name.includes('date'))
                ? String(row[preview.fields.find(f => f.name.includes('at'))?.name ?? ''] ?? '')
                : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Metric card
function MetricCard({ field, rows }: { field: string; rows: Record<string, unknown>[] }) {
  const values = rows.map(r => Number(r[field] ?? 0));
  const total = values.reduce((a, b) => a + b, 0);
  return (
    <div className="bg-dui-surface-secondary rounded-dui-md p-3 border border-dui-border">
      <p className="text-xs text-dui-text-secondary">{field.replace(/_/g, ' ')}</p>
      <p className="text-lg font-semibold text-dui-text">{total.toLocaleString()}</p>
    </div>
  );
}

// Helpers to build DataTable props from PreviewField[]
function buildDisplayConfig(preview: PreviewData) {
  return {
    primaryLabel: preview.fields[0]?.name ?? 'id',
    secondaryLabel: preview.fields[1]?.name,
    defaultPageSize: 10,
    searchable: preview.fields.filter(f => f.column_priority === 'high').map(f => f.name),
    hiddenByDefault: preview.fields.filter(f => f.column_priority === 'low').map(f => f.name),
  };
}

function buildFieldMeta(preview: PreviewData) {
  return preview.fields.map(f => ({
    name: f.name,
    label: f.label,
    type: f.is_monetary ? 'decimal' : f.is_status ? 'string' : 'string',
    displayHint: f.display_hint,
    isPK: false,
    isFK: false,
    enumRef: f.is_status ? `${f.name}_enum` : null,
    isMutable: false,   // preview is always read-only
    isSensitive: false,
  }));
}
```

**DataTable reuse constraint:** Canvas passes `mutationDefs={[]}` and no-op callbacks
to make the DataTable read-only in preview. Never pass a real mutation definition —
the preview must never trigger real mutations.

---

## 10. Generate Button

**File:** `src/components/canvas/GenerateButton.tsx`

```typescript
// src/components/canvas/GenerateButton.tsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { canvasClient } from '../../lib/canvasClient';
import { Download, Loader2, CheckCircle } from 'lucide-react';

interface Props {
  sessionId: string | null;
  disabled: boolean;
  artifactsUrl: string | null;
}

export function GenerateButton({ sessionId, disabled, artifactsUrl }: Props) {
  const [generated, setGenerated] = useState(false);

  const generate = useMutation({
    mutationFn: () => canvasClient.generate(sessionId!),
    onSuccess: () => setGenerated(true),
  });

  if (generated && artifactsUrl) {
    return (
      <a
        href={artifactsUrl}
        download="canvas-output.zip"
        className="flex items-center gap-2 rounded-dui-md bg-dui-success px-4 py-2
                   text-sm font-medium text-white hover:opacity-90 transition-opacity"
      >
        <Download className="w-4 h-4" />
        Download Output
      </a>
    );
  }

  return (
    <button
      onClick={() => generate.mutate()}
      disabled={disabled || generate.isPending}
      className="flex items-center gap-2 rounded-dui-md bg-dui-primary px-4 py-2
                 text-sm font-medium text-dui-primary-foreground
                 hover:bg-dui-primary-hover transition-colors
                 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {generate.isPending ? (
        <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
      ) : (
        <><CheckCircle className="w-4 h-4" /> Generate</>
      )}
    </button>
  );
}
```

---

## 11. Router Registration

**File:** `src/router.tsx` (existing file — add one route)

Locate the existing route definitions and add the Canvas route. Do **not** restructure
the router — add only what Canvas needs.

```typescript
// Add to existing routes array:
import { CanvasPage } from './pages/Canvas';

// Inside routes definition:
{
  path: '/canvas',
  element: <CanvasPage />,
}
```

Also add a nav link to Canvas in the sidebar/nav component (wherever other top-level
routes are linked). Use the `Palette` icon from Lucide React. Label: "Canvas".

---

## 12. CLAUDE.md Updates

Add the following section to the repo's `CLAUDE.md` immediately after completing any
task. This ensures future Claude Code sessions have correct context.

```markdown
## Canvas Feature (LLD 9)

Canvas is a conversational UI generator at `/canvas`. Key constraints:

**ScopedThemeProvider** (`src/components/canvas/ScopedThemeProvider.tsx`)
- Rewrites `:root {}` → `.{scopeClass} {}` in theme CSS
- NEVER injects into document :root — preview only
- Used only inside PreviewPanel

**canvasClient** (`src/lib/canvasClient.ts`)
- Extends the existing `apiFetch` from apiClient — does not duplicate it
- Base URL: `VITE_CANVAS_API_BASE` env var (default `/api/v1/canvas`)

**DataTable in Preview**
- Always called with `mutationDefs={[]}` — never triggers real mutations
- Synthetic data from `/session/{id}/preview` endpoint
- FieldMeta built from `PreviewField[]` via `buildFieldMeta()` in ArchetypePreview.tsx

**Intent polling**
- `useCanvasIntent` polls every `VITE_CANVAS_INTENT_POLL_MS` ms (default 2000)
- Polling stops when `session.state === 'complete'`
- `intentVersion` counter in Canvas.tsx triggers preview refresh on intent change

**NLInputBar reuse**
- ChatPanel reuses the existing NLInputBar — do NOT modify NLInputBar
- Pass `disabled={true}` when session is complete

**Theming rules (same as rest of app)**
- All className values use `dui-*` Tailwind tokens only
- No hardcoded hex colours, no inline styles with colours
- No Tailwind `dark:` prefix — dark mode via @media in theme CSS
```

---

## 13. Task Execution Order

Run these tasks sequentially in Claude Code. Each task depends on the previous.

| Task | File(s) | Depends on | Est. |
|------|---------|------------|------|
| **CF-1** | `src/types/canvas.ts` | nothing | 20 min |
| **CF-2** | `src/lib/canvasClient.ts` + export `apiFetch` from apiClient | CF-1 | 20 min |
| **CF-3** | `src/components/canvas/ScopedThemeProvider.tsx` | CF-1 | 20 min |
| **CF-4** | All three hooks in `src/hooks/canvas/` | CF-1, CF-2 | 30 min |
| **CF-5** | `src/components/canvas/MessageBubble.tsx` + `ChatPanel.tsx` | CF-1, CF-4 | 30 min |
| **CF-6** | `src/components/canvas/IntentSummary.tsx` | CF-1 | 15 min |
| **CF-7** | `src/components/canvas/GenerateButton.tsx` | CF-1, CF-2 | 20 min |
| **CF-8** | `src/components/canvas/ArchetypePreview.tsx` | CF-1, CF-3 | 60 min |
| **CF-9** | `src/components/canvas/PreviewPanel.tsx` | CF-3, CF-8 | 20 min |
| **CF-10** | `src/pages/Canvas.tsx` | CF-4–CF-9 | 30 min |
| **CF-11** | Router + nav link | CF-10 | 10 min |
| **CF-12** | Tests (Vitest + Playwright) | CF-10, CF-11 | 90 min |

---

## 14. Per-Task Claude Code Instructions

### Task CF-1 — Type Definitions

```
Read: src/lib/apiClient.ts (check existing QueryResult, FieldMeta type names)
Goal: Create src/types/canvas.ts with all types from §2 of this document.
Constraint: Type names must not conflict with existing types in src/types/*.ts
            Check src/types/ for existing files before creating.
After: Run `tsc --noEmit` — must pass with zero errors.
```

### Task CF-2 — Canvas API Client

```
Read: src/lib/apiClient.ts — find apiFetch function, check if it is exported.
Goal: 
  1. If apiFetch is not exported, add a named export: `export { apiFetch }` at bottom of file.
  2. Create src/lib/canvasClient.ts exactly as defined in §3 of this document.
Constraint: Never copy the apiFetch implementation — only import and reuse.
            The canvasClient must match the API contract in LLD 9 §4 exactly.
After: Run `tsc --noEmit`. Verify canvasClient.createSession, sendMessage,
       getSession, getIntent, getPreview, generate, getArtifactsUrl all present.
```

### Task CF-3 — ScopedThemeProvider

```
Read: src/themes/theme-default.css — note exact :root { } structure and
      @media (prefers-color-scheme: dark) { :root { } } structure.
Goal: Create src/components/canvas/ScopedThemeProvider.tsx as defined in §4.
Constraint: 
  - The CSS rewrite regex must handle the exact format in theme-default.css.
  - Test the regex against the actual theme file content — not a hypothetical.
  - The component must NOT use dangerouslySetInnerHTML.
After: Write a Vitest test that:
  1. Renders ScopedThemeProvider with a sample theme CSS containing :root {} 
     and @media dark { :root {} } blocks.
  2. Asserts the rendered <style> contains .dui-canvas-preview- scoped selectors.
  3. Asserts :root does NOT appear in the rendered style tag.
```

### Task CF-4 — React Query Hooks

```
Read: src/lib/queryClient.ts — understand QueryClient configuration.
      src/hooks/ — check existing hook patterns and naming conventions.
Goal: Create three files in src/hooks/canvas/ as defined in §5.
Constraint:
  - useCreateSession: onSuccess must invalidate no stale queries (fresh session).
  - useCanvasIntent: refetchInterval must be false when sessionState === 'complete'.
  - useCanvasPreview: intentVersion in queryKey ensures refetch on intent change.
  - Follow existing hook file naming conventions in src/hooks/.
After: Run `tsc --noEmit`. 
```

### Task CF-5 — Chat Panel

```
Read: src/components/NLInputBar.tsx — check exact prop interface (onSubmit, 
      placeholder, disabled — verify all prop names before writing ChatPanel).
Goal: Create MessageBubble.tsx and ChatPanel.tsx as defined in §7.
Constraint:
  - ChatPanel must import NLInputBar from its actual path in this repo.
  - Pass only props that NLInputBar actually accepts — do not invent new props.
  - If NLInputBar requires props Canvas doesn't need (e.g. entity), find the 
    correct default or optional approach — do NOT modify NLInputBar.
After: Write a Vitest + React Testing Library test:
  1. Render ChatPanel with 2 messages (one user, one assistant).
  2. Assert both MessageBubble components render with correct text.
  3. Assert input is disabled when sessionState === 'complete'.
```

### Task CF-6 — Intent Summary

```
Goal: Create src/components/canvas/IntentSummary.tsx as defined in §8.
Constraint: All MOOD_LABELS and PROFILE_LABELS keys must match the Domain, 
            AestheticMood, OperationProfile values in canvas.ts exactly.
After: Vitest test — render with a partial intent, assert chips render correctly.
       Render with empty intent, assert placeholder text renders.
```

### Task CF-7 — Generate Button

```
Read: Check what success/loading icon patterns exist in other buttons in this repo.
Goal: Create src/components/canvas/GenerateButton.tsx as defined in §10.
Constraint:
  - The download link uses `download="canvas-output.zip"` attribute.
  - Button must show Loader2 spinner during generate.mutate() pending state.
  - After successful generate, switch to download link permanently (setGenerated(true)).
After: Vitest test — disabled state when disabled=true, pending state during mutation.
```

### Task CF-8 — Archetype Preview (longest task)

```
Read: 
  src/components/data-display/DataTable/DataTable.tsx — check exact prop interface.
  src/components/data-display/DataTable/types.ts (if exists) — check DisplayConfig, 
  FieldMeta types.
Goal: Create src/components/canvas/ArchetypePreview.tsx as defined in §9.
Constraint:
  - DataTable prop interface must match exactly — check all required props.
  - buildDisplayConfig() and buildFieldMeta() must produce objects that satisfy 
    DataTable's TypeScript prop types without casting.
  - mutationDefs={[]} must be valid for DataTable — if DataTable requires a different
    prop name or shape, adapt the call (but do NOT modify DataTable).
  - All 5 archetype branches must be implemented.
  - KanbanArchetype must correctly group rows by status field value.
After: 
  - Run `tsc --noEmit` — zero errors.
  - Vitest test: render each archetype with fixture PreviewData, assert no crashes.
```

### Task CF-9 — Preview Panel

```
Read: src/components/canvas/ScopedThemeProvider.tsx (CF-3)
      src/components/canvas/ArchetypePreview.tsx (CF-8)
Goal: Create src/components/canvas/PreviewPanel.tsx as defined in §9.
Constraint:
  - extractPrimaryColor() must handle edge case where theme_css has no --dui-primary.
  - Null preview state renders empty state, not an error.
After: Vitest test — render with null preview (empty state), render with fixture preview.
```

### Task CF-10 — Canvas Page

```
Read: All Canvas component files (CF-5 through CF-9)
      src/hooks/canvas/*.ts (CF-4)
Goal: Create src/pages/Canvas.tsx as defined in §6.
Constraint:
  - intentVersion counter logic: use JSON.stringify comparison to detect real changes.
    Do NOT use shallow equality — the intent object reference changes every poll.
  - createSession.mutate() called in useEffect with [] deps — fires once on mount.
  - Chat panel width is fixed at 420px using inline style or a specific Tailwind 
    width class (w-[420px]) — do not use a percentage.
After: Run `tsc --noEmit`. 
```

### Task CF-11 — Router + Navigation

```
Read: src/router.tsx — identify exact route array structure.
      Find the sidebar/nav component — search for where other route links are defined.
Goal: 
  1. Add /canvas route to router.tsx.
  2. Add Canvas nav link (Palette icon, label "Canvas") in the same nav component.
Constraint: 
  - Add only the Canvas route — do NOT restructure any existing routes.
  - Nav link must use the same component/pattern as other nav links in that component.
After: Manual check — navigate to /canvas in the browser (dev server running), 
       confirm CanvasPage renders without errors.
```

### Task CF-12 — Tests

```
Goal: Implement tests covering the complete Canvas feature.

Unit tests (Vitest + React Testing Library):
  tests/canvas/ScopedThemeProvider.test.tsx
    - CSS rewrite scopes :root → .dui-canvas-preview-*
    - CSS rewrite scopes @media dark :root → .dui-canvas-preview-*
    - :root never appears in output style
  tests/canvas/IntentSummary.test.tsx
    - Renders chips for all populated fields
    - Renders placeholder for empty intent
  tests/canvas/ChatPanel.test.tsx
    - Renders messages correctly
    - Input disabled when sessionState === 'complete'
    - Calls sendMessage on submit
  tests/canvas/GenerateButton.test.tsx
    - Disabled state
    - Pending state
    - Download link appears after success

Playwright e2e tests (tests/e2e/canvas.spec.ts):
  - Navigate to /canvas — page loads
  - Send a message — response appears, intent summary updates
  - Generate button disabled until state complete (mock session API)
  - Generate button triggers POST /generate — download link appears

After: `vitest run` must pass. `playwright test tests/e2e/canvas.spec.ts` must pass
       against mock server (use existing MSW setup if present, or add it).
```

---

## 15. Constraints Summary (Non-Negotiable)

These rules apply to every task in the Canvas feature:

1. **`--dui-*` tokens only** — zero hardcoded hex colours, no `rgb()`, no `hsl()` values anywhere in Canvas component files. Use `bg-dui-*`, `text-dui-*`, `border-dui-*` Tailwind classes.

2. **No `dark:` Tailwind prefix** — dark mode is handled by the theme CSS `@media` block via `ScopedThemeProvider`. Using `dark:` would break the scoped theme system.

3. **No modifications to existing components** — `DataTable`, `DetailCard`, `NLInputBar`, `apiClient` are read-only from Canvas's perspective. If a prop interface doesn't fit, adapt Canvas to it, not the other way around.

4. **`apiFetch` import, not copy** — `canvasClient.ts` imports and wraps `apiFetch`. Never duplicate the JWT injection or error handling logic.

5. **Preview is always read-only** — every `DataTable` in Canvas receives `mutationDefs={[]}`. No Canvas user action must ever trigger a backend mutation.

6. **No `dangerouslySetInnerHTML`** — `ScopedThemeProvider` uses `<style>` with a string child, which React handles safely as text.

7. **Session created once on mount** — `useEffect(() => { createSession.mutate() }, [])` in Canvas.tsx. Never recreate the session on re-render.

8. **TypeScript strict mode** — `tsc --noEmit` must pass after every task with zero errors or warnings.