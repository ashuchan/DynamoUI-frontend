# DynamoUI v2 — Frontend Implementation Plan

*Implementation plan for the personal workspace, action rail, provenance UI, scheduling, palette, sharing · React 18 + TypeScript + TanStack*

## 0. Scope and sequencing

The existing frontend (LLD 6, 7, 8) ships DataTable, DetailCard, theming, Widget Registry, and the `apiClient`. This plan extends that codebase — **same repo, same build, same apiClient layer** — with eight new feature clusters. No new frontend service, no micro-frontends.

| M | Cluster | Depends on | Weeks |
|---|---------|-----------|-------|
| F1 | App shell redesign (nav, layout, routing) | Phase 1 FE | 1 |
| F2 | apiClient v2 + React Query keys + auth context | F1 | 0.5 |
| F3 | Saved Views UI (save, list, execute, rename) | F2, backend M2 | 1.5 |
| F4 | Personal Dashboards UI (grid, DnD, tiles) | F3 | 2 |
| F5 | Action Rail (contextual next-action panel) | F3 | 1 |
| F6 | Provenance Drawer + Verifier Badge | F5, backend M4 | 1 |
| F7 | Schedule modal + NL-to-schedule UX | F5, backend M5 | 1.5 |
| F8 | Alerts UI | F7, backend M6 | 1 |
| F9 | Command palette (Cmd-K) + slash commands | F2 | 1 |
| F10 | Sharing UI (token creation, embed preview) | F3, backend M8 | 0.5 |

Total: ~11 weeks, two frontend engineers in parallel. F1 and F2 are the foundation and block everything else; fund them first.

---

## 1. App shell redesign (F1)

The current UI is effectively a global dashboard + NL bar + table/card rendering area. For the new model — personal workspace, shared library, provenance, palette — the shell needs real information architecture.

### 1.1 Layout

```
┌─────────────────────────────────────────────────────────────┐
│ TopBar: [Logo] [NL input bar (always visible)] [User menu]  │
├─────────┬───────────────────────────────────────────────────┤
│         │                                                    │
│ LeftNav │                                                    │
│         │                                                    │
│ • Home  │              MainPane                              │
│ • Dashb.│              (route-driven)                        │
│ • Views │                                                    │
│ • Entit.│                                                    │
│ • Libr. │                                                    │
│         │                                                    │
│         │                                           ┌──────┐ │
│         │                                           │Action│ │
│         │                                           │ Rail │ │
│         │                                           │      │ │
│         │                                           └──────┘ │
└─────────┴───────────────────────────────────────────────────┘
```

- **TopBar**: persistent NL input, Cmd-K shortcut hint, user menu (settings, sign out).
- **LeftNav**: collapsible, keyboard-focusable, destinations: Home, My Dashboards, My Views, Entities, Library (admin-curated widgets), Schedules, Alerts, Shared.
- **MainPane**: React Router routes. The NL bar, when submitted, *navigates* to a result route (`/results/:session_id`) rather than rendering inline — this gives every result a URL and makes share/pin trivially work.
- **Action Rail**: right-side panel, 280px wide, contextual to the MainPane content. Collapsible. See F5.

### 1.2 Routes

```
/                        → Home (composed, see F4)
/dashboards              → List of my dashboards
/dashboards/:id          → One dashboard
/dashboards/:id/edit     → Edit mode (DnD layout)
/views                   → My saved views
/views/:id               → Execute + display a saved view
/entities                → Entity directory (from skill registry)
/entities/:entity        → Default list for an entity
/entities/:entity/:pk    → Detail view
/library                 → Admin-curated widgets (existing widget registry)
/schedules               → My schedules
/schedules/:id           → Schedule detail + run history
/alerts                  → My alerts
/alerts/:id              → Alert detail + trigger history
/results/:session_id     → Transient result view (from NL bar submit)
/shared/:token           → Shared view/dashboard (unauth-capable)
/embed/:token            → Iframe-friendly render (no chrome)
```

