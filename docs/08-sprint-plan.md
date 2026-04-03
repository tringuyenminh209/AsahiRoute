# AsahiRoute — Sprint Plan (Phase 6 Frontend Integration)

> Kế hoạch chi tiết tích hợp frontend với backend API thực.  
> **Bắt đầu:** 2026-04-04

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
- [ ] `useQuery` GET `/delivery/notifications?unread_only=false&limit=50`
- [ ] `useMutation` PUT `/delivery/notifications/:id/read`
- [ ] Mark all as read: PUT `/delivery/notifications/read-all`
- [ ] Real-time count update (badge trên bell icon ở Home)

#### SOS.tsx
- [ ] Lấy GPS coords từ browser `navigator.geolocation`
- [ ] `useMutation` POST `/delivery/sos` với lat/lng/notes
- [ ] Loading state + success/error feedback
- [ ] Disable nút sau khi gửi (tránh spam)

#### Settings.tsx
- [ ] `useQuery` GET `/auth/me` → hiển thị user info
- [ ] `useMutation` PUT `/auth/settings` — cập nhật lang/font/dark_mode/voice
- [ ] Sync `selectedLanguage` với `LanguageContext.setLanguage`
- [ ] Logout button → `authService.logout()` → clear store → navigate `/login`

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
- [ ] CSV import: drag-drop file → `subscriberService.import(file)` → toast

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
- [ ] Assign deliverer: PUT `/admin/routes/:id/assign`

#### RouteEdit.tsx
- [ ] `useQuery` GET `/admin/routes/:id` (route + points)
- [ ] Drag-drop reorder (dnd-kit) → local state
- [ ] Save: PUT `/admin/routes/:id/reorder`
- [ ] Print: navigate to `/admin/routes/:id/print`

#### UserManagement.tsx
- [x] `useQuery` GET `/admin/users`
- [x] Deactivate user (DELETE)
- [ ] Create/Edit user form

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
- [ ] Áp dụng cho Home, RouteList, RouteMap (còn lại)

#### Error Boundary
- [x] `ErrorBoundary` component bao quanh Outlet (RootLayout + AdminLayout)
- [x] Fallback UI với "再読み込み" button

#### Skeleton Loaders
- [x] `SkeletonCard`, `SkeletonRow`, `SkeletonDelivererCard` components
- [x] Áp dụng cho: Dashboard KPI cards, SubscriberManagement table rows

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

*Cập nhật lần cuối: 2026-04-04*
