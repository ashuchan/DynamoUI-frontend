// Mirrors backend/tenants/connections/dtos.py and
// backend/tenants/scaffold/dtos.py.

export type ConnectionStatus = 'untested' | 'ok' | 'error' | 'unsupported';

export interface ConnectionRead {
  id: string;
  tenant_id: string;
  name: string;
  adapter_kind: string;
  host: string | null;
  port: number | null;
  database: string | null;
  username: string | null;
  has_password: boolean;
  options: Record<string, unknown>;
  status: ConnectionStatus;
  last_tested_at: string | null;
  last_test_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConnectionCreatePayload {
  name: string;
  adapter_kind: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  options?: Record<string, unknown>;
}

export type ConnectionUpdatePayload = Partial<ConnectionCreatePayload>;

export interface ConnectionTestResult {
  ok: boolean;
  status: ConnectionStatus;
  error: string | null;
  tested_at: string;
}

export type ScaffoldStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface ScaffoldJob {
  id: string;
  tenant_id: string;
  connection_id: string;
  status: ScaffoldStatus;
  progress: number;
  result_summary: Record<string, unknown> | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export type RegistryResourceType = 'skill' | 'enum' | 'pattern' | 'widget';

export interface RegistryEntrySummary {
  id: string;
  name: string;
  checksum: string;
  updated_at: string;
}

export interface RegistryEntryRead {
  id: string;
  tenant_id: string;
  resource_type: RegistryResourceType;
  name: string;
  yaml_source: string;
  parsed_json: Record<string, unknown>;
  checksum: string;
  created_at: string;
  updated_at: string;
}