Route structure matters: it means any result a user sees **has a copy-paste-able URL**. This drops the cost of Pin/Share/Schedule because they all just reference the URL's source.

### 1.3 Component structure additions

```
src/
├── components/
│   ├── shell/
│   │   ├── AppShell.tsx
│   │   ├── TopBar.tsx
│   │   ├── LeftNav.tsx
│   │   ├── NLInputBar.tsx             # Moved out of dashboard — now global
│   │   └── ActionRail.tsx
│   ├── dashboard/                     # Extended from LLD 8
│   │   ├── Dashboard.tsx              # Personal or library, same component
│   │   ├── DashboardGrid.tsx          # Replaces WidgetGrid — supports DnD
│   │   ├── DashboardTile.tsx          # Generalised widget card
│   │   └── DashboardEditToolbar.tsx
│   ├── saved-view/
│   │   ├── SaveViewModal.tsx
│   │   ├── SavedViewList.tsx
│   │   ├── SavedViewCard.tsx
│   │   └── StaleViewBanner.tsx
│   ├── provenance/
│   │   ├── ProvenanceBadge.tsx        # Chip in result header
│   │   ├── ProvenanceDrawer.tsx
│   │   ├── VerifierVerdictPill.tsx
│   │   └── EditAsNLButton.tsx
│   ├── schedule/
│   │   ├── ScheduleModal.tsx
│   │   ├── CronPreview.tsx            # Shows next 5 fire times
│   │   ├── ChannelPicker.tsx
│   │   ├── ScheduleList.tsx
│   │   └── ScheduleRunHistory.tsx
│   ├── alert/
│   │   ├── AlertModal.tsx
│   │   ├── ConditionBuilder.tsx       # Structured AND NL
│   │   └── AlertList.tsx
│   ├── palette/
│   │   ├── CommandPalette.tsx         # Cmd-K overlay
│   │   ├── PaletteResultGroup.tsx
│   │   └── usePalette.ts              # Global keyboard shortcut hook
│   ├── share/
│   │   ├── ShareModal.tsx
│   │   ├── ShareTokenList.tsx
│   │   └── EmbedPreview.tsx
│   └── data-display/                  # Existing (LLD 6)
└── lib/
    ├── apiClient.ts                   # Extended (see F2)
    └── hooks/
        ├── useSavedView.ts
        ├── useDashboard.ts
        ├── usePin.ts
        ├── useSchedule.ts
        ├── useAlert.ts
        ├── useProvenance.ts
        ├── usePalette.ts
        ├── useShare.ts
        └── useNLResolve.ts
```

---

## 2. apiClient v2 (F2)

Extend the existing `apiClient` with the new endpoints. Shape stays the same (typed functions, no direct `fetch` calls from components).

### 2.1 New methods

