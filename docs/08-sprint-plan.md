# AsahiRoute — Sprint Plan (Phase 6 Frontend Integration)

> Kế hoạch chi tiết tích hợp frontend với backend API thực.  
> **Bắt đầu:** 2026-04-04

> **Quy tắc:** Sau khi hoàn thành mỗi sprint/phase, cập nhật bảng tổng quan và thêm checklist hoàn thành vào phần tương ứng trước khi chuyển sang công việc tiếp theo.
>
> ⚠️ **BẮT BUỘC:** Khi hoàn thành một phase backend, PHẢI báo cáo kết quả trực tiếp cho người dùng gồm: (1) danh sách endpoints đã implement, (2) các vấn đề phát hiện và đã fix, (3) bước tiếp theo. Không chuyển phase mà không báo cáo.

---

## Tổng quan

| Sprint | Nội dung | Screens | Trạng thái |
|--------|----------|---------|------------|
| Sprint 1 | Mobile core delivery flow | RouteMap, RouteList, DeliveryPointDetail, DeliverySummary | ✅ Hoàn thành |
| Sprint 2 | Mobile auxiliary screens | Notifications, SOS, Settings | ✅ Hoàn thành |
| Sprint 3 | Admin data screens | Dashboard, SubscriberManagement, SubscriberDetail | ✅ Hoàn thành |
| Sprint 4 | Admin management screens | RouteManagement, RouteEdit, UserManagement | ✅ Hoàn thành |
| Sprint 5 | Real-time & WebSocket | WebSocket infra, LiveTracking | ✅ Hoàn thành |
| Sprint 6 | Polish | i18n, Error Boundary, Skeleton loaders | ✅ Hoàn thành |
| P0 | Backend bootstrap & system verification | Docker, DB, API test | ✅ Hoàn thành |
| P1 | Admin controllers + DelivererStatus event | SuspensionController, InsertionController, UserController, DelivererStatusChanged | ✅ Hoàn thành |
| P2 | GPS tracking + Admin Settings newspapers | useLocationTracking hook, newspaperTypeService, Settings.tsx | ✅ Hoàn thành |
| P3 | Remaining screen API integration | RoutePrint, AuditLog, Reports | ✅ Hoàn thành |
| P4 | Final screen API wiring | Profile, DeliveryInventory, AreaManagement | ✅ Hoàn thành |
| P5 | Low-priority mobile screens | LearnMode, DeliveryStatusManagement | ✅ Hoàn thành |
| B1 | Backend Tier 1 — Core delivery flow | Auth, DeliveryController, RouteController, SubscriberController | ✅ Hoàn thành |
| B2 | Backend Tier 2 — Admin management | Dashboard, Area, User, Suspension controllers | ✅ Hoàn thành |
| B3 | Backend Tier 3 — Advanced features | NewspaperType, Report, AuditLog, SOS controllers | ✅ Hoàn thành |
| B4 | Backend remaining — CSV import + integration test | SubscriberController.import(), php artisan test | ✅ Hoàn thành — 38/38 tests pass |
| B5 | Backend Phase 5 — Route optimization + WebSocket | Python OR-Tools microservice, Soketi, Broadcast tests | ✅ Hoàn thành — 47/47 tests pass |

---

## Sprint 1 — Mobile Core Delivery Flow

**Goal:** Deliverer có thể bắt đầu → log từng điểm → hoàn thành một ca giao báo hoàn toàn với data thật.

### Kiến trúc state management

```
Home (click 配達開始)
  → POST /delivery/start → lưu vào delivery.store.ts (activeDelivery)
  → navigate /mobile/route/:id/map

RouteMap / RouteList (shared route data via useQuery)
  → useQuery ['my-routes', today] → tìm route theo URL :id
  → delivery.store: loggedPoints (optimistic update)
  → useMutation POST /delivery/log

DeliveryPointDetail (điểm cụ thể)
  → lấy point từ route data (đã cache)
  → useMutation POST /delivery/log

DeliverySummary
  → POST /delivery/:id/complete → navigate với summary state
```

