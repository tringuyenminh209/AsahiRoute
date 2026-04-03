# AsahiRoute — Backend Implementation Plan

> Tài liệu này dùng để theo dõi tiến độ phát triển backend từ đầu đến khi hoàn chỉnh.  
> Cập nhật trạng thái: đánh dấu `[x]` khi hoàn thành từng task.  
> **Ngày bắt đầu:** 2026-04-03

---

## Tổng quan tiến độ

| Phase | Nội dung | Trạng thái |
|-------|----------|------------|
| Phase 1 | Database & Foundation | ✅ Hoàn thành |
| Phase 2 | Authentication | ✅ Hoàn thành |
| Phase 3 | Core Delivery APIs (Mobile) | ✅ Hoàn thành |
| Phase 4 | Admin CRUD APIs | ✅ Hoàn thành |
| Phase 5 | Advanced Features | 🔄 Đang làm (AuditObserver ✅, WebSocket/Queue ⏳) |
| Phase 6 | Frontend Integration | ⏳ Chờ |

---

## Phase 1 — Database & Foundation

### 1.1 Migrations (17 bảng, theo thứ tự dependency)

- [x] `personal_access_tokens` — đã có sẵn (Sanctum)
- [x] `2026_04_03_000001_create_shops_table`
- [x] `2026_04_03_000002_modify_users_table` — thêm `shop_id`, `role`, `phone`, `settings`, `deleted_at`
- [x] `2026_04_03_000003_create_areas_table`
- [x] `2026_04_03_000004_create_newspaper_types_table`
- [x] `2026_04_03_000005_create_subscribers_table` — có `POINT` location + SPATIAL INDEX
- [x] `2026_04_03_000006_create_subscriber_newspapers_table`
- [x] `2026_04_03_000007_create_routes_table`
- [x] `2026_04_03_000008_create_route_points_table`
- [x] `2026_04_03_000009_create_suspensions_table`
- [x] `2026_04_03_000010_create_new_insertions_table`
- [x] `2026_04_03_000011_create_deliveries_table`
- [x] `2026_04_03_000012_create_delivery_logs_table`
- [x] `2026_04_03_000013_create_notifications_table` — UUID primary key
- [x] `2026_04_03_000014_create_audit_logs_table`
- [x] `2026_04_03_000015_create_shifts_table`
- [x] `2026_04_03_000016_create_sos_alerts_table`

### 1.2 Models (16 mới + cập nhật User)

- [x] `Shop` — `HasMany` users, areas
- [x] `User` — cập nhật: thêm `shop_id`, `role`, `settings` cast JSON, relationships
- [x] `Area` — `BelongsTo` shop, `HasMany` subscribers, routes
- [x] `NewspaperType` — `BelongsTo` shop
- [x] `Subscriber` — `BelongsTo` area, `HasMany` subscriberNewspapers, suspensions
- [x] `SubscriberNewspaper` — pivot với quantity, start/end date
- [x] `Route` — `BelongsTo` area, `HasMany` routePoints, deliveries
- [x] `RoutePoint` — `BelongsTo` route, subscriber, `HasMany` deliveryLogs
- [x] `Suspension` — `BelongsTo` subscriber
- [x] `NewInsertion` — `BelongsTo` subscriber, route
- [x] `Delivery` — `BelongsTo` route, user; `HasMany` deliveryLogs
- [x] `DeliveryLog` — `BelongsTo` delivery, routePoint
- [x] `Notification` — UUID key, `BelongsTo` user
- [x] `AuditLog` — morphic (auditable_type/id), `BelongsTo` user
- [x] `Shift` — `BelongsTo` user, route
- [x] `SosAlert` — `BelongsTo` user, shop
- [ ] `RouteOptimizationResult` *(helper model, không có migration riêng)*

### 1.3 Seeders

