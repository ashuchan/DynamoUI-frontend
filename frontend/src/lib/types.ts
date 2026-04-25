export interface FieldMeta {
  name: string;
  type: 'string' | 'integer' | 'float' | 'boolean' | 'date' | 'uuid' | 'enum' | 'json';
  label: string;
  isPK: boolean;
  nullable: boolean;
  sensitive: boolean;
  enumRef?: string;
  fk?: { entity: string; field: string; displayField: string };
  display?: { visible: boolean; width?: number; format?: string };
}

export interface DisplayConfig {
  defaultSort: { field: string; direction: 'asc' | 'desc' };
  defaultPageSize: number;
  visibleFields: string[];
  searchableFields: string[];
}

export interface QueryResult {
  rows: Record<string, unknown>[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface Sort {
  field: string;
  direction: 'asc' | 'desc';
}

export type Filters = Record<string, { op: string; value: unknown }>;

export interface QueryParams {
  sort?: Sort;
  page?: number;
  pageSize?: number;
  filters?: Filters;
}

export interface MutationDef {
  id: string;
  operation: 'create' | 'update' | 'delete';
  description: string;
  fields: string[];
  requiresConfirmation: boolean;
}

export interface MutationPlan {
  entity: string;
  mutation_id: string;
  record_pk?: string;
  fields: Record<string, unknown>;
}

export interface DiffPreview {
  entity: string;
  record_pk?: string;
  operation: string;
  diff: Array<{ field: string; before: unknown; after: unknown }>;
}

export interface MutationResult {
  success: boolean;
  pk: string;
  message: string;
}

export interface ResolvedData {
  rows: Record<string, unknown>[];
  total_count: number;
}

// ── Legacy /resolve response (still used by LandingPage until F1 cutover) ─────
export interface ResolutionResult {
  intent: 'READ' | 'MUTATE' | 'VISUALIZE' | 'NAVIGATE';
  entity?: string;
  confidence: number;
  query_plan?: ResolvedData | null;
  patternMatch?: { patternId: string; confidence: number; matchedTrigger: string };
  llm_cost_usd?: number | null;
}

export interface EnumOption {
  value: string;
  label: string;
  deprecated: boolean;
}

export type EnumOptions = EnumOption[];

export interface WidgetParam {
  name: string;
  label: string;
  type: string;
  required: boolean;
  default?: unknown;
}

export interface Widget {
  id: string;
  title: string;
  description: string;
  entity: string;
  category: string;
  params: WidgetParam[];
}

export interface WidgetCategory {
  category: string;
  widgets: Widget[];
}

export type WidgetDashboard = WidgetCategory[];

export interface ApiError {
  message: string;
  status: number;
}

// ────────────────────────────────────────────────────────────────────────────
// v2 — provenance envelope, discriminated ResolutionResultV2, saved views,
// dashboards, pins, schedules, alerts, share tokens. Wire contract with
// backend documented in 03-interaction-contract.md.
// ────────────────────────────────────────────────────────────────────────────

export type ResultShape = 'list' | 'single' | 'aggregate' | 'chart';
export type SourceType = 'saved_view' | 'widget' | 'pattern_result' | 'dashboard';
export type CandidateSource = 'cache' | 'template' | 'synthesised' | 'saved_view';
export type VerifierVerdict =
  | 'approve'
  | 'reject'
  | 'approve_with_note'
  | 'skipped'
  | 'error';

// Backend is permissive about QueryPlan shape; we keep it unknown-ish and
// narrow in specific components that need a field.
export type QueryPlan = Record<string, unknown>;

export interface Provenance {
  candidateSource: CandidateSource;
  patternId?: string;
  patternMatchConfidence?: number;

  verifierVerdict: VerifierVerdict;
  verifierVerified: boolean;
  verifierLatencyMs?: number;
  verifierCacheHit?: boolean;
  verifierNote?: string;
  reroutedPlan?: QueryPlan;
  originalCandidate?: QueryPlan;

  synthesised: boolean;
  synthesisConfidence?: number;

  queryPlan: QueryPlan;
  generatedSql?: string;

  executionLatencyMs: number;
  adapter: string;
  skillHash: string;
  llmCostUsd: number;
  timestamp: string;
}

export interface ExecutedResult {
  result: QueryResult;
  provenance: Provenance;
  sessionId: string;
}

// ── Schedule / alert / mutation draft payloads ────────────────────────────

export type ScheduleChannel = 'email' | 'slack' | 'webhook';
export type ScheduleFormat = 'csv' | 'xlsx' | 'html_snapshot' | 'pdf';

export interface EmailChannelConfig {
  to: string[];
  cc?: string[];
}
export interface SlackChannelConfig {
  channel: string;
  webhookUrl?: string;
}
export interface WebhookChannelConfig {
  url: string;
  headers?: Record<string, string>;
}
export type ChannelConfig =
  | EmailChannelConfig
  | SlackChannelConfig
  | WebhookChannelConfig;

export interface VizConfig {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'table';
  xField?: string;
  yField?: string;
  groupBy?: string;
}

export interface ScheduleDraft {
  sourceType: 'saved_view' | 'dashboard';
  cronExpr: string;
  timezone: string;
  channel: ScheduleChannel;
  channelConfig: ChannelConfig;
  format: ScheduleFormat;
  sourceSnapshot: {
    queryPlan: QueryPlan;
    resultShape: ResultShape;
    vizConfig?: VizConfig;
    suggestedName: string;
  };
  nextRuns: string[];
}

export type CompareOp = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte';

export type AlertCondition =
  | { type: 'row_count'; operator: CompareOp; value: number }
  | { type: 'any_row_field'; field: string; operator: CompareOp; value: unknown }
  | {
      type: 'aggregate';
      aggregate: 'sum' | 'avg' | 'min' | 'max';
      field: string;
      operator: CompareOp;
      value: number;
    };

export interface AlertDraft {
  savedViewHint?: string;
  condition: AlertCondition;
  checkCron: string;
  channel: ScheduleChannel;
  channelConfig: ChannelConfig;
  sourceSnapshot: {
    queryPlan: QueryPlan;
    resultShape: ResultShape;
    suggestedName: string;
  };
}

// ── Discriminated ResolutionResult (v2 /resolve/v2) ───────────────────────

export type ResolutionResultV2 =
  | { kind: 'executed'; executed: ExecutedResult }
  | { kind: 'schedule_draft'; draft: ScheduleDraft; provenance: Provenance }
  | { kind: 'alert_draft'; draft: AlertDraft; provenance: Provenance }
  | {
      kind: 'mutation_preview';
      preview: DiffPreview;
      provenance: Provenance;
    }
  | {
      kind: 'clarification_needed';
      question: string;
      candidates: QueryPlan[];
    };

// ── Saved views ───────────────────────────────────────────────────────────

export interface SavedView {
  id: string;
  ownerUserId: string;
  name: string;
  nlInput: string;
  queryPlan: QueryPlan;
  entity: string;
  resultShape: ResultShape;
  isShared: boolean;
  patternIdHint?: string;
  skillHash: string;
  stale: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavedViewInput {
  name: string;
  nlInput: string;
  queryPlan: QueryPlan;
  entity: string;
  resultShape: ResultShape;
  isShared?: boolean;
}

export interface SavedViewPatch {
  name?: string;
  isShared?: boolean;
}

export interface SavedViewFilter {
  entity?: string;
  shared?: boolean;
}

// ── Dashboards + pins ────────────────────────────────────────────────────

export interface DashboardLayoutEntry {
  tileId: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DashboardLayout {
  grid: '12col';
  tiles: DashboardLayoutEntry[];
}

export interface Dashboard {
  id: string;
  ownerUserId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  layout: DashboardLayout;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardTile {
  id: string;
  dashboardId: string;
  sourceType: SourceType;
  sourceId: string;
  position: { x: number; y: number; w: number; h: number };
  overrides?: { title?: string; refreshIntervalSeconds?: number };
}

export interface DashboardTree {
  dashboard: Dashboard;
  tiles: DashboardTile[];
  resolvedDisplayConfigs: Record<string, DisplayConfig>;
}

export interface CreateDashboardInput {
  name: string;
  description?: string;
  layout?: DashboardLayout;
}

export interface DashboardPatch {
  name?: string;
  description?: string;
  layout?: DashboardLayout;
  isDefault?: boolean;
}

export interface CreateTileInput {
  sourceType: SourceType;
  sourceId: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  overrides?: { title?: string; refreshIntervalSeconds?: number };
}

export interface TilePatch {
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  overrides?: { title?: string; refreshIntervalSeconds?: number };
}

export interface Pin {
  id: string;
  ownerUserId: string;
  sourceType: SourceType;
  sourceId: string;
  position: number;
  createdAt: string;
}

export interface HomeComposition {
  pins: Pin[];
  defaultDashboard?: Dashboard;
  recentQueries: Array<{ input: string; at: string; sessionId?: string }>;
  upcomingSchedules: Array<{
    id: string;
    nextRunAt: string;
    sourceType: 'saved_view' | 'dashboard';
    sourceId: string;
  }>;
  activeAlertsCount: number;
}

// ── Schedules ────────────────────────────────────────────────────────────

export interface CreateScheduleInput {
  sourceType: 'saved_view' | 'dashboard';
  sourceId: string;
  cronExpr: string;
  timezone: string;
  channel: ScheduleChannel;
  channelConfig: ChannelConfig;
  format: ScheduleFormat;
}

export interface Schedule extends CreateScheduleInput {
  id: string;
  ownerUserId: string;
  enabled: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  nextRuns: string[];
  failureCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SchedulePatch {
  cronExpr?: string;
  timezone?: string;
  enabled?: boolean;
  channel?: ScheduleChannel;
  channelConfig?: ChannelConfig;
  format?: ScheduleFormat;
}

export interface DeliveryRun {
  id: string;
  scheduleId?: string;
  alertId?: string;
  startedAt: string;
  finishedAt?: string;
  status: 'running' | 'success' | 'failed';
  rowsDelivered?: number;
  latencyMs?: number;
  errorText?: string;
}

// ── Alerts ───────────────────────────────────────────────────────────────

export interface Alert {
  id: string;
  ownerUserId: string;
  savedViewId: string;
  condition: AlertCondition;
  checkCron: string;
  channel: ScheduleChannel;
  channelConfig: ChannelConfig;
  enabled: boolean;
  lastCheckAt?: string;
  lastTriggeredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlertInput {
  savedViewId: string;
  condition: AlertCondition;
  checkCron: string;
  channel: ScheduleChannel;
  channelConfig: ChannelConfig;
}

export interface CreateAlertFromNLInput {
  nlDescription: string;
  savedViewId: string;
}

export interface AlertPatch {
  condition?: AlertCondition;
  checkCron?: string;
  enabled?: boolean;
  channel?: ScheduleChannel;
  channelConfig?: ChannelConfig;
}

export interface TriggerEvent {
  id: string;
  alertId: string;
  firedAt: string;
  matchedRows: number;
  delivered: boolean;
  errorText?: string;
}

// ── Sharing ──────────────────────────────────────────────────────────────

export interface ShareToken {
  id: string;
  token: string;
  sourceType: SourceType;
  sourceId: string;
  ownerUserId: string;
  expiresAt?: string;
  maxAccessCount?: number;
  accessCount: number;
  url: string;
  embedUrl: string;
  createdAt: string;
}

export interface CreateShareTokenInput {
  sourceType: SourceType;
  sourceId: string;
  expiresInSeconds?: number;
  maxAccessCount?: number;
}

// ── Search + palette ─────────────────────────────────────────────────────

export type SearchType =
  | 'entity'
  | 'saved_view'
  | 'dashboard'
  | 'pattern'
  | 'widget';

export interface SearchResultItem {
  type: SearchType;
  id: string;
  name: string;
  score: number;
  entity?: string;
  subtitle?: string;
}

export interface SearchResponse {
  results: SearchResultItem[];
}

// ── Slash commands ───────────────────────────────────────────────────────

export interface DispatchCommandInput {
  command: string;
  args: string;
  sessionContext?: {
    sessionId?: string;
    savedViewId?: string;
  };
}

// ── Pattern propose ──────────────────────────────────────────────────────

export interface PatternProposal {
  proposalId: string;
  status: 'queued' | 'reviewed' | 'approved' | 'rejected';
}
