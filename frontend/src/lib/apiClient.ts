import type {
  ResolutionResult,
  ResolutionResultV2,
  ExecutedResult,
  QueryResult,
  DisplayConfig,
  FieldMeta,
  MutationDef,
  EnumOptions,
  DiffPreview,
  MutationResult,
  MutationPlan,
  QueryParams,
  WidgetDashboard,
  SavedView,
  SavedViewFilter,
  CreateSavedViewInput,
  SavedViewPatch,
  Dashboard,
  DashboardTree,
  CreateDashboardInput,
  DashboardPatch,
  DashboardTile,
  CreateTileInput,
  TilePatch,
  Pin,
  HomeComposition,
  Schedule,
  CreateScheduleInput,
  SchedulePatch,
  DeliveryRun,
  Alert,
  CreateAlertInput,
  CreateAlertFromNLInput,
  AlertPatch,
  TriggerEvent,
  ShareToken,
  CreateShareTokenInput,
  SearchResponse,
  SearchType,
  DispatchCommandInput,
  QueryPlan,
  PatternProposal,
  SourceType,
} from './types';
import type {
  AuthResponse,
  LoginPayload,
  MeResponse,
  SignupPayload,
} from '../auth/types';
import type {
  ConnectionCreatePayload,
  ConnectionRead,
  ConnectionTestResult,
  ConnectionUpdatePayload,
  RegistryEntryRead,
  RegistryEntrySummary,
  RegistryResourceType,
  ScaffoldJob,
} from '../admin/types';
import { getCurrentToken } from '../auth/tokenStorage';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

// ── Error envelope per contract §4.1 ────────────────────────────────────────
// Backend returns either the v2 shape { error: { code, message, details, traceId } }
// or the legacy FastAPI { detail: "..." } shape. We accept both and surface
// the structured fields when available so the UI can branch on `code`.
export interface ApiErrorDetails {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  traceId?: string;
}

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: Record<string, unknown>;
  public readonly traceId?: string;

  constructor(status: number, message: string, extra?: Partial<ApiErrorDetails>) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = extra?.code;
    this.details = extra?.details;
    this.traceId = extra?.traceId;
  }
}

async function parseError(response: Response): Promise<ApiClientError> {
  let message = `HTTP ${response.status}: ${response.statusText}`;
  let code: string | undefined;
  let details: Record<string, unknown> | undefined;
  let traceId: string | undefined;
  try {
    const body = await response.json();
    if (body?.error && typeof body.error === 'object') {
      // v2 envelope
      message = body.error.message ?? message;
      code = body.error.code;
      details = body.error.details;
      traceId = body.error.traceId;
    } else {
      // legacy FastAPI style: { detail: "..." }
      message = body?.detail ?? body?.message ?? message;
    }
  } catch {
    // body wasn't JSON — keep default message
  }
  return new ApiClientError(response.status, message, { code, message, details, traceId });
}

// Exported so peer clients (e.g. canvasClient) can reuse the auth/error
// envelope handling without duplicating fetch logic. The path is prepended
// with API_BASE — see canvasClient.ts for an absolute-path variant.
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const token = getCurrentToken();
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) throw await parseError(response);

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

// Absolute-path variant: prepends nothing. Used by Canvas to point at a
// different base (`VITE_CANVAS_API_BASE`). Auth and error envelope logic
// stay identical to apiFetch.
export async function apiFetchAbsolute<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getCurrentToken();
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

async function apiDelete(path: string): Promise<void> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: {
      ...(getCurrentToken() ? { Authorization: `Bearer ${getCurrentToken()}` } : {}),
    },
  });
  if (!response.ok) throw await parseError(response);
}

function toQueryString(params: QueryParams): string {
  const parts: string[] = [];

  if (params.sort) {
    parts.push(`sort_by=${encodeURIComponent(params.sort.field)}`);
    parts.push(`sort_dir=${encodeURIComponent(params.sort.direction)}`);
  }

  if (params.page !== undefined) {
    parts.push(`page=${params.page}`);
  }

  if (params.pageSize !== undefined) {
    parts.push(`page_size=${params.pageSize}`);
  }

  if (params.filters) {
    for (const [field, filter] of Object.entries(params.filters)) {
      parts.push(
        `filter_${encodeURIComponent(field)}=${encodeURIComponent(
          String(filter.value),
        )}&filter_${encodeURIComponent(field)}_op=${encodeURIComponent(filter.op)}`,
      );
    }
  }

  return parts.join('&');
}

