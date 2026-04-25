import type {
  Sort,
  Filters,
  SavedViewFilter,
  SourceType,
  SearchType,
} from './types';

export const queryKeys = {
  // ── Phase 1 (existing) ──
  entityList: (entity: string, sort?: Sort, page?: number, filters?: Filters) =>
    ['entityList', entity, sort, page, filters] as const,
  singleRecord: (entity: string, pk: string) =>
    ['singleRecord', entity, pk] as const,
  displayConfig: (entity: string) => ['displayConfig', entity] as const,
  fieldMeta: (entity: string) => ['fieldMeta', entity] as const,
  mutationDefs: (entity: string) => ['mutationDefs', entity] as const,
  enumOptions: (enumName: string) => ['enumOptions', enumName] as const,
  widgetsDashboard: () => ['widgetsDashboard'] as const,

  // ── v2 — personal workspace ──
  savedViewList: (filter?: SavedViewFilter) => ['savedViewList', filter] as const,
  savedView: (id: string) => ['savedView', id] as const,
  savedViewExecute: (id: string) => ['savedViewExecute', id] as const,

  dashboardList: () => ['dashboardList'] as const,
  dashboard: (id: string) => ['dashboard', id] as const,
  dashboardTile: (dashId: string, tileId: string, version: number) =>
    ['dashboardTile', dashId, tileId, version] as const,

  home: () => ['home'] as const,
  pins: () => ['pins'] as const,

  schedules: () => ['schedules'] as const,
  schedule: (id: string) => ['schedule', id] as const,
  scheduleRuns: (id: string) => ['scheduleRuns', id] as const,

  alerts: () => ['alerts'] as const,
  alert: (id: string) => ['alert', id] as const,
  alertTriggers: (id: string) => ['alertTriggers', id] as const,

  search: (q: string, types?: SearchType[]) => ['search', q, types] as const,

  shareTokens: (sourceType: SourceType, sourceId: string) =>
    ['shareTokens', sourceType, sourceId] as const,
  sharedContent: (token: string) => ['sharedContent', token] as const,
} as const;
