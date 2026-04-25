// Canvas wire types — mirror backend/canvas/models/intent.py and api/schemas.py.
// Drift here breaks the wire contract; if the backend changes a field, this
// file changes too. Keep enum string values 1:1 with the Python enums.

export type Domain =
  | 'fintech'
  | 'logistics'
  | 'hr'
  | 'saas_b2b'
  | 'healthcare'
  | 'ecommerce'
  | 'legal'
  | 'education'
  | 'manufacturing'
  | 'generic';

export type AestheticMood =
  | 'enterprise'
  | 'functional'
  | 'modern_saas'
  | 'friendly'
  | 'clinical'
  | 'bold_consumer';

export type OperationProfile =
  | 'read_heavy'
  | 'write_heavy'
  | 'review_audit'
  | 'mixed';

export type DensityPreference = 'compact' | 'standard' | 'comfortable';

export type LayoutArchetype =
  | 'dashboard'
  | 'data_entry'
  | 'review_audit'
  | 'kanban'
  | 'timeline';

export type ConversationState = 'eliciting' | 'confirming' | 'complete';

export type NavStyle = 'sidebar' | 'top_nav';

export type ColumnPriority = 'high' | 'medium' | 'low';

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

export interface CanvasMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface CanvasSession {
  session_id: string;
  state: ConversationState;
  messages: CanvasMessage[];
  partial_intent: Partial<CanvasIntent>;
}

export interface CreateSessionResponse {
  session_id: string;
}

export interface MessageResponse {
  reply: string;
  intent_update: Partial<CanvasIntent> | null;
  session_state: ConversationState;
}

export interface IntentEnvelope {
  intent: Partial<CanvasIntent>;
  state: ConversationState;
}

export interface PreviewField {
  name: string;
  label: string;
  display_hint: string;
  column_priority: ColumnPriority;
  is_status: boolean;
  is_monetary: boolean;
}

export interface PreviewData {
  entity: string;
  fields: PreviewField[];
  rows: Record<string, unknown>[];
  archetype: LayoutArchetype;
  theme_css: string;
  nav_style: NavStyle;
  metric_fields: string[];
}

export interface GenerateResponse {
  status: 'ok';
  files: string[];
  artifacts_url: string;
}