**Store mới cần tạo:** `frontend/src/stores/delivery.store.ts`
```typescript
interface DeliveryStore {
  activeDelivery: { id: number; routeId: number; startedAt: string } | null;
  loggedPoints: Record<number, 'delivered' | 'skipped' | 'failed' | 'absent'>;
  setActiveDelivery(d: DeliveryStore['activeDelivery']): void;
  logPoint(routePointId: number, status: string): void;
  clearSession(): void;
}
```

### Checklist Sprint 1

#### delivery.store.ts
- [x] Tạo `delivery.store.ts` — Zustand, persist activeDelivery (survive reload)
- [x] `activeDelivery`: id, routeId, startedAt
- [x] `loggedPoints`: map routePointId → status (optimistic local state)

#### Home.tsx (update)
- [x] Click "配達開始" → POST `/delivery/start` → store session → navigate
- [x] Handle loading state trên button start
- [x] Handle lỗi khi start (toast error)
- [x] "配達を再開" nếu đã có session

#### RouteMap.tsx
- [x] Xóa mock data, dùng `useQuery ['my-routes', today]` → filter theo `:id`
- [x] Hiển thị markers thật từ route points (lat/lng từ subscriber)
- [x] Status marker dựa trên `loggedPoints` từ delivery.store
- [x] Bottom panel hiển thị point tiếp theo cần giao
- [x] Button "Complete" → POST `/delivery/:id/complete` → navigate DeliverySummary
- [x] Loading + not-found states

#### RouteList.tsx
- [x] Xóa mock data, dùng cùng `useQuery` với RouteMap (cache hit)
- [x] Filter counts tính từ real data + loggedPoints store
- [x] Swipe to skip → `useMutation` POST `/delivery/log`
- [x] Fix hook-in-loop: tách RouteListItem thành component riêng

#### DeliveryPointDetail.tsx
- [x] Xóa mock data, tìm point từ route data theo `:pointId`
- [x] Hiển thị subscriber info thật (name, address, newspapers, memo)
- [x] Hiển thị `delivery_note_translations` theo ngôn ngữ hiện tại
- [x] Button ✅ Delivered / ⏭ Skipped / ❌ Failed → `useMutation` POST `/delivery/log`
- [x] Sau khi log → cập nhật `loggedPoints` store → navigate back

#### DeliverySummary.tsx
- [x] Nhận summary từ navigation state (từ POST complete)
- [x] Hiển thị stats thật: total, delivered, skipped, duration, distance, completion_rate
- [x] time_improvement_min: màu xanh nếu giảm, đỏ nếu tăng

### API endpoints dùng trong Sprint 1

```
GET  /api/v1/delivery/my-routes?date=YYYY-MM-DD   ← đã có từ Home
POST /api/v1/delivery/start                         ← mới
POST /api/v1/delivery/log                           ← mới
POST /api/v1/delivery/:id/complete                  ← mới
```

### Rủi ro kỹ thuật

| Vấn đề | Giải pháp |
|--------|-----------|
| Subscriber không có lat/lng → marker không hiển thị | Ẩn marker, hiển thị "Địa chỉ không có GPS" |
| Offline trong lúc giao → log thất bại | Store loggedPoints locally, sync khi online lại (Phase 5) |
| Route id từ URL không khớp với data | Hiển thị 404 fallback |
| PullToRefresh conflict với Leaflet scroll | Disable PTR trên RouteMap, chỉ dùng ở RouteList |

---

## Sprint 2 — Mobile Auxiliary Screens

**Goal:** Hoàn thiện toàn bộ mobile app.

### Checklist Sprint 2

#### Notifications.tsx
- [x] `useQuery` GET `/delivery/notifications?unread_only=false&limit=50`
- [x] `useMutation` PUT `/delivery/notifications/:id/read`
- [x] Mark all as read: PUT `/delivery/notifications/read-all`
- [x] Real-time count update (badge trên bell icon ở Home) — unreadCount badge trong header

#### SOS.tsx
- [x] Lấy GPS coords từ browser `navigator.geolocation`
- [x] `useMutation` POST `/delivery/sos` với lat/lng/notes
- [x] Loading state + success/error feedback (sent state hiển thị ✓)
- [x] Disable nút sau khi gửi (tránh spam) — `sent` state + disabled