- [x] `ShopSeeder` — 1 shop mẫu (ASA山口)
- [x] `UserSeeder` — 1 admin + 2 deliverers
- [x] `AreaAndNewspaperSeeder` — 2 khu vực + 2 loại báo
- [x] `SubscriberSeeder` — 25 subscribers với GPS coords
- [x] `RouteSeeder` — 2 routes với route_points
- [x] `DatabaseSeeder` — gọi tất cả theo thứ tự

### 1.4 Infrastructure

- [x] `app/Http/Responses/ApiResponse.php` — unified response format
- [x] `app/Http/Controllers/Api/ApiController.php` — base controller
- [x] `app/Http/Middleware/EnsureIsAdmin.php`
- [x] `app/Http/Middleware/EnsureIsDeliverer.php`
- [x] Cập nhật `bootstrap/app.php` — đăng ký middleware aliases + JSON exception handler
- [ ] Cấu hình Sanctum (`config/sanctum.php`, stateful domains)
- [x] Cấu hình `routes/api.php` — skeleton đầy đủ tất cả nhóm routes

---

## Phase 2 — Authentication

### 2.1 Controllers

- [ ] `Api/Auth/AuthController.php`
  - [ ] `login()` — validate, issue token, trả user + settings
  - [ ] `logout()` — revoke current token
  - [ ] `me()` — trả thông tin user hiện tại
  - [ ] `updateSettings()` — cập nhật lang/font/voice/dark_mode/onboarding_done

### 2.2 Requests (Form Validation)

- [ ] `LoginRequest` — email, password, device_name
- [ ] `UpdateSettingsRequest`

### 2.3 Routes

```
POST   /api/v1/auth/login
POST   /api/v1/auth/logout     [auth:sanctum]
GET    /api/v1/auth/me         [auth:sanctum]
PUT    /api/v1/auth/settings   [auth:sanctum]
```

### 2.4 Tests

- [ ] `AuthTest` — login thành công, sai password, logout, me, update settings

---

## Phase 3 — Core Delivery APIs (Mobile)

### 3.1 Controllers

- [ ] `Api/Delivery/DeliveryController.php`
  - [ ] `myRoutes()` — GET routes theo date + shift, join points + suspensions
  - [ ] `start()` — POST tạo delivery session
  - [ ] `logPoint()` — POST ghi nhận từng điểm (delivered/skipped/failed)
  - [ ] `complete()` — POST kết thúc, tính summary, so sánh với hôm qua
  - [ ] `sync()` — POST offline batch sync với conflict detection

- [ ] `Api/Delivery/NotificationController.php`
  - [ ] `index()` — GET notifications (unread_only, limit)
  - [ ] `markRead()` — PUT mark single as read
  - [ ] `markAllRead()` — PUT mark all as read

- [ ] `Api/Delivery/SosController.php`
  - [ ] `trigger()` — POST tạo SOS alert, broadcast event

### 3.2 Services

- [ ] `DeliveryRouteService` — logic build route với suspensions active
- [ ] `DeliverySummaryService` — tính thống kê completion
- [ ] `OfflineSyncService` — xử lý batch log, detect conflict (synced flag)

### 3.3 Requests

- [ ] `StartDeliveryRequest`
- [ ] `LogDeliveryPointRequest`
- [ ] `CompleteDeliveryRequest`
- [ ] `SyncDeliveryRequest`
- [ ] `SosRequest`

### 3.4 Routes

```
GET    /api/v1/delivery/my-routes              [deliverer]
POST   /api/v1/delivery/start                 [deliverer]
POST   /api/v1/delivery/log                   [deliverer]
POST   /api/v1/delivery/{id}/complete         [deliverer]
POST   /api/v1/delivery/sync                  [deliverer]
GET    /api/v1/delivery/notifications         [deliverer]
PUT    /api/v1/delivery/notifications/{id}/read [deliverer]
PUT    /api/v1/delivery/notifications/read-all  [deliverer]
POST   /api/v1/delivery/sos                   [deliverer]
```

### 3.5 Tests

- [ ] `DeliveryFlowTest` — start → log × N → complete
- [ ] `OfflineSyncTest` — batch sync, conflict detection

