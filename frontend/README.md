# 🗞️ AsahiRoute - 新聞配達管理システム

AsahiRoute là hệ thống quản lý phân phối báo toàn diện với hai giao diện chính:
- **Mobile App**: Dành cho nhân viên giao báo (375×812px)
- **Admin Dashboard**: Dành cho quản lý cửa hàng (1280×900px+)

## 🚀 Cấu Trúc Dự Án

### Landing Page
- **Route**: `/`
- **Component**: `Landing.tsx`
- Trang chọn giao diện: Mobile App hoặc Admin Dashboard

### 📱 Mobile App (Nhân Viên Giao Báo)

#### Base Route: `/mobile`

**Màn Hình Chính (12 màn hình):**
1. **Login** - `/login` - Đăng nhập với 6 ngôn ngữ
2. **Onboarding** - `/onboarding` - Hướng dẫn lần đầu
3. **Home** - `/mobile` - Dashboard tổng quan
4. **Route Map** - `/mobile/route/:id/map` - Bản đồ lộ trình
5. **Route List** - `/mobile/route/:id/list` - Danh sách điểm giao
6. **Delivery Point Detail** - `/mobile/route/:id/point/:pointId` - Chi tiết điểm giao
7. **Delivery Summary** - `/mobile/delivery/:id/summary` - Tổng kết ca làm
8. **Notifications** - `/mobile/notifications` - Thông báo
9. **Settings** - `/mobile/settings` - Cài đặt
10. **Learn Mode** - `/mobile/route/:id/learn` - Học tập lộ trình
11. **SOS** - `/mobile/sos` - Khẩn cấp
12. **Profile** - `/mobile/profile` - Hồ sơ cá nhân

**Đặc Điểm Mobile:**
- Thiết kế mobile-first (375×812px)
- Dark mode cho ca sáng sớm (3:00-6:00)
- Nút chạm lớn (44-56px)
- Hỗ trợ 6 ngôn ngữ: Nhật, Anh, Việt, Trung, Hàn, Nepal
- GPS tracking và navigation
- Voice guidance
- Offline support

### 🖥️ Admin Dashboard (Quản Lý)

#### Base Route: `/admin`

**Layout:**
- Left Sidebar: 240px (collapsible to 64px)
- Top Bar: 64px với global search
- Main Content Area

**14 Màn Hình Quản Lý:**

1. **Dashboard** - `/admin` (A1)
   - KPI cards (Hoàn thành, Đang giao, Chưa bắt đầu, Nghỉ)
   - Tiến độ theo khu vực
   - Thay đổi hôm nay
   - Cảnh báo

2. **Area Management** - `/admin/areas` (A2)
   - Map view với polygons
   - Danh sách khu vực
   - Chỉnh sửa ranh giới

3. **Subscriber Management** - `/admin/subscribers` (A3)
   - Data table với filters
   - Import/Export CSV
   - Bulk operations
   - Tìm kiếm nâng cao

4. **Subscriber Detail** - `/admin/subscribers/:id` (A4)
   - Thông tin chi tiết
   - Lịch sử giao báo
   - Gallery ảnh
   - Activity timeline

5. **Route Management** - `/admin/routes` (A5)
   - Map + List view
   - AI optimization
   - Drag & drop reordering
   - Stats (distance, time, points)

6. **Route Edit** - `/admin/routes/:id/edit` (A6)
   - Interactive map editing
   - Point management
   - Undo/Redo

7. **Suspension Management** - `/admin/suspensions` (A7)
   - Table view & Calendar view
   - Bulk registration
   - Date range filters

8. **Insertion Management** - `/admin/insertions` (A8)
   - AI position suggestions
   - Approval workflow
   - Impact analysis

9. **User Management** - `/admin/users` (A9)
   - Card, Table, Shift views
   - Performance metrics
   - Shift calendar

10. **Live Tracking** - `/admin/deliveries/live` (A10)
    - Real-time map
    - Status indicators
    - SOS alerts
    - Progress monitoring

11. **Reports** - `/admin/reports` (A11)
    - Charts (Line, Bar)
    - KPI metrics
    - Area breakdown
    - Export PDF/CSV

12. **Print Route** - `/admin/routes/:id/print` (A12)
    - PDF preview
    - Print settings
    - Backup route book