```ts
export const apiClient = {
  ...existing,

  // Saved views
  listSavedViews: (filter?: {entity?: string; shared?: boolean}) =>
    apiFetch<SavedView[]>(`/views${toQuery(filter)}`),
  createSavedView: (body: CreateSavedViewInput) =>
    apiFetch<SavedView>('/views', {method: 'POST', body: JSON.stringify(body)}),
  executeSavedView: (id: string) =>
    apiFetch<ExecutedResult>(`/views/${id}/execute`, {method: 'POST'}),
  updateSavedView: (id: string, patch: SavedViewPatch) =>
    apiFetch<SavedView>(`/views/${id}`, {method: 'PATCH', body: JSON.stringify(patch)}),
  deleteSavedView: (id: string) =>
    apiFetch<void>(`/views/${id}`, {method: 'DELETE'}),

  // Dashboards
  listDashboards: () => apiFetch<Dashboard[]>('/dashboards'),
  createDashboard: (body: CreateDashboardInput) => /* ... */,
  getDashboard: (id: string) => apiFetch<DashboardTree>(`/dashboards/${id}`),
  updateDashboard: (id: string, patch: DashboardPatch) => /* ... */,
  addTile: (dashId: string, tile: CreateTileInput) => /* ... */,
  removeTile: (dashId: string, tileId: string) => /* ... */,
  getHome: () => apiFetch<HomeComposition>('/home'),

  // Pins
  createPin: (body: {source_type: SourceType; source_id: string}) => /* ... */,
  deletePin: (id: string) => /* ... */,

  // Schedules + alerts
  listSchedules: () => /* ... */,
  createSchedule: (body: CreateScheduleInput) => /* ... */,
  testSchedule: (id: string) => /* ... */,
  listAlerts: () => /* ... */,
  createAlert: (body: CreateAlertInput) => /* ... */,

  // Palette + slash commands
  search: (q: string, types?: SearchType[]) => /* ... */,
  dispatchCommand: (cmd: string, args: string) => /* ... */,

  // Provenance
  editAsNL: (queryPlan: QueryPlan) => /* ... */,
  proposePattern: (queryPlan: QueryPlan, userInput: string) => /* ... */,

  // Sharing
  createShareToken: (body: CreateShareTokenInput) => /* ... */,
  listShareTokens: (sourceType: SourceType, sourceId: string) => /* ... */,
  revokeShareToken: (id: string) => /* ... */,
};
```

### 2.2 Result envelope types

All execute endpoints now return the provenance-enriched envelope:

```ts
interface ExecutedResult {
  result: QueryResult;         // existing LLD 6 shape
  provenance: Provenance;      // new
}

interface Provenance {
  candidateSource: 'cache' | 'template' | 'synthesised' | 'saved_view';
  patternId?: string;
  patternMatchConfidence?: number;
  verifierVerdict: 'approve' | 'reject' | 'approve_with_note' | 'skipped';
  verifierVerified: boolean;
  verifierLatencyMs?: number;
  verifierCacheHit?: boolean;
  synthesised: boolean;
  synthesisConfidence?: number;
  queryPlan: QueryPlan;
  generatedSql?: string;       // optional, feature-flagged by backend
  executionLatencyMs: number;
  adapter: string;
  skillHash: string;
  llmCostUsd: number;
  timestamp: string;
}
```

### 2.3 React Query key strategy

The existing `queryKeys` structure is extended:

```ts
const queryKeys = {
  ...existing,
  savedViewList: (filter?: Filter) => ['savedViewList', filter],
  savedView: (id: string) => ['savedView', id],
  savedViewExecute: (id: string) => ['savedViewExecute', id],
  dashboardList: () => ['dashboardList'],
  dashboard: (id: string) => ['dashboard', id],
  dashboardTile: (dashId: string, tileId: string, version: number) =>
    ['dashboardTile', dashId, tileId, version],
  home: () => ['home'],
  schedules: () => ['schedules'],
  schedule: (id: string) => ['schedule', id],
  alerts: () => ['alerts'],
  search: (q: string, types?: string[]) => ['search', q, types],
};
```

**Invalidation rules**:
- Create/update/delete a saved view → invalidate `savedViewList` and `home`.
- Add/remove/reorder a tile → invalidate `dashboard(id)` only, not `home` (home has its own composition).
- Schedule CRUD → invalidate `schedules` and `home` (home may show "3 scheduled reports" summary).

### 2.4 NL resolve flow

The existing `apiClient.resolve()` returns `ResolutionResult`. The frontend wraps this in a `useNLResolve` hook that handles the full flow:

```ts
function useNLResolve() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (input: string) => {
      const resolution = await apiClient.resolve(input);

      // Resolution may be SCHEDULE intent — return the draft, let the
      // component show the confirmation modal.
      if (resolution.intent === 'SCHEDULE') {
        return {kind: 'schedule_draft', draft: resolution.scheduleDraft};
      }

      // Otherwise execute and return the result.
      const executed = await apiClient.executeResolution(resolution);
      return {kind: 'executed', executed};
    },
    onSuccess: (data) => {
      if (data.kind === 'executed') {
        // Navigate to a result session URL so the result is linkable
        const sessionId = stashResult(data.executed);
        navigate(`/results/${sessionId}`);
      }
      // schedule_draft is handled by the component showing ScheduleModal
    },
  });
}
```

