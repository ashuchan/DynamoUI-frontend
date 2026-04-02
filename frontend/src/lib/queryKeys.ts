import type { Sort, Filters } from './types';

export const queryKeys = {
  entityList: (entity: string, sort?: Sort, page?: number, filters?: Filters) =>
    ['entityList', entity, sort, page, filters],
  singleRecord: (entity: string, pk: string) =>
    ['singleRecord', entity, pk],
  displayConfig: (entity: string) =>
    ['displayConfig', entity],
  fieldMeta: (entity: string) =>
    ['fieldMeta', entity],
  mutationDefs: (entity: string) =>
    ['mutationDefs', entity],
  enumOptions: (enumName: string) =>
    ['enumOptions', enumName],
  widgetsDashboard: () => ['widgetsDashboard'],
} as const;