13. **Audit Log** - `/admin/audit-log` (A13)
    - Change history
    - User tracking
    - Diff viewer

14. **Settings** - `/admin/settings` (A14)
    - 5 tabs: Store, Newspapers, Notifications, Roles, System
    - Configuration management

**Đặc Điểm Admin:**
- Desktop-optimized (1280×900px+)
- Responsive down to tablet (768px)
- Keyboard shortcuts (Ctrl+K, Ctrl+N, etc.)
- Real-time WebSocket updates
- Advanced data tables
- Charts & analytics

## 🎨 Design System

### Color Tokens
```css
Primary: #3B82F6
Success: #22C55E
Warning: #F59E0B
Danger: #EF4444
```

### Typography
- Font: Noto Sans JP (日本語), Inter (Latin)
- Scale: 12px - 30px
- Grid: 8px strict

### Components
- Buttons: 44-56px min height
- Cards: 12px border-radius
- Shadows: Subtle elevations
- Transitions: 150-350ms

## 🛠️ Tech Stack

- **Framework**: React + Vite
- **Routing**: React Router v7
- **Styling**: Tailwind CSS v4
- **Maps**: React Leaflet
- **Charts**: Recharts
- **Icons**: Lucide React
- **Forms**: React Hook Form
- **DnD**: React DnD

## 📦 Project Structure

```
/src
  /app
    /layouts
      - RootLayout.tsx (Mobile)
      - AdminLayout.tsx (Admin)
    /pages
      - Landing.tsx
      - Login.tsx
      - Onboarding.tsx
      - Home.tsx (Mobile)
      ... (Mobile pages)
      /admin
        - Dashboard.tsx
        - AreaManagement.tsx
        ... (Admin pages)
    /components
      - Reusable components
    - routes.tsx
    - App.tsx
  /styles
    - theme.css (Design tokens)
    - fonts.css
```

## 🚦 Getting Started

1. Install dependencies:
```bash
pnpm install
```

2. Run development server:
```bash
pnpm dev
```

3. Navigate to:
- Landing: `http://localhost:5173/`
- Mobile: `http://localhost:5173/mobile`
- Admin: `http://localhost:5173/admin`

## 📱 Mobile Routes

```
/login              → Login page
/onboarding         → First-time tutorial
/mobile             → Home dashboard
/mobile/route/:id/map      → Map view
/mobile/route/:id/list     → List view
/mobile/route/:id/point/:pointId  → Point detail
/mobile/delivery/:id/summary      → Summary
/mobile/notifications       → Notifications
/mobile/settings           → Settings
/mobile/route/:id/learn    → Learn mode
/mobile/sos                → Emergency
/mobile/profile            → Profile
```

## 🖥️ Admin Routes

```
/admin                      → Dashboard
/admin/areas                → Area Management
/admin/subscribers          → Subscriber List
/admin/subscribers/:id      → Subscriber Detail
/admin/routes               → Route Management
/admin/routes/:id/edit      → Route Editor
/admin/routes/:id/print     → Print Preview
/admin/suspensions          → Suspension Management
/admin/insertions           → Insertion Management
/admin/users                → User Management
/admin/deliveries/live      → Live Tracking
/admin/reports              → Reports
/admin/audit-log            → Audit Log
/admin/settings             → Settings
```

## 🌐 Multi-Language Support

Supported languages:
- 🇯🇵 日本語 (Japanese)
- 🇬🇧 English
- 🇻🇳 Tiếng Việt (Vietnamese)
- 🇨🇳 中文 (Chinese)
- 🇰🇷 한국어 (Korean)
- 🇳🇵 नेपाली (Nepali)

## 🔑 Key Features

### Mobile
- ✅ Real-time GPS tracking
- ✅ Offline mode
- ✅ Voice navigation
- ✅ Photo capture
- ✅ SOS emergency button
- ✅ Dark mode (auto 3:00-6:00)
- ✅ Large touch targets
- ✅ Accessibility optimized

### Admin
- ✅ Real-time dashboard
- ✅ AI route optimization
- ✅ Advanced filtering
- ✅ Bulk operations
- ✅ CSV Import/Export
- ✅ PDF generation
- ✅ WebSocket live updates
- ✅ Audit trail
- ✅ Charts & analytics

## 📄 License

© 2026 AsahiRoute. All rights reserved.
