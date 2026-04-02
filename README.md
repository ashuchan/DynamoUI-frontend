# DynamoUI Frontend

React/TypeScript frontend for [DynamoUI](https://github.com/ashus/DynamoUI) — an LLM-powered adaptive UI framework that generates interactive interfaces from backend data models defined in `*.skill.yaml` files.

## Architecture

The frontend lives in the `frontend/` directory. It connects to the DynamoUI FastAPI backend (separate repo) via REST APIs. In development, Vite proxies `/api` → `http://localhost:8001`.

```
DynamoUI/          ← backend repo (FastAPI, port 8001)
DynamoUI-frontend/ ← this repo (React/Vite, port 3000)
  frontend/
    src/
      components/
        dashboard/       # Widget dashboard (zero LLM calls per click)
        data-display/    # DataTable, DetailCard, CellRenderers, InlineEdit
      lib/
        apiClient.ts     # Only place fetch() is called
        queryKeys.ts     # TanStack Query key factory
        types.ts         # Shared TypeScript interfaces
      styles/
        theme.css        # CSS custom properties (--dui-* tokens) + Tailwind
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
- **TanStack Query** — all server state, mutations with cache invalidation
- **Tailwind CSS** + CSS Custom Properties (`--dui-*`) for theming
- **Lucide React** — icons

## Running Tests

```bash
cd frontend
npm test
```
