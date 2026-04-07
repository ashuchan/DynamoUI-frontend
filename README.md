# DynamoUI Frontend

React/TypeScript frontend for [DynamoUI](https://github.com/ashus/DynamoUI) — an LLM-powered adaptive UI framework that generates interactive interfaces from backend data models defined in `*.skill.yaml` files.

DynamoUI is **multi-tenant**: the frontend ships an auth screen (email + password, Google ID token), an admin portal for owners/admins (database connections, scaffold jobs, tenant YAML registry), and a tenant switcher in the header. See [`docs/MULTI_TENANT_PLAN.md`](docs/MULTI_TENANT_PLAN.md) and [`docs/RELEASE_NOTES_MULTI_TENANT.md`](docs/RELEASE_NOTES_MULTI_TENANT.md).

## Architecture

The frontend lives in the `frontend/` directory. It connects to the DynamoUI FastAPI backend (separate repo) via REST APIs. In development, Vite proxies `/api` → `http://localhost:8001`.

```
DynamoUI/          ← backend repo (FastAPI, port 8001)
DynamoUI-frontend/ ← this repo (React/Vite, port 3000)
  frontend/
    src/
      auth/
        AuthContext.tsx        # <AuthProvider> + useAuth hook
        tokenStorage.ts        # localStorage rehydrate + bearer-token singleton
        types.ts               # Mirrors backend/auth/models/dtos.py
      components/
        auth/
          AuthScreen.tsx       # Unified sign-in / sign-up form + Google id_token path
          ProtectedRoute.tsx   # Gate for the app shell
        dashboard/             # Widget dashboard (zero LLM calls per click)
        data-display/          # DataTable, DetailCard, CellRenderers, InlineEdit
      admin/
        AdminPortal.tsx        # Tab switcher: Connections / Scaffold / Registry
        ConnectionsPage.tsx    # List, create (modal), test, delete
        ConnectionForm.tsx     # Create-connection modal (adapter_kind dropdown)
        ScaffoldJobsPage.tsx   # Start job + poll status/progress
        RegistryPage.tsx       # Skill/enum/pattern/widget YAML editor (textarea)
        types.ts               # Mirrors backend admin DTOs
      lib/
        apiClient.ts           # Only place fetch() is called. Attaches bearer token.
        queryKeys.ts           # TanStack Query key factory
        types.ts               # Shared TypeScript interfaces
      styles/
        theme.css              # CSS custom properties (--dui-* tokens) + Tailwind
```

## Prerequisites

- Node.js 18+
- DynamoUI backend running on port 8001 ([setup instructions](https://github.com/ashus/DynamoUI))

## Local Development

```bash
cd frontend

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env if your backend runs on a different port

# Start dev server (http://localhost:3000)
npm run dev
```

The Vite dev server proxies all `/api` requests to `http://localhost:8001`, so the backend and frontend run independently with no CORS configuration needed in dev.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `/api/v1` | Backend API base URL. In dev, Vite proxies `/api` → `http://localhost:8001`. In prod, set to the full backend URL if on a different origin. |

## Production Build

```bash
cd frontend
npm run build
# Output: frontend/dist/
```

Serve `dist/` from any static file host (Nginx, S3, Vercel, etc.). Configure your server to proxy `/api/v1/*` → your deployed DynamoUI backend, or set `VITE_API_BASE_URL` to the full backend URL at build time.

## Tech Stack

- **React 18** + TypeScript
- **Vite** — build tool + dev proxy
- **TanStack Table v8** — headless tables (always server-side sort/filter/pagination)
- **TanStack Query** — all server state for the main app; the admin portal intentionally avoids React Query to keep the admin bundle lean
- **Tailwind CSS** + CSS Custom Properties (`--dui-*`) for theming
- **Lucide React** — icons

## Auth flow

1. `<App>` wraps the shell in `<AuthProvider>` → `<ProtectedRoute>` → `<AppShell>`.
2. On mount, `AuthProvider` rehydrates from `localStorage` via `tokenStorage.read()` (expired snapshots are dropped).
3. Unauthenticated users see `<AuthScreen>` — a single component with Sign In / Sign Up tabs and a collapsible Google ID token field. Phase 2 of the frontend rollout will replace the manual token paste with a Google-rendered button.
4. On success, the bearer token is stored in `localStorage` and in the `tokenStorage.getCurrentToken()` singleton. The `apiClient` reads from the singleton on every request so no prop drilling is needed.
5. `useAuth()` exposes `user`, `tenant`, `tenants`, `isAuthenticated`, `isBooting`, `error`, and the `signup` / `login` / `googleLogin` / `logout` actions.
6. The header `<TenantMenu>` shows the active tenant + role and renders a sign-out button.

## Admin portal

Visible only to members with `owner` or `admin` role (gated by `<AdminTab>`). Three tabs:

| Tab | Backend endpoints |
|---|---|
| Connections | `GET/POST/PATCH/DELETE /api/v1/admin/connections`, `POST /{id}/test` |
| Scaffold Jobs | `POST /admin/connections/{id}/scaffold`, `GET /admin/scaffold-jobs[/id]` |
| Registry | `GET/PUT/DELETE /admin/registry/{type}[/name]` (textarea editor) |

Password fields are **write-only** — the backend returns `has_password: bool` and the form never pre-fills a password input.

## Running Tests

```bash
cd frontend
npm test
```

Type-check without building:

```bash
cd frontend
npx tsc --noEmit
```