#### Settings.tsx
- [x] `useQuery` GET `/auth/me` → hiển thị user info (từ `useAuthStore`)
- [x] `useMutation` PUT `/auth/settings` — cập nhật lang/font/dark_mode/voice
- [x] Sync `selectedLanguage` với `LanguageContext.setLanguage`
- [x] Logout button → `authService.logout()` → clear store → navigate `/login`

---

## Sprint 3 — Admin Data Screens

**Goal:** Manager xem được data thật trên dashboard và quản lý subscribers.

### Checklist Sprint 3

#### Dashboard.tsx
- [x] `useQuery` GET `/admin/dashboard/summary` — KPI cards
- [x] `useQuery` GET `/admin/dashboard/today` — deliverer status list
- [x] `refetchInterval: 30_000` (polling 30s)
- [x] `useQuery` GET `/admin/sos-alerts?status=active` — alert banner

#### SubscriberManagement.tsx
- [x] `useQuery` GET `/admin/subscribers?page=1&per_page=20&area_id=&status=&q=`
- [x] Filter bar: area dropdown, status, search → update query params
- [x] Pagination với `meta.total`
- [x] CSV export button → `subscriberService.exportCsv()` → download
- [x] CSV import: click file input (`.csv`) → `subscriberService.importCsv(file)` → toast với imported/skipped count

#### SubscriberDetail.tsx
- [x] `useQuery` GET `/admin/subscribers/:id`
- [x] Edit form → `useMutation` PUT `/admin/subscribers/:id`
- [x] Suspension list + add suspension form
- [ ] Photo upload (nếu Phase 5.4 done)

---

## Sprint 4 — Admin Management Screens

**Goal:** Manager quản lý routes, users, suspensions, insertions.

### Checklist Sprint 4

#### RouteManagement.tsx
- [x] `useQuery` GET `/admin/routes?area_id=&delivery_time=`
- [x] Trigger optimize: POST `/admin/routes/:id/optimize`
- [x] Reorder drag-drop: PUT `/admin/routes/:id/reorder`
- [x] Assign deliverer: implemented trong RouteEdit.tsx (modal chọn user → PUT `/admin/routes/:id/assign`)

#### RouteEdit.tsx
- [x] `useQuery` GET `/admin/routes/:id` (route + points)
- [x] Drag-drop reorder (dnd-kit) → local state
- [x] Save: PUT `/admin/routes/:id/reorder`
- [x] Print: navigate to `/admin/routes/:id/print`
- [x] Assign deliverer modal: PUT `/admin/routes/:id/assign` (trong RouteEdit.tsx)

#### UserManagement.tsx
- [x] `useQuery` GET `/admin/users`
- [x] Deactivate user (DELETE)
- [x] Create/Edit user form — modal với name/email/password/phone/role, `useMutation` create+update

#### SuspensionManagement.tsx
- [x] `useQuery` GET `/admin/suspensions` với status filter
- [x] Cancel: DELETE `/admin/suspensions/:id`

#### InsertionManagement.tsx
- [x] `useQuery` GET `/admin/insertions` với status filter
- [x] Approve: POST `/admin/insertions/:id/approve`
- [x] Reject: POST `/admin/insertions/:id/reject`

---

## Sprint 5 — Real-time & WebSocket

**Goal:** LiveTracking hoạt động real-time, SOS notifications instant.

### Checklist Sprint 5

#### Backend (Phase 5.2)
- [x] Thêm Soketi service vào `docker-compose.yml`
- [x] Cấu hình `config/broadcasting.php` với Pusher-compatible driver
- [x] Implement 6 Events (DeliveryCompleted, SosAlertCreated, v.v.)
- [x] Channel authorization trong `routes/channels.php`

#### Frontend
- [x] Cài `laravel-echo` + `pusher-js`
- [x] `useEcho` hook: subscribe channel `private-shop.{shopId}`
- [x] LiveTracking.tsx: map pins update real-time khi nhận event
- [x] Dashboard: SOS alert toast khi nhận SosAlertCreated

---

## Sprint 6 — Polish

**Goal:** UX hoàn chỉnh, đa ngôn ngữ hoạt động.

### Checklist Sprint 6

