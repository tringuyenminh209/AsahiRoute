# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AsahiRoute (朝日ルート)** — A newspaper delivery route optimization system for Asahi Shimbun sales offices (ASA). It consists of:
- **Mobile PWA** for delivery workers (multilingual: JA/EN/VI/ZH/KO/NE)
- **Admin SPA dashboard** for store managers

The project is currently in UI-complete / backend-pending stage. All frontend screens are scaffolded with mock data; backend API integration is the next major phase.

## Repository Structure

```
asahi/
├── frontend/          # React/Vite frontend (primary active work)
├── src/               # Laravel 11 backend (skeleton only, routes mostly empty)
├── docs/              # Architecture & design specs (read these for context)
├── docker/            # MySQL, Nginx, PHP configs
└── docker-compose.yml # Full stack: app, nginx, mysql:23306, redis:26379
```

## Development Commands

### Frontend (primary)
```bash
cd frontend
npm install       # or pnpm install
npm run dev       # http://localhost:5173
npm run build
```

### Backend (Docker)
```bash
docker-compose up -d        # Start all services (nginx at :2009, mysql at :23306)
docker-compose exec app php artisan migrate
docker-compose exec app php artisan db:seed
```

### Backend (local, without Docker)
```bash
cd src
composer install
php artisan serve   # or: composer run dev (starts server + queue + logs + vite together)
php artisan test                          # run all tests
php artisan test --filter TestClassName   # run single test
./vendor/bin/pint                         # lint PHP (Laravel Pint)
```

## Frontend Architecture

**Entry**: `frontend/src/main.tsx` → `App.tsx` → React Router via `routes.tsx`

**Two distinct application contexts** sharing the same React app:
- `/mobile/*` — delivery worker app, uses `RootLayout` with bottom navigation
- `/admin/*` — manager dashboard, uses `AdminLayout` with sidebar navigation
- `/`, `/login`, `/admin/login`, `/onboarding` — standalone pages

**Directory layout**:
```
frontend/src/
├── app/
│   ├── pages/          # Mobile screens (Home, RouteMap, RouteList, SOS, etc.)
│   ├── pages/admin/    # Admin screens (Dashboard, SubscriberManagement, LiveTracking, etc.)
│   ├── layouts/        # RootLayout (mobile), AdminLayout (admin)
│   ├── components/     # Shared components (SOSButton, DraggableRoutePoint, etc.)
│   ├── components/ui/  # shadcn/ui primitives (Button, Card, Dialog, etc.)
│   ├── contexts/       # LanguageContext (6-language support)
│   └── routes.tsx      # All route definitions
├── styles/
│   ├── theme.css       # Asahi brand tokens (CSS custom properties)
│   ├── index.css       # Global styles
│   └── tailwind.css    # Tailwind imports
└── imports/            # Third-party library re-exports / shims
```

## Design System

All styling uses CSS custom properties defined in `frontend/src/styles/theme.css`. Key tokens:
- `--color-primary-500: #CC0000` — Asahi Red (main action color)
- `--color-asahi-black: #1A1A1A` — headers and headlines
- Typography: Noto Serif JP (headings), Noto Sans JP (body)
- Spacing: 8px grid system

UI components follow the shadcn/ui pattern — primitives are in `components/ui/`, built on Radix UI. Do not replace these with MUI or other component libraries; MUI is only used for supplementary icons (`@mui/icons-material`).

## Backend Architecture

Laravel 11 API with Sanctum token authentication (not JWT). Currently a skeleton — `src/routes/api.php` only has the default `/user` route. The planned API surface is documented in `frontend/IMPLEMENTATION_STATUS.md`.

Key planned backend components (from `docs/02-system-architecture.md`):
- **Route optimization**: Python microservice (OR-Tools + FastAPI) — separate service
- **Real-time**: Laravel Echo + Soketi (WebSocket, Pusher-compatible)
- **Queue**: Redis-backed Laravel Queue for async jobs (notifications, optimization, audit log)
- **Auth**: `laravel/sanctum` — SPA-style token flow, not session cookies

## Implementation Status

See `frontend/IMPLEMENTATION_STATUS.md` for the full status. In brief:
- All 12 mobile screens and 14 admin screens are scaffolded
- All data is currently **mock/hardcoded** — no real API calls exist yet
- Priority 0 screens needing full implementation: Subscriber Detail (A4), Route Edit with drag-and-drop (A6), Live Tracking WebSocket (A10)
- Backend integration has not started

## Key Design Decisions

- The frontend is a single Vite app serving both the mobile PWA and admin SPA — they are not separate deployments
- Maps use React Leaflet + OpenStreetMap (no Google Maps API dependency)
- Offline support for mobile is planned via Dexie.js (IndexedDB) — not yet implemented
- i18n is planned via `react-i18next` — the `LanguageContext` currently exists but language-switching logic is not wired up
- Dark mode is prepared (CSS variables exist) but auto-scheduling (3:00–6:00 for delivery workers) is not yet implemented
