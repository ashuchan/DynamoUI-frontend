// Auth DTOs that mirror backend/auth/models/dtos.py. Keep in lock-step.

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
}

export interface UserSummary {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
  user: UserSummary;
  tenant: TenantSummary;
  tenants: TenantSummary[];
}

export interface SignupPayload {
  email: string;
  password: string;
  display_name: string;
  tenant_name?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