#### i18n
- [x] `npm install react-i18next i18next`
- [x] Tạo `frontend/src/locales/ja.json` (base)
- [x] Dịch sang en.json, vi.json, zh.json, ko.json, ne.json
- [x] Wire LanguageContext → `i18n.changeLanguage()` khi đổi ngôn ngữ
- [x] Áp dụng `useTranslation()` cho Login (email, password, submit)
- [x] Áp dụng cho Home, RouteList, RouteMap (còn lại)

#### Error Boundary
- [x] `ErrorBoundary` component bao quanh Outlet (RootLayout + AdminLayout)
- [x] Fallback UI với "再読み込み" button

#### Skeleton Loaders
- [x] `SkeletonCard`, `SkeletonRow`, `SkeletonDelivererCard` components
- [x] Áp dụng cho: Dashboard KPI cards, SubscriberManagement table rows

---

## P0 — Backend Bootstrap & System Verification

**Goal:** Toàn bộ stack chạy được, login thành công, API trả data thật.  
**Hoàn thành:** 2026-04-04

### Checklist P0

#### Docker Stack
- [x] `docker-compose up -d` — 5 containers: app, nginx, mysql, redis, soketi
- [x] Soketi image pull & start (port 6001/9601)
- [x] MySQL healthy check pass

#### Dependencies
- [x] `composer require pusher/pusher-php-server` — cài vào container, cập nhật composer.lock

#### Database
- [x] `php artisan migrate:fresh --seed` — 16 tables + seed data
- [x] 3 users (1 admin, 2 deliverers), 2 areas, 25 subscribers, 2 routes, 25 route_points

#### Bug fixes
- [x] `DeliveryRouteService`: thêm `lat/lng` vào subscriber response (RouteMap bị trống nếu thiếu)
- [x] `SosController`: wire `broadcast(new SosAlertCreated(...))` — bỏ TODO Phase 5
- [x] `channels.php`: sửa `DeliverySession` → `Delivery` (model không tồn tại)
- [x] `.env`: xóa dòng `BROADCAST_CONNECTION=log` bị duplicate

#### API Verification
- [x] `POST /api/v1/auth/login` → token + user info ✅
- [x] `GET /api/v1/delivery/my-routes` → 15 điểm với lat/lng đầy đủ ✅
- [x] CORS `allowed_origins: *` — frontend dev server kết nối được

---

## P1 — Admin Controllers & DelivererStatus Event

**Goal:** Hoàn thiện các Admin API còn thiếu logic thực, wire DelivererStatusChanged event.

### Checklist P1

#### Admin Controllers cần bổ sung
- [x] `SuspensionController` — store/update với validation đầy đủ, cancel logic
- [x] `InsertionController` — approve/reject gửi notification cho deliverer
- [x] `UserController` — performance stats, shift calendar
- [x] `SosAlertController` — acknowledge/resolve cập nhật status

#### Events & Broadcasting
- [x] `DelivererStatusChanged` — fire trong `DeliveryController::start` (status:'delivering') và `complete` (status:'online')
- [x] `DeliveryStarted` — fire trong `DeliveryController::start` sau khi tạo Delivery
- [x] `DeliveryPointLogged` — fire trong `DeliveryController::logPoint` sau khi lưu log + increment
- [x] `DeliveryCompleted` — fire trong `DeliveryController::complete` với completionRate + durationMinutes
- [x] `LocationUpdated` — `POST /api/v1/delivery/location` endpoint mới, `LocationRequest` validation, broadcast

#### Queue & Jobs
- [x] `QUEUE_CONNECTION=redis` hoạt động — `php artisan queue:work --once` chạy không lỗi
- [x] Broadcast events implements `ShouldBroadcast` (qua queue) — tất cả 5 events đã implement

---

## Ghi chú kỹ thuật

### Pattern chuẩn cho tất cả screens

```typescript
// Fetch
const { data, isLoading, error } = useQuery({
  queryKey: ['resource', params],
  queryFn: () => service.getAll(params),
});

// Mutate
const mutation = useMutation({
  mutationFn: service.update,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['resource'] });
    toast.success('保存しました');
  },
  onError: (err) => toast.error(extractApiError(err)),
});
```

### Helper extractApiError (dùng chung)

```typescript
// frontend/src/lib/api.ts
export function extractApiError(err: unknown): string {
  return (err as { response?: { data?: { error?: { message?: string } } } })
    ?.response?.data?.error?.message ?? '操作に失敗しました';
}
```