function buildQuery(
  params: Record<string, unknown> | object | undefined,
): string {
  if (!params) return '';
  const pairs: string[] = [];
  for (const [k, v] of Object.entries(params as Record<string, unknown>)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      for (const item of v) pairs.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(item))}`);
    } else {
      pairs.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    }
  }
  return pairs.length ? `?${pairs.join('&')}` : '';
}

export const apiClient = {
  // ---- Auth ----
  authSignup: (payload: SignupPayload) =>
    apiFetch<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  authLogin: (payload: LoginPayload) =>
    apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  authGoogle: (idToken: string) =>
    apiFetch<AuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ id_token: idToken }),
    }),

  authMe: () => apiFetch<MeResponse>('/auth/me'),

  // ---- Admin: connections ----
  listConnections: () => apiFetch<ConnectionRead[]>('/admin/connections'),

  createConnection: (payload: ConnectionCreatePayload) =>
    apiFetch<ConnectionRead>('/admin/connections', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateConnection: (id: string, payload: ConnectionUpdatePayload) =>
    apiFetch<ConnectionRead>(`/admin/connections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteConnection: (id: string) => apiDelete(`/admin/connections/${id}`),

  testConnection: (id: string) =>
    apiFetch<ConnectionTestResult>(`/admin/connections/${id}/test`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),

  // ---- Admin: scaffold jobs ----
  startScaffold: (connectionId: string, payload: { schema_filter?: string; table_filter?: string[] }) =>
    apiFetch<ScaffoldJob>(`/admin/connections/${connectionId}/scaffold`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  listScaffoldJobs: () => apiFetch<ScaffoldJob[]>('/admin/scaffold-jobs'),

  getScaffoldJob: (jobId: string) => apiFetch<ScaffoldJob>(`/admin/scaffold-jobs/${jobId}`),

  // ---- Admin: tenant YAML registry ----
  listRegistryEntries: (resourceType: RegistryResourceType) =>
    apiFetch<RegistryEntrySummary[]>(`/admin/registry/${resourceType}`),

  getRegistryEntry: (resourceType: RegistryResourceType, name: string) =>
    apiFetch<RegistryEntryRead>(`/admin/registry/${resourceType}/${encodeURIComponent(name)}`),

  upsertRegistryEntry: (resourceType: RegistryResourceType, name: string, yamlSource: string) =>
    apiFetch<RegistryEntryRead>(`/admin/registry/${resourceType}/${encodeURIComponent(name)}`, {
      method: 'PUT',
      body: JSON.stringify({ name, yaml_source: yamlSource }),
    }),

  deleteRegistryEntry: (resourceType: RegistryResourceType, name: string) =>
    apiDelete(`/admin/registry/${resourceType}/${encodeURIComponent(name)}`),

  // ---- Resolution (legacy — still used by old LandingPage until cutover) ----
  resolve: (input: string) =>
    apiFetch<ResolutionResult>('/resolve', {
      method: 'POST',
      body: JSON.stringify({ input }),
    }),

  // ---- Resolution v2 (provenance envelope, discriminated union) ----
  resolveV2: (input: string, sessionContext?: Record<string, unknown>) =>
    apiFetch<ResolutionResultV2>('/resolve/v2', {
      method: 'POST',
      body: JSON.stringify({ input, sessionContext }),
    }),

  editAsNL: (queryPlan: QueryPlan) =>
    apiFetch<{ nlInput: string }>('/resolve/edit', {
      method: 'POST',
      body: JSON.stringify({ queryPlan }),
    }),

  dispatchCommand: (body: DispatchCommandInput) =>
    apiFetch<ResolutionResultV2>('/commands/dispatch', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  search: (q: string, types?: SearchType[], limit?: number) =>
    apiFetch<SearchResponse>(
      `/search${buildQuery({ q, types, limit })}`,
    ),

  // ---- Entities + schema ----
  fetchEntityList: (entity: string, params: QueryParams) =>
    apiFetch<QueryResult>(`/entities/${entity}?${toQueryString(params)}`),

  fetchSingleRecord: (entity: string, pk: string) =>
    apiFetch<Record<string, unknown>>(`/entities/${entity}/${pk}`),

  fetchDisplayConfig: (entity: string) =>
    apiFetch<DisplayConfig>(`/schema/${entity}/display`),

  fetchFieldMeta: (entity: string) =>
    apiFetch<FieldMeta[]>(`/schema/${entity}/fields`),

  fetchMutationDefs: (entity: string) =>
    apiFetch<MutationDef[]>(`/schema/${entity}/mutations`),

  fetchEnumOptions: (enumName: string) =>
    apiFetch<EnumOptions>(`/enums/${enumName}/options`),

  previewMutation: (plan: MutationPlan) =>
    apiFetch<DiffPreview>('/mutate/preview', {
      method: 'POST',
      body: JSON.stringify(plan),
    }),

  executeMutation: (plan: MutationPlan) =>
    apiFetch<MutationResult>('/mutate/execute', {
      method: 'POST',
      body: JSON.stringify(plan),
    }),

  fetchWidgetsDashboard: () =>
    apiFetch<WidgetDashboard>('/widgets/dashboard'),

  executeWidget: (widgetId: string, params: Record<string, unknown>) =>
    apiFetch<{ rows: Record<string, unknown>[]; totalCount: number }>(`/widgets/${widgetId}/execute`, {
      method: 'POST',
      body: JSON.stringify({ params }),
    }),

  // ---- Saved views ----
  listSavedViews: (filter?: SavedViewFilter) =>
    apiFetch<SavedView[]>(`/views${buildQuery(filter)}`),

  createSavedView: (body: CreateSavedViewInput) =>
    apiFetch<SavedView>('/views', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getSavedView: (id: string) => apiFetch<SavedView>(`/views/${id}`),

  updateSavedView: (id: string, patch: SavedViewPatch) =>
    apiFetch<SavedView>(`/views/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  deleteSavedView: (id: string) => apiDelete(`/views/${id}`),

  executeSavedView: (id: string) =>
    apiFetch<ExecutedResult>(`/views/${id}/execute`, { method: 'POST' }),

  // ---- Dashboards ----
  listDashboards: () => apiFetch<Dashboard[]>('/dashboards'),

  createDashboard: (body: CreateDashboardInput) =>
    apiFetch<Dashboard>('/dashboards', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getDashboard: (id: string) =>
    apiFetch<DashboardTree>(`/dashboards/${id}`),

  updateDashboard: (id: string, patch: DashboardPatch) =>
    apiFetch<Dashboard>(`/dashboards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  deleteDashboard: (id: string) => apiDelete(`/dashboards/${id}`),

  addTile: (dashboardId: string, tile: CreateTileInput) =>
    apiFetch<DashboardTile>(`/dashboards/${dashboardId}/tiles`, {
      method: 'POST',
      body: JSON.stringify(tile),
    }),

  updateTile: (dashboardId: string, tileId: string, patch: TilePatch) =>
    apiFetch<DashboardTile>(`/dashboards/${dashboardId}/tiles/${tileId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  removeTile: (dashboardId: string, tileId: string) =>
    apiDelete(`/dashboards/${dashboardId}/tiles/${tileId}`),

  // ---- Home + pins ----
  getHome: () => apiFetch<HomeComposition>('/home'),

  listPins: () => apiFetch<Pin[]>('/pins'),

  createPin: (body: { sourceType: SourceType; sourceId: string }) =>
    apiFetch<Pin>('/pins', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  deletePin: (id: string) => apiDelete(`/pins/${id}`),

  // ---- Schedules ----
  listSchedules: () => apiFetch<Schedule[]>('/schedules'),

  createSchedule: (body: CreateScheduleInput) =>
    apiFetch<Schedule>('/schedules', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getSchedule: (id: string) => apiFetch<Schedule>(`/schedules/${id}`),

  updateSchedule: (id: string, patch: SchedulePatch) =>
    apiFetch<Schedule>(`/schedules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  deleteSchedule: (id: string) => apiDelete(`/schedules/${id}`),

  testSchedule: (id: string) =>
    apiFetch<DeliveryRun>(`/schedules/${id}/test`, { method: 'POST' }),

  listScheduleRuns: (id: string, opts?: { limit?: number; before?: string }) =>
    apiFetch<{ runs: DeliveryRun[]; nextCursor?: string }>(
      `/schedules/${id}/runs${buildQuery(opts)}`,
    ),

  // ---- Alerts ----
  listAlerts: () => apiFetch<Alert[]>('/alerts'),

  createAlert: (body: CreateAlertInput | CreateAlertFromNLInput) =>
    apiFetch<Alert>('/alerts', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getAlert: (id: string) => apiFetch<Alert>(`/alerts/${id}`),

  updateAlert: (id: string, patch: AlertPatch) =>
    apiFetch<Alert>(`/alerts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  deleteAlert: (id: string) => apiDelete(`/alerts/${id}`),

  listAlertTriggers: (id: string, opts?: { limit?: number; before?: string }) =>
    apiFetch<{ triggers: TriggerEvent[]; nextCursor?: string }>(
      `/alerts/${id}/triggers${buildQuery(opts)}`,
    ),

  // ---- Patterns (propose) ----
  proposePattern: (queryPlan: QueryPlan, userInput: string) =>
    apiFetch<PatternProposal>('/patterns/propose', {
      method: 'POST',
      body: JSON.stringify({ queryPlan, userInput }),
    }),

  // ---- Sharing ----
  createShareToken: (body: CreateShareTokenInput) =>
    apiFetch<ShareToken>('/share-tokens', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  listShareTokens: (sourceType: SourceType, sourceId: string) =>
    apiFetch<ShareToken[]>(
      `/share-tokens${buildQuery({ sourceType, sourceId })}`,
    ),

  revokeShareToken: (id: string) => apiDelete(`/share-tokens/${id}`),

  getSharedContent: (token: string) =>
    apiFetch<ExecutedResult>(`/shared/${encodeURIComponent(token)}`),
};