`stashResult` puts the result in a session store (Zustand or a bounded React Query cache) keyed by a generated session ID. The `/results/:sessionId` route reads from this store. When the user saves, pins, or schedules, the session context is what gets persisted.

---

## 3. Saved Views UI (F3)

### 3.1 Save-view affordance

Every result view (table, card, chart) gets a "Save view" entry in the Action Rail. Clicking opens `SaveViewModal`:

```
┌─────────────────────────────────────────┐
│  Save this view                          │
│                                          │
│  Name:    [ Senior Platform Hires    ]  │
│                                          │
│  Based on: "senior platform engineers"  │
│                                          │
│  [Visibility: 🔒 Only me  |  🌐 Share]  │
│                                          │
│  ✓ Provenance kept: pattern match        │
│  Last refreshed: 2s ago                  │
│                                          │
│              [Cancel]  [Save view]       │
└─────────────────────────────────────────┘
```

The modal is purely client-side until submit — name inline-validated for uniqueness against the user's view list (query cache). Visibility defaults to private.

### 3.2 My Views page

`/views` renders a grid of `SavedViewCard` items. Each card:

- Shows name, entity, last refresh time, result shape icon (table/card/chart).
- Hover reveals: Execute, Pin to home, Schedule, Share, Rename, Delete.
- Clicking the card navigates to `/views/:id` which executes and renders.

### 3.3 Stale view banner

If the backend returns a saved view with `stale: true` (schema changed since save), the banner appears above the result:

```
┌──────────────────────────────────────────────────────────┐
│ ⚠  This view's underlying data model has changed.         │
│    We re-resolved "senior platform engineers" and got    │
│    a slightly different plan. [Review changes] [Accept]  │
└──────────────────────────────────────────────────────────┘
```

"Review changes" opens a diff of old plan vs new plan. "Accept" updates the stored view and clears the flag.

---

## 4. Personal Dashboards UI (F4)

### 4.1 Dashboard rendering

Reuses and generalises the existing `WidgetGrid` from LLD 8. The new `DashboardGrid` component:

- Uses **react-grid-layout** for drag-and-drop tile positioning (same library used by Grafana, battle-tested).
- 12-column responsive grid. Tile w/h stored in layout JSON.
- Each tile is a `DashboardTile` component that polymorphically renders based on `source_type`:
  - `saved_view` → executes the view, renders result (table/card/chart) in a framed container.
  - `widget` → executes the widget (existing Phase 1 flow).
  - `pattern_result` → executes the pattern directly.
- Tile header shows title, refresh button, three-dot menu (Edit, Remove, Full screen).

### 4.2 Edit mode

`/dashboards/:id/edit` enables drag-and-drop. Implementation notes:

- Layout changes are **optimistic** — frontend updates immediately, syncs to backend on drop with `updateDashboard`.
- Debounce reorder writes to 500ms. If the user drags three tiles in quick succession, only one PATCH goes out.
- Undo stack (last 10 layout states) with `Ctrl-Z` — stays client-side, not persisted.

### 4.3 Add tile flow

"Add tile" button opens a drawer with three tabs:

- **My Views** — pick a saved view.
- **Library** — pick an admin widget.
- **From query** — type NL, see a preview, add as a tile (creates a saved view implicitly).

### 4.4 Home page (F4 final)

`/` renders the personal home, which is a composition:

```
┌─ Top section: Pinned items (horizontally scrollable row) ────────┐
│  [Pin 1] [Pin 2] [Pin 3] [+ Pin]                                  │
└───────────────────────────────────────────────────────────────────┘

┌─ Middle: Default dashboard (if user has one marked default) ─────┐
│  [Dashboard grid render]                                           │
└───────────────────────────────────────────────────────────────────┘

┌─ Bottom: Quick access ────────────────────────────────────────────┐
│  Recent queries  |  Schedules firing today  |  Active alerts     │
└───────────────────────────────────────────────────────────────────┘
```