---

## Phase 4 — Admin CRUD APIs

### 4.1 Areas

- [ ] `Api/Admin/AreaController.php` — CRUD + stats
- [ ] Routes: `GET/POST/PUT/DELETE /api/v1/admin/areas`

### 4.2 Subscribers

- [ ] `Api/Admin/SubscriberController.php`
  - [ ] `index()` — list + filter (area, status, keyword) + pagination
  - [ ] `show()` — chi tiết + lịch sử suspension + photos
  - [ ] `store()` / `update()` / `destroy()`
  - [ ] `import()` — CSV upload, queue job
  - [ ] `export()` — CSV export
  - [ ] `uploadPhoto()` — resize + S3/local storage

- [ ] `Jobs/ImportSubscribersJob.php`
- [ ] Routes: CRUD + `/import` + `/export` + `/{id}/photos`

### 4.3 Routes & Route Points

- [ ] `Api/Admin/RouteController.php`
  - [ ] CRUD cơ bản
  - [ ] `reorder()` — cập nhật sequence_order hàng loạt
  - [ ] `assign()` — gán deliverer
  - [ ] `print()` — trả data format in
  - [ ] `preview()` — xem trước sau khi optimize

- [ ] Routes: CRUD + `/reorder` + `/assign` + `/print` + `/preview` + `/optimize`

### 4.4 Suspensions

- [ ] `Api/Admin/SuspensionController.php` — CRUD + calendar view
- [ ] Routes: CRUD + `/calendar`

### 4.5 New Insertions

- [ ] `Api/Admin/InsertionController.php`
  - [ ] CRUD
  - [ ] `approve()` / `reject()`
  - [ ] `suggestPosition()` — tính vị trí dựa trên GPS gần nhất

- [ ] `Services/InsertionPositionService.php`

### 4.6 Users & Shifts

- [ ] `Api/Admin/UserController.php` — CRUD + performance stats
- [ ] `Api/Admin/ShiftController.php` — CRUD + calendar view
- [ ] Routes tương ứng

### 4.7 Dashboard

- [ ] `Api/Admin/DashboardController.php`
  - [ ] `summary()` — KPI tổng hợp (delivered/in-progress/not-started)
  - [ ] `today()` — real-time status của tất cả deliverers
  - [ ] `alerts()` — alerts đang active

### 4.8 Reports

- [ ] `Api/Admin/ReportController.php`
  - [ ] `daily()` / `weekly()` / `monthly()`
  - [ ] `deliveryStats()` / `areaStats()` / `userPerformance()`

- [ ] `Services/ReportAggregatorService.php`

### 4.9 SOS Management

- [ ] `Api/Admin/SosAlertController.php`
  - [ ] `index()` — list với filter status
  - [ ] `acknowledge()` / `resolve()`

### 4.10 Audit Logs

- [ ] `Api/Admin/AuditLogController.php` — index + export
- [ ] `Observers/AuditObserver.php` — tự động ghi khi created/updated/deleted

### 4.11 Misc Admin

- [ ] `Api/Admin/NewspaperTypeController.php` — CRUD
- [ ] `Api/Admin/SearchController.php` — global search
- [ ] Đăng ký tất cả routes admin

---

## Phase 5 — Advanced Features

### 5.1 Route Optimization (Python Integration)

- [ ] `Services/RouteOptimizationService.php` — HTTP client gọi FastAPI
- [ ] `Jobs/OptimizeRouteJob.php` — queue job async
- [ ] `POST /api/v1/admin/routes/{id}/optimize` → dispatch job → broadcast kết quả
- [ ] Error handling khi Python service không phản hồi

### 5.2 WebSocket / Real-time

