# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AsahiRoute (朝日ルート)** — A newspaper delivery route optimization system for Asahi Shimbun sales offices (ASA). It consists of:
- **Mobile PWA** for delivery workers (multilingual: JA/EN/VI/ZH/KO/NE)
- **Admin SPA dashboard** for store managers
- **Python optimizer microservice** (OR-Tools + FastAPI) for TSP route optimization

## Repository Structure

```
asahi/
├── frontend/          # React/Vite SPA (mobile PWA + admin dashboard)
├── src/               # Laravel 11 backend API
├── optimizer/         # Python FastAPI microservice (OR-Tools TSP)
├── docs/              # Architecture & design specs
├── docker/            # MySQL, Nginx, PHP configs
└── docker-compose.yml # app:2009, mysql:23306, redis:26379, soketi:6001, optimizer:8100
```

## Development Commands

### Frontend
```bash
cd frontend
npm install
npm run dev       # http://localhost:5173 (proxies /api → localhost:2009)
npm run build
```

### Backend (Docker — recommended)
```bash
docker-compose up -d
docker-compose exec app php artisan migrate:fresh --seed
docker-compose exec app php artisan test
docker-compose exec app php artisan test --filter TestClassName
docker-compose exec app ./vendor/bin/pint   # PHP lint
```

### Backend (local)
```bash
cd src
composer install
php artisan serve                 # localhost:8000
php artisan test
php artisan test --filter AuthTest
./vendor/bin/pint
```

### Optimizer
```bash
cd optimizer
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# GET /health, POST /optimize
```

## Frontend Architecture

**Entry**: `frontend/src/main.tsx` → `App.tsx` → React Router via `app/routes.tsx`

**Two application contexts** in one Vite app:
- `/mobile/*` — delivery worker PWA, guarded by `ProtectedRoute requiredRole="deliverer"`, uses `RootLayout` (bottom nav)
- `/admin/*` — manager dashboard, guarded by `ProtectedRoute requiredRole="admin"`, uses `AdminLayout` (sidebar)
- `/login` — deliverer login (navigates to `/admin` if `role === 'admin'`, else `/mobile` or `/onboarding`)
- `/admin/login` — admin-specific login (`AdminLogin.tsx`)

**State management**:
- **Zustand** (`src/stores/`) — `useAuthStore` (token + user, persisted to `localStorage` as `asahi-auth`), `useDeliveryStore`
- **React Query** — server state; queries use keys like `['my-routes', date]`, `['admin-subscribers', params]`

**Services layer** (`src/services/`):
- `auth.service.ts` — login/logout/me/updateSettings
- `delivery.service.ts` — routes, start/log/complete delivery, SOS, location
- `admin.service.ts` — all admin resources (dashboard, subscribers, routes, users, etc.)

**HTTP client** (`src/lib/api.ts`):
- Axios instance with `baseURL: import.meta.env.VITE_API_URL ?? '/api/v1'`
- Auto-attaches `Authorization: Bearer <token>` from Zustand store
- On 401 → calls `useAuthStore.logout()` and redirects to `/login`

**WebSocket** (`src/lib/echo.ts`, `src/hooks/useEcho.ts`):
- Laravel Echo + Pusher-js connecting to Soketi (port 6001)
- Auth token read directly from `localStorage` key `asahi-auth`
- `useEcho(channelName, listeners, enabled)` — subscribes to a **private** channel; events are listened with `.EventName` prefix (matching Laravel's `broadcastAs()`)
- All real-time events go over `private-shop.{shopId}` channel

**i18n**: `react-i18next` with locale files in `src/locales/`. `LanguageContext` bridges i18n with the Zustand user settings.

## Design System

Styles use CSS custom properties from `frontend/src/styles/theme.css`:
- `--color-primary-500: #CC0000` — Asahi Red
- `--color-asahi-black: #1A1A1A` — headings
- Typography: Noto Serif JP (headings), Noto Sans JP (body); 8px grid spacing

UI primitives are **shadcn/ui** in `app/components/ui/` (Radix UI based). Do not substitute MUI components — `@mui/icons-material` is used for icons only.

## Backend Architecture

**Laravel 11** API-only. All routes under `/api/v1`. Authentication via **Sanctum Bearer token** (not session cookies).

### API surface (all implemented)

| Prefix | Middleware | Purpose |
|---|---|---|
| `/api/v1/auth/*` | public / `auth:sanctum` | login, logout, me, settings |
| `/api/v1/delivery/*` | `auth:sanctum`, `deliverer` | mobile delivery flow |
| `/api/v1/admin/*` | `auth:sanctum`, `admin` | management dashboard |
| `/broadcasting/auth` | `web` | Echo channel authorization |

**Important middleware note**: `EnsureIsDeliverer` (`deliverer` alias) explicitly allows `admin` role users through, so admins can also call delivery endpoints.

### Response envelope
All responses follow:
```json
{ "success": true, "data": {...}, "message": "OK", "meta": {...} }
```
Errors: `{ "success": false, "error": { "code": "...", "message": "..." } }`
Use `ApiResponse::success()`, `ApiResponse::error()`, etc. from `App\Http\Responses\ApiResponse`.

### Key models and relationships
```
Shop → User (many), Area (many), Route (many)
Route → RoutePoint (many, ordered by sequence_order) → Subscriber
Delivery (session) → DeliveryLog (one per point)
Subscriber → Suspension (date-range stops), SubscriberNewspaper (newspapers delivered)
```

### Broadcast events (all on `private-shop.{shopId}`)
`DeliveryStarted`, `DeliveryPointLogged`, `DeliveryCompleted`, `DelivererStatusChanged`, `LocationUpdated`, `SosAlertCreated`

### Route optimization
`POST /api/v1/admin/routes/{route}/optimize` dispatches `OptimizeRouteJob` (Redis queue) which POSTs to the Python optimizer at `config('services.optimizer.url')` (`http://optimizer:8000` in Docker, env `OPTIMIZER_URL`).

### CORS
`src/config/cors.php` allows `http://localhost:5173`. `HandleCors` registered globally in `bootstrap/app.php`. In development the Vite proxy (`/api` → `http://localhost:2009`) means CORS is not hit at all.

## Testing

Feature tests in `src/tests/Feature/`:
- `AuthTest.php` — 8 tests: login, me, logout, settings
- `DeliveryFlowTest.php` — 7 tests: my-routes, start, log-point, complete
- `AdminApiTest.php` — 21 tests: areas, subscribers, users, suspensions, dashboard, reports, audit logs
- `BroadcastTest.php` — 9 tests: event dispatch, channel names, auth endpoint

**Test setup rules**:
- All feature tests use `RefreshDatabase` against the real MySQL test DB (not SQLite)
- `Shop::create()` requires `address` and `phone` (both NOT NULL in schema)
- `/broadcasting/auth` uses `web` middleware — use `actingAs($user, 'sanctum')` not `withToken()` in channel auth tests
- Use `Event::fake()` to test broadcast dispatch without a real Soketi connection

## Key Design Decisions

- Single Vite app serves both mobile PWA and admin SPA — not separate deployments
- Maps: React Leaflet + OpenStreetMap (no Google Maps dependency)
- No JWT — Sanctum SPA token flow only
- `cal_days_in_month()` (PHP `ext-calendar`) is not available in Docker — use `Carbon::createFromDate($y, $m, 1)->endOfMonth()->toDateString()` instead
- Offline support (Dexie.js/IndexedDB) is planned but not implemented
- Dark mode CSS variables exist; auto-scheduling (3:00–6:00 AM dark mode) not yet implemented