Data comes from the single `GET /api/v1/home` call which returns all of this in one round trip.

---

## 5. Action Rail (F5)

The right-side panel that turns every result into a workbench.

### 5.1 Context-sensitive sections

```
┌──────────────────────────┐
│  Actions                  │
├──────────────────────────┤
│  VISUALISE                │
│  [📊 Bar chart]           │
│  [📈 Line chart]          │
│  [🥧 Pie chart]           │
│  [More charts...]         │
├──────────────────────────┤
│  PERSIST                  │
│  💾 Save as view          │
│  📌 Pin to home           │
│  📅 Schedule delivery     │
│  🔔 Create alert          │
├──────────────────────────┤
│  TRANSFORM                │
│  🔍 Refine query          │
│  📊 Compare to last Q     │
│  ⚡ Run on subset         │
├──────────────────────────┤
│  EXPORT                   │
│  ⬇ CSV  |  XLSX  |  Copy │
├──────────────────────────┤
│  SHARE                    │
│  🔗 Copy link             │
│  🌐 Share publicly        │
└──────────────────────────┘
```

Sections appear conditionally based on result type:

- `VISUALISE` appears only when result is tabular/aggregate, not when it's already a chart.
- `TRANSFORM → Compare to last Q` only appears when a date field is present in the result.
- `TRANSFORM → Run on subset` only appears for list results with >1 filterable field.

### 5.2 Composition

```tsx
function ActionRail() {
  const result = useCurrentResult();      // context from /results/:id or dashboard tile
  const sections = useActionSections(result);  // computes sections based on result shape

  return (
    <aside className="w-70 border-l border-dui-border">
      <RailHeader title="Actions" />
      {sections.map(section => (
        <RailSection key={section.id} section={section} />
      ))}
    </aside>
  );
}
```

The `useActionSections` hook is the brain — it knows which buttons make sense for which result shapes. Keep this in one file; it'll grow.

### 5.3 Keyboard shortcuts

Each action has a keyboard shortcut shown as a hint in the button:

- `S` → Save as view
- `P` → Pin
- `Shift+S` → Schedule
- `Shift+A` → Alert
- `E` → Export
- `/` → Refine query (focuses NL bar with current query prefilled)

Shortcuts only active when the rail has focus context (main pane is the current result). Disabled when a modal is open.

---

## 6. Provenance Drawer + Verifier Badge (F6)

### 6.1 Verifier badge

Every result pane gets a small badge in the top-right:

```
┌───────────────────────────────────┐
│ Senior Platform Engineers     ⓘ  │  <- ⓘ is the ProvenanceBadge
│                                   │
│ [DataTable renders here]          │
└───────────────────────────────────┘
```

The badge itself is compact:

- `✓ Cache · verified` (green) — pattern hit, verifier approved
- `✓ AI-written · verified` (blue) — synthesised, not re-verified (self-verification skipped)
- `✓ Saved view` (grey) — user's own view, not verified
- `⚠ Schema changed` (amber) — stale view banner separately handled
- `⚡ Cache · skipped` (grey) — high-confidence cache hit, verifier skipped per settings

Hovering the badge shows a tooltip with the top line. Clicking opens the `ProvenanceDrawer`.

### 6.2 Provenance drawer

Slides in from the right (overlaying or pushing the Action Rail):