- [ ] Cài đặt Soketi (docker-compose thêm service)
- [ ] Cấu hình `config/broadcasting.php`
- [ ] Events:
  - [ ] `DeliveryCompleted` — broadcast to `private-shop.{shop_id}`
  - [ ] `SosAlertCreated` — broadcast to `private-shop.{shop_id}`
  - [ ] `SosAlertAcknowledged`
  - [ ] `RouteUpdated`
  - [ ] `SuspensionCreated` / `SuspensionCancelled`
  - [ ] `NewInsertionApproved`
- [ ] Channels authorization (`routes/channels.php`)

### 5.3 Audit Logging (Auto)

- [ ] `AuditObserver` — đăng ký trên: Shop, User, Subscriber, Route, RoutePoint, Suspension, NewInsertion, Delivery
- [ ] Ghi `old_values` / `new_values` dạng JSON diff
- [ ] Đăng ký trong `AppServiceProvider`

### 5.4 File Handling

- [ ] Cấu hình S3/MinIO disk trong `config/filesystems.php`
- [ ] `Services/PhotoUploadService.php` — resize (intervention/image) + upload
- [ ] Trả về `signed_url` có expiry

### 5.5 CSV Import/Export

- [ ] `Services/CsvImportService.php` — validate + upsert theo customer_code
- [ ] `Services/CsvExportService.php` — build CSV stream
- [ ] Error report: trả về array rows bị lỗi

### 5.6 Offline Sync Conflict Resolution

- [ ] Xử lý `409 Conflict` khi 2 người cùng sync một point
- [ ] Trả `conflict_data` để client quyết định

---

## Phase 6 — Frontend Integration

### 6.1 API Client Setup

- [ ] `frontend/src/lib/api.ts` — axios instance, base URL từ env, interceptors
- [ ] `frontend/src/lib/queryClient.ts` — TanStack Query config (retry, staleTime)
- [ ] `frontend/.env` / `frontend/.env.example` — `VITE_API_URL`
- [ ] Interceptor tự động đính `Authorization: Bearer {token}`
- [ ] Interceptor bắt `401` → redirect login

### 6.2 Auth Store & Flow

- [ ] `frontend/src/stores/auth.store.ts` — Zustand: `user`, `token`, `isAuthenticated`
- [ ] `frontend/src/services/auth.service.ts`
- [ ] Login page → gọi real API → lưu token
- [ ] `ProtectedRoute` component cho `/mobile/*` và `/admin/*`
- [ ] AdminLayout: thay hardcoded "山田" bằng user từ store

### 6.3 Mobile Screens Integration

- [ ] `services/delivery.service.ts`
- [ ] Home — `useQuery` my-routes
- [ ] RouteMap — real route points, POST log
- [ ] RouteList — filter/sort từ real data
- [ ] DeliveryPointDetail — GET subscriber detail
- [ ] DeliverySummary — kết quả từ POST complete
- [ ] Notifications — real API + mark read
- [ ] Settings — PUT settings, sync với LanguageContext
- [ ] SOS — POST sos alert

### 6.4 Admin Screens Integration

- [ ] `services/subscriber.service.ts` / `route.service.ts` / `report.service.ts` / ...
- [ ] Dashboard — `useQuery` summary + today (polling 30s)
- [ ] Subscriber Management — table với real data, CSV import/export
- [ ] Subscriber Detail — full info + photos
- [ ] Route Management — real data + trigger optimize
- [ ] Route Edit — save reorder via PUT
- [ ] Suspension Management — CRUD + calendar view
- [ ] New Insertions — approve/reject flow
- [ ] User Management — real data + performance
- [ ] Live Tracking — WebSocket listener + map pins
- [ ] Reports — charts từ real data
- [ ] Audit Log — real table + export

### 6.5 i18n Wiring

- [ ] Cài `react-i18next`
- [ ] Tạo `frontend/src/locales/{ja,en,vi,zh,ko,ne}.json`
- [ ] Wrap App với `I18nextProvider`
- [ ] Kết nối `LanguageContext.setLanguage` với `i18n.changeLanguage`
- [ ] Áp dụng cho các màn hình mobile (ưu tiên Login, Home, RouteList)

### 6.6 Loading & Error States