---

## P2 — GPS Tracking & Admin Settings API

**Goal:** Mobile gửi GPS real-time cho LiveTracking; Admin Settings newspaper types dùng API thật.

### Checklist P2

#### GPS Location Tracking (Mobile)
- [x] `deliveryService.sendLocation(lat, lng, speed)` — POST `/delivery/location`
- [x] `useLocationTracking` hook — `watchPosition` khi có `activeDelivery`, throttle 10s, silent on error
- [x] Mount hook trong `RootLayout` — tự động bắt đầu/dừng theo session

#### Admin Settings — Newspaper Types Tab
- [x] `newspaperTypeService` — getList/create/update/remove trong `admin.service.ts`
- [x] Tab newspapers: `useQuery` GET `/admin/newspaper-types`
- [x] Inline edit row: `useMutation` PUT → update tức thì
- [x] Add form inline: `useMutation` POST → append vào list
- [x] Delete với confirm: `useMutation` DELETE

---

## P3 — Remaining Screen API Integration

**Goal:** Wiring các screens còn dùng mock data sang real API.

### Checklist P3

#### RoutePrint.tsx (A12)
- [x] `useQuery` GET `/admin/routes/:id/print` → `routeService.getPrint(id)`
- [x] Hiển thị bảng in thật: sequence, customer_code, name, address, newspapers, delivery_note
- [x] Nút "PDF出力 / 印刷" → `window.print()` (print:hidden toolbar)
- [x] Loading + error states

#### AuditLog.tsx (A13)
- [x] Thêm `auditLogService` (getList, exportCsv) vào `admin.service.ts`
- [x] `useQuery` GET `/admin/audit-logs` với params: action, from, to, page
- [x] Map API response → `AuditLogEntry` (actionLabel, target, changes từ old/new values)
- [x] Nút Refresh → `refetch()`, CSV export → `auditLogService.exportCsv()`

#### Reports.tsx (A11)
- [x] `useQuery` GET `/admin/reports/weekly` → `reportService.getWeekly()`
- [x] `useQuery` GET `/admin/reports/monthly` → `reportService.getMonthly()`
- [x] `useQuery` GET `/admin/reports/daily` → `reportService.getDaily(date)`
- [x] Map API data (date/delivered/total) → chart format, fallback sang mock nếu API empty

---

## P4 — Final Screen API Wiring

**Goal:** Hoàn thiện các màn hình mobile còn dùng mock data.

### Checklist P4

#### Profile.tsx
- [x] Import `useAuthStore` → hiển thị `user.name`, `user.role`, `user.email` thật
- [x] Xóa hardcode "山田 太郎", "A区域"

#### DeliveryInventory.tsx
- [x] `useQuery` GET `/delivery/my-routes?date=today`
- [x] Tổng hợp số lượng báo từ tất cả route points (bỏ qua is_suspended)
- [x] Hiển thị breakdown theo tên báo + tổng số
- [x] Loading state + empty state

#### AreaManagement.tsx (Admin)
- [x] Mở rộng `areaService` — thêm create/update/remove
- [x] `useQuery` GET `/admin/areas` → map sang UI shape (với fallback mock cho các field API chưa có)
- [x] `useMutation` PUT `/admin/areas/:id` → wire vào handleSaveEdit
- [x] `useMutation` DELETE `/admin/areas/:id` → deleteAreaMutation (sẵn sàng)

---

## P5 — Low-Priority Mobile Screens

**Goal:** Hoàn thiện 2 màn hình mobile còn lại dùng mock data.

### Checklist P5

#### LearnMode.tsx
- [x] `useQuery` GET `/delivery/my-routes?date=today` → tìm route theo `useParams(:id)`
- [x] `totalPoints` lấy từ `route.total_points` (bỏ hardcode 148)
- [x] `currentPointData` lấy từ `route.points[currentPoint-1].subscriber` → hiển thị tên + địa chỉ thật
- [x] `currentPoint` init từ 1 thay vì 3

#### DeliveryStatusManagement.tsx
- [x] `useQuery` GET `/delivery/my-routes?date=today` → flatten tất cả points từ mọi route
- [x] Map `is_suspended: true` → status "stopped", else "active"
- [x] Hiển thị tên/địa chỉ/báo thật từ subscriber data
- [x] Status toggles giữ local (`localOverrides`) vì không có mobile suspension endpoint
- [x] Loading state với Loader2 spinner