```
┌─ Provenance ─────────────────────────────────────────┐
│ ✕                                                     │
│                                                       │
│  Source                                               │
│  Cached pattern: Employee.senior_platform_hires       │
│  Match confidence: 0.96                               │
│                                                       │
│  Verifier                                             │
│  ✓ Approved by Claude Haiku (42 ms)                  │
│  "Plan correctly identifies senior platform          │
│   engineers matching the request."                   │
│                                                       │
│  Query plan                                           │
│  [collapsible JSON view]                              │
│                                                       │
│  Generated SQL                           [copy]       │
│  SELECT e.id, e.name, e.department_id, e.salary      │
│  FROM employee e                                      │
│  WHERE e.skill_level IN ('TECH_BACKEND', ...)        │
│  ...                                                  │
│                                                       │
│  Execution                                            │
│  14 ms · PostgreSQL · 47 rows                        │
│                                                       │
│  Cost                                                 │
│  $0.0003 (verifier only)                              │
│                                                       │
│  ─────────────────────────────────────────────────    │
│                                                       │
│  Actions                                              │
│  [Edit as NL]    [Propose as pattern]                 │
│                                                       │
└───────────────────────────────────────────────────────┘
```

### 6.3 Edit-as-NL action

Clicking "Edit as NL" in the drawer:

1. Calls `apiClient.editAsNL(queryPlan)` to get the NL form.
2. Closes the drawer, focuses the global NL bar, populates it with the returned text.
3. User edits, presses enter, normal resolve flow runs.

### 6.4 Propose-as-pattern action

Only shown for `candidateSource === 'synthesised'` (novel queries). Clicking:

1. Calls `apiClient.proposePattern(queryPlan, userInput)`.
2. Shows a toast: "Proposed. An operator will review it." Closes drawer.
3. If the current user is an operator, shows a different flow — inline review modal (admin UX, out of scope here).

### 6.5 When verifier rejects

If the user's query triggered a verifier rejection — meaning the *displayed* result is from the LLM's plan, not the original candidate — the badge is `↪ Rerouted by verifier` (distinct style). The drawer shows both the rejected candidate and the plan that actually ran, side by side, with the verifier's reasoning. This is the most trust-building surface in the entire product; invest in polish here.

---

## 7. Schedule modal + NL-to-schedule (F7)

### 7.1 Explicit Schedule modal

Opened from the Action Rail's "Schedule delivery" action:

```
┌─ Schedule delivery ──────────────────────────────────┐
│                                                       │
│  Source: Senior Platform Engineers                   │
│                                                       │
│  Cadence                                              │
│  ◉ Preset:   [Daily ▾]  [9:00 AM ▾]                  │
│  ○ Custom cron: [___________]                         │
│                                                       │
│  Timezone: [Asia/Kolkata ▾]                          │
│                                                       │
│  Next 5 runs:                                         │
│  • Fri, Apr 18, 9:00 AM IST                          │
│  • Sat, Apr 19, 9:00 AM IST                          │
│  • Sun, Apr 20, 9:00 AM IST                          │
│  • Mon, Apr 21, 9:00 AM IST                          │
│  • Tue, Apr 22, 9:00 AM IST                          │
│                                                       │
│  Channel                                              │
│  ◉ Email to me (alice@corp.com)                      │
│  ○ Email to others  [+ recipient]                    │
│  ○ Slack channel [disabled - admin config needed]    │
│                                                       │
│  Format                                               │
│  [CSV ▾]   (CSV, XLSX, HTML snapshot)                │
│                                                       │
│             [Test now]  [Cancel]  [Schedule]          │
└───────────────────────────────────────────────────────┘
```

`CronPreview` component live-computes the next 5 fire times client-side (using `cronstrue` + `cron-parser`) so the user sees their schedule before saving. Invalid cron shows error inline.

"Test now" calls `POST /api/v1/schedules/:id/test` only after the schedule is saved — if not yet saved, the button is disabled with a tooltip.

### 7.2 NL-to-schedule flow

When the user types "email me a chart of department headcount weekly" in the NL bar:

1. `useNLResolve` submits to `/api/v1/resolve`.
2. Backend returns `{intent: 'SCHEDULE', scheduleDraft: {...}, subResolution: {...}}`.
3. Hook returns `{kind: 'schedule_draft', draft}`.
4. Component opens `ScheduleModal` in **confirmation mode** — pre-populated from the draft, with a line at the top:

