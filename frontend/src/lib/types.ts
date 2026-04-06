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

export interface ResolutionResult {
  intent: 'READ' | 'MUTATE' | 'VISUALIZE' | 'NAVIGATE';
  entity?: string;
  confidence: number;
  query_plan?: ResolvedData | null;
  patternMatch?: { patternId: string; confidence: number; matchedTrigger: string };
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
