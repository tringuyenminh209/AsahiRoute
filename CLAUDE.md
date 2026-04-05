# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AsahiRoute (朝日ルート)** — A newspaper delivery route optimization system for Asahi Shimbun sales offices (ASA). It consists of:
- **Mobile PWA** for delivery workers (multilingual: JA/EN/VI/ZH/KO/NE), installable via service worker
- **Admin SPA dashboard** for store managers
- **Company dashboard** for newspaper company HQ (multi-tenant parent)
- **Python optimizer microservice** (OR-Tools + FastAPI) for TSP route optimization

## Repository Structure

```
asahi/
├── frontend/          # React/Vite SPA (mobile PWA + admin + company dashboard)
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
npm run build     # also generates dist/sw.js + dist/manifest.webmanifest (PWA)
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
php artisan serve   # localhost:8000
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

**Three application contexts** in one Vite app:
- `/company/*` — HQ dashboard, guarded by `ProtectedRoute requiredRole="company_admin"`, uses `CompanyLayout` (dark green `#0F4C35` sidebar)
- `/admin/*` — store manager dashboard, guarded by `ProtectedRoute requiredRole="admin"`, uses `AdminLayout` (dark `#1A1A1A` sidebar)
- `/mobile/*` — delivery worker PWA, guarded by `ProtectedRoute requiredRole="deliverer"`, uses `RootLayout` (bottom nav)
- `/login` → routes to `/company`, `/admin`, or `/mobile` based on `user.role`

**Role mismatch redirects** in `ProtectedRoute.tsx`: wrong-role users are redirected to their correct context root, not to login.

**State management**:
- **Zustand** (`src/stores/`) — `useAuthStore` (token + user, persisted to `localStorage` as `asahi-auth`), `useDeliveryStore`
- **React Query** — server state; stale keys like `['my-routes', date]`, `['shifts-calendar', year, month]`

**Services layer** (`src/services/`):
- `auth.service.ts` — login/logout/me/updateSettings
- `delivery.service.ts` — routes, start/log/complete delivery, SOS, location
- `admin.service.ts` — all admin + company resources; exports named service objects: `dashboardService`, `subscriberService`, `routeService`, `shiftService`, `userService`, `reportService`, `sosAlertService`, `areaService`, `auditLogService`, `searchService`, `companyService`
- `company.service.ts` — company-scoped shop management

**HTTP client** (`src/lib/api.ts`):
- Axios instance with `baseURL: import.meta.env.VITE_API_URL ?? '/api/v1'`
- Auto-attaches `Authorization: Bearer <token>` from Zustand store
- On 401 → calls `useAuthStore.logout()` and redirects to `/login`

**WebSocket** (`src/lib/echo.ts`, `src/hooks/useEcho.ts`):
- Laravel Echo + Pusher-js connecting to Soketi (port 6001)
- Auth token read directly from `localStorage` key `asahi-auth`
- `useEcho(channelName, listeners, enabled)` — subscribes to a **private** channel; events listened with `.EventName` prefix (matching Laravel's `broadcastAs()`)
- All real-time events go over `private-shop.{shopId}` channel

**PWA**: `vite-plugin-pwa` generates `sw.js` + `manifest.webmanifest` at build time. Workbox caching: NetworkFirst for `/api/v1/*`, CacheFirst for OSM map tiles + static assets. `OfflineBanner` component shows when `!navigator.onLine`.

**i18n**: `react-i18next` with 6 locale files (`ja/en/vi/zh/ko/ne`) in `src/locales/`. `LanguageContext` bridges i18n with Zustand user settings. Admin/company UI is Japanese-only (no i18n needed there).

## Design System

CSS custom properties from `frontend/src/styles/theme.css`:
- `--color-primary-500: #CC0000` — Asahi Red
- `--color-asahi-black: #1A1A1A` — headings
- Typography: Noto Serif JP (headings), Noto Sans JP (body); 8px grid spacing

UI primitives are **shadcn/ui** in `app/components/ui/` (Radix UI based). `@mui/icons-material` for icons only — never substitute MUI layout/form components.

## Backend Architecture

**Laravel 11** API-only. All routes under `/api/v1`. Authentication via **Sanctum Bearer token**.

### API surface

| Prefix | Middleware | Purpose |
|---|---|---|
| `/api/v1/auth/*` | public / `auth:sanctum` | login, logout, me, settings |
| `/api/v1/delivery/*` | `auth:sanctum`, `deliverer` | mobile delivery flow |
| `/api/v1/admin/*` | `auth:sanctum`, `admin` | store manager dashboard |
| `/api/v1/company/*` | `auth:sanctum`, `company_admin` | HQ multi-shop management |
| `/broadcasting/auth` | `web` | Echo channel authorization |

`EnsureIsDeliverer` (`deliverer` alias) allows `admin` role through — admins can call delivery endpoints.
`EnsureIsCompanyAdmin` scopes all queries to `request->user()->company_id`.

### Multi-tenancy hierarchy
```
Company → Shop (many) → User (many), Area (many), Route (many)
Route → RoutePoint (many, ordered by sequence_order) → Subscriber
Delivery (session) → DeliveryLog (one per point)
Subscriber → Suspension (date-range stops), SubscriberNewspaper
Shift → User, Route (shift_type: morning/evening/both, status: scheduled/confirmed/completed/cancelled)
```

`company_admin` users have `company_id` set and `shop_id = null`. `admin`/`deliverer` users have `shop_id` set.

### Response envelope
```json
{ "success": true, "data": {...}, "message": "OK", "meta": {...} }
```
Use `ApiResponse::success()`, `ApiResponse::error()` from `App\Http\Responses\ApiResponse`.

### Broadcast events (all on `private-shop.{shopId}`)
`DeliveryStarted`, `DeliveryPointLogged`, `DeliveryCompleted`, `DelivererStatusChanged`, `LocationUpdated`, `SosAlertCreated`

### Route optimization
`POST /api/v1/admin/routes/{route}/optimize` dispatches `OptimizeRouteJob` (Redis queue) → POSTs to Python optimizer at `config('services.optimizer.url')` (`http://optimizer:8000` in Docker, env `OPTIMIZER_URL`).

### CORS
`src/config/cors.php` allows `http://localhost:5173`. In development the Vite proxy (`/api` → `http://localhost:2009`) bypasses CORS entirely.

## Testing

Feature tests in `src/tests/Feature/`:
- `AuthTest.php` — 8 tests: login, me, logout, settings
- `DeliveryFlowTest.php` — 7 tests: my-routes, start, log-point, complete
- `AdminApiTest.php` — 21 tests: areas, subscribers, users, suspensions, dashboard, reports, audit logs
- `BroadcastTest.php` — 9 tests: event dispatch, channel names, auth endpoint
- `CompanyAdminTest.php` — 11 tests: company dashboard, shop CRUD, cross-company scoping
- `ShiftTest.php` — 10 tests: shift list/filter/create/update/cancel/calendar

**Test setup rules**:
- All feature tests use `RefreshDatabase` against the real MySQL test DB (not SQLite)
- `Shop::create()` requires `address` and `phone` (both NOT NULL)
- `/broadcasting/auth` uses `web` middleware — use `actingAs($user, 'sanctum')` not `withToken()` in channel auth tests
- `Shift.shift_date` serializes as a full UTC timestamp in JSON responses (JST offset) — assert via `assertDatabaseHas` not `assertJsonPath` for date fields
- Use `Event::fake()` to test broadcast dispatch without a real Soketi connection

## Key Design Decisions

- Single Vite app serves mobile PWA, admin SPA, and company SPA — not separate deployments
- Maps: React Leaflet + OpenStreetMap (no Google Maps). `RouteMap.tsx` uses real Leaflet with custom `L.divIcon` markers; subscriber `address_detail` parsed to extract apartment building name + room number (shown as large amber badge)
- No JWT — Sanctum Bearer token flow only
- `cal_days_in_month()` (PHP `ext-calendar`) is NOT available in Docker — always use `Carbon::createFromDate($y, $m, 1)->endOfMonth()->toDateString()` instead
- Photo uploads currently use local `public` disk (`storage/app/public/subscribers/{id}/`); S3 integration deferred to Phase 5
- Dark mode CSS variables exist; auto dark mode (3:00–6:00 AM) not yet implemented

## Seed Data

Real-world seed data for 朝日新聞サービスアンカー 西淀川 (34.7144, 135.4559):
- Company: `hq@asa-osaka-west.jp` / `password` (company_admin)
- Store admin: `admin@asa-nzg.jp` / `password` (admin, 西淀川)
- Deliverers: `matsuda@asa-nzg.jp`, `nguyen@asa-nzg.jp`, `li.wei@asa-nzg.jp`
- Second store: `admin@asa-kbn.jp` / `password` (admin, 此花)
- 20 realistic subscriber points in 野里２丁目 (some with mansion room numbers)