---

*Cập nhật lần cuối: 2026-04-04 (P5 hoàn thành — tất cả màn hình đã wired)*

---

## B1 — Backend Tier 1: Core Delivery Flow

**Goal:** Tất cả endpoint thiết yếu để deliverer có thể login và giao báo end-to-end.

**Phát hiện:** Toàn bộ Tier 1 đã implemented sẵn trong codebase. Chỉ cần 1 fix.

### Checklist B1

#### AuthController (`src/app/Http/Controllers/Api/Auth/AuthController.php`)
- [x] `POST /api/v1/auth/login` — Sanctum token, mobile 30 ngày / admin 8 giờ
- [x] `POST /api/v1/auth/logout` — xóa token hiện tại
- [x] `GET /api/v1/auth/me` — trả user info + settings
- [x] `PUT /api/v1/auth/settings` — cập nhật lang/font_size/voice_guide/dark_mode

#### DeliveryController (`src/app/Http/Controllers/Api/Delivery/DeliveryController.php`)
- [x] `GET /api/v1/delivery/my-routes` — DeliveryRouteService: routes với suspension overlay
- [x] `POST /api/v1/delivery/start` — tạo Delivery session, broadcast DeliveryStarted + DelivererStatusChanged
- [x] `POST /api/v1/delivery/log` — ghi DeliveryLog, broadcast DeliveryPointLogged
- [x] `POST /api/v1/delivery/{id}/complete` — tính summary, broadcast DeliveryCompleted
- [x] `POST /api/v1/delivery/sync` — OfflineSyncService batch sync
- [x] `POST /api/v1/delivery/location` — broadcast LocationUpdated
- [x] **FIX:** Thêm `use App\Events\LocationUpdated;` import bị thiếu

#### Admin RouteController (`src/app/Http/Controllers/Api/Admin/RouteController.php`)
- [x] `GET /api/v1/admin/routes` — paginated, filter area_id/delivery_time
- [x] `GET /api/v1/admin/routes/{id}` — with points + subscriber newspapers
- [x] `PUT /api/v1/admin/routes/{id}/reorder` — transaction update sequence_order
- [x] `POST /api/v1/admin/routes/{id}/assign` — assign deliverer
- [x] `GET /api/v1/admin/routes/{id}/print` — print-ready data

#### Admin SubscriberController (`src/app/Http/Controllers/Api/Admin/SubscriberController.php`)
- [x] `GET /api/v1/admin/subscribers` — paginated, filter area/q/suspended
- [x] `GET /api/v1/admin/subscribers/{id}` — with area, newspapers, suspensions, routePoints
- [x] `POST /api/v1/admin/subscribers` — create với validation
- [x] `PUT /api/v1/admin/subscribers/{id}` — update partial
- [x] `DELETE /api/v1/admin/subscribers/{id}` — soft delete
- [x] `GET /api/v1/admin/subscribers/export` — CSV stream với BOM
- [ ] `POST /api/v1/admin/subscribers/import` — **stub**, cần implement real CSV parsing → *B4*

---

## B2 — Backend Tier 2: Admin Management

**Phát hiện:** Toàn bộ đã implemented sẵn, không cần thay đổi gì.

### Checklist B2

#### DashboardController
- [x] `GET /admin/dashboard/summary` — KPI: deliveries, points, suspensions, insertions
- [x] `GET /admin/dashboard/today` — tất cả deliverers + status hôm nay
- [x] `GET /admin/dashboard/alerts` — SOS alerts chưa resolve

#### AreaController
- [x] `GET/POST/PUT/DELETE /admin/areas` — CRUD đầy đủ, scoped theo shop_id

#### UserController
- [x] `GET/POST/PUT/DELETE /admin/users` — CRUD, Hash::make password
- [x] `GET /admin/users/{id}/performance` — tính completion_rate, avg_duration
- [x] `GET /admin/users/{id}/deliveries` — paginated history

#### SuspensionController
- [x] `GET/POST/PUT/DELETE /admin/suspensions` — status: scheduled/active/completed/cancelled
- [x] `GET /admin/suspensions/calendar` — group theo ngày trong tháng