- [ ] Global error boundary
- [ ] Loading skeleton cho tất cả data tables
- [ ] Empty state component
- [ ] Toast notification cho thành công / thất bại (Sonner)

---

## Kiến trúc API Response chuẩn

Tất cả endpoints trả về format sau:

```json
{
  "success": true,
  "data": { ... },
  "message": "操作が完了しました",
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total": 150
  }
}
```

Lỗi:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力内容を確認してください",
    "details": { "email": ["必須項目です"] }
  }
}
```

---

## Cấu trúc thư mục Backend (mục tiêu)

```
src/app/
├── Http/
│   ├── Controllers/
│   │   └── Api/
│   │       ├── ApiController.php        ← base
│   │       ├── Auth/
│   │       │   └── AuthController.php
│   │       ├── Delivery/
│   │       │   ├── DeliveryController.php
│   │       │   ├── NotificationController.php
│   │       │   └── SosController.php
│   │       └── Admin/
│   │           ├── AreaController.php
│   │           ├── AuditLogController.php
│   │           ├── DashboardController.php
│   │           ├── InsertionController.php
│   │           ├── NewspaperTypeController.php
│   │           ├── ReportController.php
│   │           ├── RouteController.php
│   │           ├── SearchController.php
│   │           ├── ShiftController.php
│   │           ├── SosAlertController.php
│   │           ├── SubscriberController.php
│   │           └── UserController.php
│   ├── Middleware/
│   │   ├── EnsureIsAdmin.php
│   │   └── EnsureIsDeliverer.php
│   ├── Requests/
│   │   ├── Auth/
│   │   ├── Delivery/
│   │   └── Admin/
│   └── Responses/
│       └── ApiResponse.php
├── Models/
│   ├── AuditLog.php
│   ├── Area.php
│   ├── Delivery.php
│   ├── DeliveryLog.php
│   ├── NewInsertion.php
│   ├── NewspaperType.php
│   ├── Notification.php
│   ├── Route.php
│   ├── RoutePoint.php
│   ├── Shift.php
│   ├── Shop.php
│   ├── SosAlert.php
│   ├── Subscriber.php
│   ├── SubscriberNewspaper.php
│   ├── Suspension.php
│   └── User.php
├── Services/
│   ├── CsvExportService.php
│   ├── CsvImportService.php
│   ├── DeliveryRouteService.php
│   ├── DeliverySummaryService.php
│   ├── InsertionPositionService.php
│   ├── OfflineSyncService.php
│   ├── PhotoUploadService.php
│   ├── ReportAggregatorService.php
│   └── RouteOptimizationService.php
├── Jobs/
│   ├── ImportSubscribersJob.php
│   └── OptimizeRouteJob.php
├── Events/
│   ├── DeliveryCompleted.php
│   ├── NewInsertionApproved.php
│   ├── RouteUpdated.php
│   ├── SosAlertAcknowledged.php
│   ├── SosAlertCreated.php
│   ├── SuspensionCancelled.php
│   └── SuspensionCreated.php
└── Observers/
    └── AuditObserver.php
```

---

## Ghi chú kỹ thuật

- **Multi-tenant:** Tất cả queries phải scope theo `shop_id` của user đang đăng nhập
- **Soft delete:** `shops`, `users`, `areas`, `subscribers`, `routes` dùng `SoftDeletes`
- **GIS:** `subscribers.location` là `POINT` type, cần `DB::statement` để tạo SPATIAL INDEX
- **Audit:** Mọi thay đổi data quan trọng tự động ghi vào `audit_logs` qua Observer
- **Queue:** Route optimization và CSV import chạy qua Redis queue (không block HTTP)
- **Token:** Mobile token TTL 30 ngày, Admin token TTL 8 giờ

---

*Cập nhật lần cuối: 2026-04-03 — Phase 1-4 ✅ hoàn thành, Phase 5 🔄 đang thực hiện (WebSocket/Queue còn lại), Phase 6 ⏳ chờ*
