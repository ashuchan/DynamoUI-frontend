export interface FieldMeta {
  name: string;
  type: 'string' | 'integer' | 'float' | 'boolean' | 'date' | 'uuid' | 'enum' | 'json';
  label: string;
  isPK: boolean;
  nullable: boolean;
  sensitive: boolean;
  enumRef?: string;
  fkTarget?: { entity: string; field: string };
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
  name: string;
  label: string;
  operation: 'create' | 'update' | 'delete';
  fields: string[];
  confirmationRequired: boolean;
}

export interface MutationPlan {
  entity: string;
  operation: 'create' | 'update' | 'delete';
  pk?: string;
  data: Record<string, unknown>;
}

export interface DiffPreview {
  entity: string;
  pk?: string;
  operation: string;
  changes: Array<{ field: string; oldValue: unknown; newValue: unknown }>;
}

export interface MutationResult {
  success: boolean;
  pk: string;
  message: string;
}

export interface ResolutionResult {
  intent: 'READ' | 'MUTATE' | 'VISUALIZE' | 'NAVIGATE';
  entity?: string;
  confidence: number;
  queryPlan?: QueryParams;
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
  defaultValue?: unknown;
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