```
┌─ Confirm schedule ───────────────────────────────────┐
│                                                       │
│  ℹ  I understood: "email me a chart of department    │
│     headcount weekly"                                 │
│     [Adjust...]                                       │
│                                                       │
│  Source: Chart — Department headcount (bar)          │
│  Cadence: Weekly · Monday 9:00 AM                    │
│  Timezone: Asia/Kolkata                               │
│  Channel: Email to alice@corp.com                    │
│  Format: HTML snapshot                                │
│                                                       │
│             [Cancel]  [Confirm & schedule]            │
└───────────────────────────────────────────────────────┘
```

5. Clicking "Adjust..." expands into the full schedule modal from §7.1.
6. Clicking "Confirm" saves; shows success toast with a link to the schedule detail page.

### 7.3 Schedule list and run history

`/schedules` — card list of user's schedules, each showing next fire, last status, channel. Click → `/schedules/:id` showing detail + `ScheduleRunHistory` (recent 50 runs with status, latency, row count, error).

---

## 8. Alerts UI (F8)

Similar structure to schedules.

### 8.1 Alert modal

```
┌─ Create alert ───────────────────────────────────────┐
│                                                       │
│  Source: Employees in Platform Engineering           │
│                                                       │
│  Condition                                            │
│  [Any row's field ▾] [salary ▾] [is greater than ▾] │
│  [300000            ]                                 │
│                                                       │
│  Alt: describe in plain English                       │
│  [____________________________________________]       │
│  ( Verifier will confirm my reading matches your     │
│    description. )                                     │
│                                                       │
│  Check every                                          │
│  [Hour ▾]                                             │
│                                                       │
│  Notify                                               │
│  ◉ Email to alice@corp.com                           │
│                                                       │
│             [Cancel]  [Create alert]                  │
└───────────────────────────────────────────────────────┘
```

Two modes: structured (dropdowns) and NL. NL mode posts to the same endpoint with a free-text description; backend parses and returns the structured form, frontend displays it for confirmation before saving.

### 8.2 Alert history

Shows trigger events: when fired, what matched, what was delivered. Small but reassuring UX — users want to see "this alert did its job."

---

## 9. Command palette (F9)

### 9.1 Invocation

Global `Cmd-K` / `Ctrl-K`. Implemented with a Zustand store `usePaletteStore` holding `isOpen` state, controlled by a single keyboard listener at the shell level.

### 9.2 Palette UI

```
┌──────────────────────────────────────────────┐
│ 🔍 Type to search...                          │
├──────────────────────────────────────────────┤
│ ENTITIES                                      │
│   📄 Employee                                 │
│   📄 Department                               │
│                                               │
│ MY VIEWS                                      │
│   👁 Senior Platform Hires                    │
│   👁 Q2 Salary Review                         │
│                                               │
│ DASHBOARDS                                    │
│   📊 Monday Review                            │
│                                               │
│ COMMANDS                                      │
│   /chart    Create a chart from NL            │
│   /schedule Schedule a report                 │
│   /save     Save current result as view       │
│                                               │
│ RECENT                                        │
│   ⏱ "senior platform engineers"               │
│   ⏱ "departments with highest payroll"        │
└──────────────────────────────────────────────┘
```

Implementation:

- Sections populated from three sources: (1) local recent-queries (Zustand), (2) backend `apiClient.search`, (3) static slash command list.
- Backend search debounced at 150ms. Results cached via React Query for 30s.
- Keyboard navigation: Arrow up/down to move selection, Enter to activate, Escape to close.
- Selected item determines handler: entity → navigate to `/entities/:name`, saved view → execute, command → run the command dispatcher.

### 9.3 Slash commands in the NL bar

When the user types `/` as the first character in the NL bar, a popover appears beneath the input showing the slash command menu. Tab completes the command; remaining text is the argument.