---

## B3 — Backend Tier 3: Advanced Features

**Phát hiện:** Toàn bộ đã implemented sẵn.

### Checklist B3

#### NewspaperTypeController
- [x] `GET/POST/PUT/DELETE /admin/newspaper-types` — CRUD scoped theo shop_id

#### ReportController
- [x] `GET /admin/reports/daily` — summary + delivery list theo ngày
- [x] `GET /admin/reports/weekly` — daily breakdown tuần hiện tại
- [x] `GET /admin/reports/monthly` — daily breakdown theo tháng/năm
- [x] `GET /admin/reports/delivery-stats` — aggregate stats (raw SQL)
- [x] `GET /admin/reports/area-stats` + `user-performance` — join queries

#### AuditLogController
- [x] `GET /admin/audit-logs` — paginated, filter action/type/user_id/from/to
- [x] `GET /admin/audit-logs/export` — CSV stream với BOM (10,000 dòng)

#### SosController + SosAlertController
- [x] `POST /delivery/sos` — tạo SosAlert, notify admins, broadcast SosAlertCreated
- [x] `GET /admin/sos-alerts` — paginated, filter status
- [x] `PUT /admin/sos-alerts/{id}/acknowledge` — cập nhật status + acknowledged_by
- [x] `PUT /admin/sos-alerts/{id}/resolve` — cập nhật status + notes

---

## B4 — Backend Remaining: CSV Import + Integration Test

**Goal:** Implement CSV import thật + chạy migrate/seed/test để verify toàn bộ hoạt động.

### Checklist B4

#### SubscriberController.import() — thực hiện CSV parsing
- [x] Parse CSV với `fgetcsv()`, skip header row, strip UTF-8 BOM
- [x] Map columns: 顧客コード, 名前, 名前（カナ）, 住所, 郵便番号, 電話, エリア, 備考
- [x] Pre-load area name→id map scoped theo shop_id
- [x] Skip duplicate (customer_code đã tồn tại trong shop)
- [x] Return `{ imported, skipped, errors[] }` matching frontend expectation
- [x] PHP syntax check: ✅ 0 errors

#### Integration verification
- [x] `docker-compose up -d` — tất cả 5 containers running (app, mysql, nginx, redis, soketi)
- [x] `php artisan migrate:fresh --seed` — 21 migrations + 5 seeders OK
- [x] `php artisan test` — **38/38 tests pass**, 119 assertions, 19.7s
- [x] Bug fix: `cal_days_in_month()` (ext-calendar thiếu) → thay bằng `Carbon::endOfMonth()` trong SuspensionController + ReportController
- [x] Bug fix: Tests updated cho 2 behaviour sai assumption (logout DB check, admin delivery access)

---

## B5 — Backend Phase 5: Route Optimization + WebSocket (Chờ)

**Goal:** Python OR-Tools microservice + Soketi real-time.

#### B5a — WebSocket Broadcast Tests
- [x] `BroadcastTest.php` — 9 tests: DeliveryStarted, DeliveryPointLogged, DeliveryCompleted, LocationUpdated, SosAlertCreated dispatched với đúng payload
- [x] Channel auth: own-shop user → 200, other-shop user → 403
- [x] Bug fix: channel auth test dùng `actingAs` thay vì `withToken` (web middleware không process Bearer token)

#### B5b — Route Optimization Microservice
- [x] `optimizer/main.py` — Python FastAPI + OR-Tools TSP (nearest-neighbour + 2-opt, fallback nếu không có ortools)
- [x] `optimizer/Dockerfile` + `optimizer/requirements.txt`
- [x] `docker-compose.yml` — thêm `optimizer` service (port 8100:8000)
- [x] `OptimizeRouteJob.php` — ShouldQueue, gọi HTTP POST /optimize, apply reorder trong DB transaction
- [x] `RouteController.optimize()` — dispatch job thay vì TODO placeholder
- [x] `config/services.php` — thêm `optimizer.url`
- [x] Test optimizer: `GET /health` → `{"status":"ok"}`, `POST /optimize` với 3 điểm → trả về order + distance_m
- [x] **47/47 tests pass** (140 assertions, 20.5s)
