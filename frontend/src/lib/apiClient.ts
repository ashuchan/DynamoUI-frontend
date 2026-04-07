import type {
  ResolutionResult,
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
} from './types';
import type {
  AuthResponse,
  LoginPayload,
  SignupPayload,
} from '../auth/types';
import type {
  ConnectionCreatePayload,
  ConnectionRead,
  ConnectionTestResult,
  ConnectionUpdatePayload,
  ScaffoldJob,
} from '../admin/types';
import { getCurrentToken } from '../auth/tokenStorage';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const token = getCurrentToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const body = await response.json();
      message = body.detail ?? body.message ?? message;
    } catch {
      // ignore parse errors on error bodies
    }
    throw new ApiClientError(response.status, message);
  }

  return response.json() as Promise<T>;
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

  authMe: () => apiFetch<AuthResponse>('/auth/me'),

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

  deleteConnection: (id: string) =>
    fetch(`${API_BASE}/admin/connections/${id}`, {
      method: 'DELETE',
      headers: {
        ...(getCurrentToken() ? { Authorization: `Bearer ${getCurrentToken()}` } : {}),
      },
    }).then((r) => {
      if (!r.ok) throw new ApiClientError(r.status, `delete failed: ${r.status}`);
    }),

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

  resolve: (input: string) =>
    apiFetch<ResolutionResult>('/resolve', {
      method: 'POST',
      body: JSON.stringify({ input }),
    }),

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
};