`/chart headcount by dept` → `apiClient.dispatchCommand('chart', 'headcount by dept')` which forces VISUALIZE intent on the backend regardless of classification.

Commands the frontend knows about:

```ts
const SLASH_COMMANDS = {
  chart:    {desc: 'Force a chart', needsArgs: true},
  table:    {desc: 'Force a table',  needsArgs: true},
  schedule: {desc: 'Schedule current result', needsArgs: false},
  save:     {desc: 'Save current result as view', needsArgs: true},
  pin:      {desc: 'Pin current result to home', needsArgs: false},
  export:   {desc: 'Export current result', needsArgs: true}, // csv|xlsx
};
```

Some commands operate on "current result" — these require a result session context to exist. If none exists, the command palette shows a disabled state with a tooltip "Run a query first."

---

## 10. Sharing UI (F10)

### 10.1 Share modal

From any saved view or dashboard three-dot menu:

```
┌─ Share ──────────────────────────────────────────────┐
│                                                       │
│  Create a share link                                  │
│                                                       │
│  Expires:   [7 days ▾]                                │
│  Max views: [Unlimited ▾]                             │
│                                                       │
│  Permissions: View-only                               │
│  (read-only, no edit, no refresh rate-limited)        │
│                                                       │
│                          [Cancel]  [Create link]      │
└───────────────────────────────────────────────────────┘
```

After creation:

```
┌─ Share link created ─────────────────────────────────┐
│                                                       │
│  https://dynamoui.corp.example/shared/abc123...       │
│  [Copy]                                               │
│                                                       │
│  Embed code                                           │
│  <iframe src="..."></iframe>                          │
│  [Copy]                                               │
│                                                       │
│  Manage active shares:  [3 active links →]            │
│                                                       │
│                                            [Close]    │
└───────────────────────────────────────────────────────┘
```

### 10.2 Shared view route

`/shared/:token` — minimal shell (no LeftNav, no NL bar by default), renders the shared content. Optional "Open in DynamoUI" button if the user is authenticated.

### 10.3 Embed route

`/embed/:token` — no chrome at all. Just the result, themed to match the parent page via postMessage-based theme sync (parent can post a theme token, iframe applies it). Nice-to-have, ship as a follow-up.

---

## 11. Accessibility (cross-cutting)

- All new interactive surfaces (modals, drawers, palette) use Radix UI primitives for focus trap, escape handling, ARIA roles.
- Cmd-K palette must be announced as a dialog. Result groups use `role="group"` with aria-labels.
- DnD in dashboard edit must have a keyboard-accessible fallback (arrow keys to move tile, Space to pick up/drop).
- Provenance drawer opens with focus on the close button.

## 12. Theming

All new components use the existing `--dui-*` CSS variable system (LLD 7). New tokens needed:

```
--dui-rail-bg, --dui-rail-border
--dui-badge-verified-bg, --dui-badge-verified-text
--dui-badge-rerouted-bg, --dui-badge-rerouted-text
--dui-badge-stale-bg, --dui-badge-stale-text
--dui-dashboard-tile-bg, --dui-dashboard-tile-border
--dui-palette-bg, --dui-palette-overlay
```

Document additions in the existing theme docs.

## 13. Testing

- Vitest + React Testing Library for unit tests of every new component.
- Playwright for key end-to-end flows:
  - Save → pin → add to dashboard → schedule → receive email (mocked).
  - NL query → verifier-rejected result → provenance drawer shows rerouted badge.
  - Cmd-K → search "employee" → navigate to entity list.
- Visual regression via Chromatic for the shell, drawer, modal surfaces — these are the most design-sensitive surfaces in the product.

## 14. Bundle/performance

- react-grid-layout is ~40KB gz — acceptable, lazy-load under `/dashboards/*` routes only.
- cronstrue + cron-parser ~20KB gz — lazy-load under `/schedules/*`.
- Palette should open in <100ms. Pre-warm the `apiClient.search('')` call on app mount to get a warm backend cache.
- Every MainPane route code-split.
