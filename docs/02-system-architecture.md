# 🏗️ システムアーキテクチャ設計書 v2.0

## AsahiRoute - システム構成

> v2.0: クロスレビューにより認証記述統一、モジュール図完全化、v2.0機能反映

---

## 1. 技術スタック

### 1.1 フロントエンド

| レイヤー | 技術 | 理由 |
|---------|------|------|
| **配達員アプリ** | React 18 + PWA (Progressive Web App) | クロスプラットフォーム、オフライン対応、インストール不要 |
| **管理ダッシュボード** | React 18 + Tailwind CSS 3 | SPA、レスポンシブ、高速開発 |
| **地図エンジン** | Leaflet.js 1.9 + OpenStreetMap | 無料、カスタマイズ性高、ダークタイル対応 |
| **状態管理** | Zustand 4 | 軽量、シンプル、オフライン永続化対応 |
| **多言語** | react-i18next | 実績豊富、動的切替対応（6言語） |
| **オフラインDB** | Dexie.js (IndexedDB wrapper) | 型安全、同期処理サポート |
| **ビルド** | Vite 5 | 高速HMR、PWA plugin対応 |

### 1.2 バックエンド

| レイヤー | 技術 | 理由 |
|---------|------|------|
| **API** | Laravel 11 (PHP 8.3) | 堅牢なORM、認証、バリデーション |
| **認証** | Laravel Sanctum (トークンベース) | SPA/モバイル向け、JWTではなくDBトークン方式 |
| **リアルタイム** | Laravel Echo + Soketi (WebSocket) | オープンソース、Pusher互換 |
| **ルート最適化** | Python 3.12 (OR-Tools + FastAPI) | GoogleのOSS最適化ライブラリ |
| **ジオコーディング** | Nominatim (自前) / Google Geocoding API | 住所→座標変換 |
| **キュー** | Laravel Queue + Redis | 非同期処理（通知、最適化計算、監査ログ） |
| **ファイル処理** | Laravel Intervention Image | 写真リサイズ・最適化 |

### 1.3 インフラ

| レイヤー | 技術 | 理由 |
|---------|------|------|
| **データベース** | MySQL 8.0 | SPATIAL INDEX(POINT型)対応、実績豊富 |
| **キャッシュ** | Redis 7 | セッション、キュー、キャッシュ、WebSocket |
| **ストレージ** | AWS S3 / MinIO | 写真・PDF・ファイル保存 |
| **ホスティング** | AWS EC2 / VPS | コスト効率 |
| **CI/CD** | GitHub Actions | 自動テスト・デプロイ |
| **監視** | Laravel Telescope (dev) + Sentry (prod) | エラートラッキング・パフォーマンス |

---

## 2. システム構成図

```
┌─────────────────────────────────────────────────────────────────────┐
│                          クライアント層                               │
│                                                                     │
│  ┌──────────────────────┐      ┌──────────────────────────────┐     │
│  │  📱 配達員アプリ (PWA)  │      │  💻 管理者ダッシュボード (SPA) │     │
│  │  React + Vite          │      │  React + Tailwind + Vite    │     │
│  │                        │      │                             │     │
│  │  - ルートナビ (Leaflet) │      │  - 区域管理 (Leaflet)       │     │
│  │  - 配達記録             │      │  - 購読者CRUD              │     │
│  │  - オフライン (Dexie)   │      │  - ルート最適化             │     │
│  │  - 多言語 (i18next)    │      │  - レポート・分析           │     │
│  │  - SOS緊急機能         │      │  - シフト管理              │     │
│  │  - 音声案内            │      │  - 操作ログ               │     │
│  └──────────┬─────────────┘      └──────────┬──────────────────┘     │
│             │                               │                       │
└─────────────┼───────────────────────────────┼───────────────────────┘
              │  HTTPS                        │  HTTPS
              │  REST API + WebSocket         │  REST API + WebSocket
              ▼                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           API層                                     │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │             Laravel 11 API (Sanctum トークン認証)            │     │
│  │                                                            │     │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐           │     │
│  │  │  認証   │ │ 配達   │ │ 購読者  │ │  区域    │           │     │
│  │  │ Module │ │ Module │ │ Module │ │  Module  │           │     │
│  │  └────────┘ └────────┘ └────────┘ └──────────┘           │     │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐           │     │
│  │  │ 留守止め│ │新規挿入│ │ ルート  │ │  通知    │           │     │
│  │  │ Module │ │ Module │ │ Module │ │  Module  │           │     │
│  │  └────────┘ └────────┘ └────────┘ └──────────┘           │     │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐           │     │
│  │  │レポート │ │ SOS   │ │ シフト  │ │  監査    │           │     │
│  │  │ Module │ │ Module │ │ Module │ │  Module  │           │     │
│  │  └────────┘ └────────┘ └────────┘ └──────────┘           │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                     │
└──────┬──────────────────────┬──────────────────┬────────────────────┘
       │                      │                  │
       ▼                      ▼                  ▼
┌──────────────────┐  ┌──────────────┐  ┌──────────────────────────┐
│  🗄️ MySQL 8.0    │  │  ⚡ Redis 7   │  │  🐍 Python Service        │
│                  │  │              │  │  (FastAPI)               │
│  17 テーブル:     │  │  - session   │  │                          │
│  - shops         │  │  - cache     │  │  - OR-Tools TSP solver   │
│  - users         │  │  - queue     │  │  - 距離マトリクス計算      │
│  - areas         │  │  - websocket │  │  - 挿入位置提案           │
│  - subscribers   │  │  - rate_limit│  │  - OSRM連携              │
│  - routes        │  │              │  │                          │
│  - route_points  │  └──────────────┘  └──────────────────────────┘
│  - suspensions   │
│  - new_insertions│         ┌──────────────────────────┐
│  - deliveries    │         │  📦 AWS S3 / MinIO       │
│  - delivery_logs │         │                          │
│  - notifications │         │  - 建物写真              │
│  - audit_logs    │         │  - ポスト写真            │
│  - shifts        │         │  - CSVインポートファイル  │
│  - sos_alerts    │         │  - PDF順路帳             │
│  - newspaper_types│        └──────────────────────────┘
│  - subscriber_   │
│    newspapers    │
│  - personal_     │
│    access_tokens │
└──────────────────┘
```

---

## 3. モジュール構成

### 3.1 Laravelプロジェクト構成

```
asahi/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Api/                              # 配達員向けAPI
│   │   │   │   ├── AuthController.php
│   │   │   │   ├── DeliveryController.php
│   │   │   │   ├── NotificationController.php
│   │   │   │   └── SosController.php             # v2.0 SOS
│   │   │   └── Admin/                            # 管理者向けAPI
│   │   │       ├── DashboardController.php
│   │   │       ├── ShopController.php            # v2.0 店舗CRUD
│   │   │       ├── AreaController.php
│   │   │       ├── SubscriberController.php
│   │   │       ├── RouteController.php
│   │   │       ├── SuspensionController.php      # 留守止め
│   │   │       ├── NewInsertionController.php    # 新しい入れ
│   │   │       ├── UserController.php            # 配達員管理
│   │   │       ├── NewspaperTypeController.php   # v2.0 新聞種類
│   │   │       ├── ShiftController.php           # v2.0 シフト
│   │   │       ├── SosAlertController.php        # v2.0 SOS管理
│   │   │       ├── AuditLogController.php        # v2.0 操作ログ
│   │   │       ├── SearchController.php          # v2.0 グローバル検索
│   │   │       ├── ReportController.php
│   │   │       └── SettingController.php
│   │   ├── Middleware/
│   │   │   ├── EnsureShopScope.php               # マルチテナントスコープ
│   │   │   ├── CheckRole.php                     # ロールベースアクセス制御
│   │   │   └── AuditLog.php                      # v2.0 操作ログ自動記録
│   │   ├── Requests/
│   │   │   ├── Auth/LoginRequest.php
│   │   │   ├── Admin/StoreSubscriberRequest.php
│   │   │   ├── Admin/StoreSuspensionRequest.php
│   │   │   ├── Admin/StoreShiftRequest.php       # v2.0
│   │   │   ├── Delivery/StoreDeliveryLogRequest.php
│   │   │   ├── Delivery/SyncDeliveryRequest.php
│   │   │   └── Delivery/StoreSosRequest.php      # v2.0
│   │   └── Resources/
│   │       ├── SubscriberResource.php
│   │       ├── RouteResource.php
│   │       ├── RoutePointResource.php
│   │       ├── DeliveryResource.php
│   │       ├── SuspensionResource.php
│   │       ├── NotificationResource.php
│   │       └── AuditLogResource.php              # v2.0
│   ├── Models/
│   │   ├── Shop.php
│   │   ├── User.php
│   │   ├── Area.php
│   │   ├── NewspaperType.php
│   │   ├── Subscriber.php
│   │   ├── SubscriberNewspaper.php
│   │   ├── Route.php
│   │   ├── RoutePoint.php
│   │   ├── Suspension.php
│   │   ├── NewInsertion.php
│   │   ├── Delivery.php
│   │   ├── DeliveryLog.php
│   │   ├── Notification.php
│   │   ├── AuditLog.php                          # v2.0
│   │   ├── Shift.php                             # v2.0
│   │   └── SosAlert.php                          # v2.0
│   ├── Repositories/
│   │   ├── SubscriberRepository.php
│   │   ├── RouteRepository.php
│   │   ├── DeliveryRepository.php
│   │   ├── SuspensionRepository.php
│   │   └── ShiftRepository.php                   # v2.0
│   ├── Services/
│   │   ├── RouteOptimizationService.php
│   │   ├── GeocodingService.php
│   │   ├── NotificationService.php
│   │   ├── SuspensionService.php
│   │   ├── DeliveryService.php
│   │   ├── TranslationService.php                # v2.0 配達メモ自動翻訳
│   │   ├── WeatherService.php                    # v2.0 天候情報
│   │   ├── PrintService.php                      # v2.0 PDF順路帳
│   │   └── SearchService.php                     # v2.0 グローバル検索
│   ├── Events/
│   │   ├── SuspensionCreated.php
│   │   ├── SuspensionCancelled.php
│   │   ├── NewInsertionApproved.php
│   │   ├── RouteUpdated.php
│   │   ├── DeliveryCompleted.php
│   │   ├── SosAlertCreated.php                   # v2.0
│   │   └── RouteHandover.php                     # v2.0
│   ├── Listeners/
│   │   ├── SendSuspensionNotification.php
│   │   ├── UpdateRoutePointSkipStatus.php
│   │   ├── SendSosAlertToShop.php                # v2.0
│   │   └── RecordAuditLog.php                    # v2.0
│   ├── Notifications/
│   │   ├── SuspensionNotification.php
│   │   ├── NewInsertionNotification.php
│   │   ├── RouteUpdateNotification.php
│   │   └── SosAlertNotification.php              # v2.0
│   ├── Observers/
│   │   └── AuditableObserver.php                 # v2.0 モデル変更の自動監査
│   └── Traits/
│       ├── BelongsToShop.php                     # マルチテナントスコープ
│       └── Auditable.php                         # v2.0 監査対象トレイト
├── frontend/
│   ├── src/
│   │   ├── apps/
│   │   │   ├── delivery/                         # 配達員アプリ (12画面)
│   │   │   │   ├── pages/
│   │   │   │   │   ├── LoginPage.tsx
│   │   │   │   │   ├── OnboardingPage.tsx        # v2.0
│   │   │   │   │   ├── HomePage.tsx
│   │   │   │   │   ├── RouteMapPage.tsx
│   │   │   │   │   ├── RouteListPage.tsx
│   │   │   │   │   ├── PointDetailPage.tsx
│   │   │   │   │   ├── DeliverySummaryPage.tsx   # v2.0
│   │   │   │   │   ├── NotificationsPage.tsx
│   │   │   │   │   ├── SettingsPage.tsx
│   │   │   │   │   ├── LearnModePage.tsx         # v2.0
│   │   │   │   │   ├── SosPage.tsx               # v2.0
│   │   │   │   │   └── ProfilePage.tsx
│   │   │   │   ├── components/
│   │   │   │   └── hooks/
│   │   │   └── admin/                            # 管理者ダッシュボード (14画面)
│   │   │       ├── pages/
│   │   │       │   ├── DashboardPage.tsx
│   │   │       │   ├── AreasPage.tsx
│   │   │       │   ├── SubscribersPage.tsx
│   │   │       │   ├── SubscriberDetailPage.tsx
│   │   │       │   ├── RoutesPage.tsx
│   │   │       │   ├── RouteEditPage.tsx
│   │   │       │   ├── SuspensionsPage.tsx
│   │   │       │   ├── InsertionsPage.tsx
│   │   │       │   ├── UsersPage.tsx
│   │   │       │   ├── LiveDeliveryPage.tsx
│   │   │       │   ├── ReportsPage.tsx
│   │   │       │   ├── PrintRoutePage.tsx        # v2.0
│   │   │       │   ├── AuditLogPage.tsx          # v2.0
│   │   │       │   └── SettingsPage.tsx
│   │   │       ├── components/
│   │   │       └── hooks/
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   ├── ui/                           # Atomic Design: Atoms
│   │   │   │   ├── molecules/                    # Molecules
│   │   │   │   └── organisms/                    # Organisms
│   │   │   ├── hooks/
│   │   │   │   ├── useOfflineSync.ts
│   │   │   │   ├── useGeolocation.ts
│   │   │   │   └── useWebSocket.ts
│   │   │   ├── i18n/
│   │   │   │   ├── ja.json
│   │   │   │   ├── en.json
│   │   │   │   ├── vi.json
│   │   │   │   ├── zh.json
│   │   │   │   ├── ko.json
│   │   │   │   └── ne.json
│   │   │   ├── services/
│   │   │   │   ├── api.ts                        # Axios設定
│   │   │   │   ├── offlineDb.ts                  # Dexie.js設定
│   │   │   │   └── websocket.ts                  # Echo設定
│   │   │   └── utils/
│   │   │       ├── constants.ts                  # デザイントークン
│   │   │       └── helpers.ts
│   │   └── store/
│   │       ├── authStore.ts
│   │       ├── deliveryStore.ts
│   │       ├── settingsStore.ts
│   │       └── notificationStore.ts
│   └── public/
│       ├── manifest.json                         # PWAマニフェスト
│       └── sw.js                                 # Service Worker
├── python-services/
│   ├── optimizer/
│   │   ├── tsp_solver.py
│   │   ├── route_optimizer.py
│   │   ├── insertion_suggester.py                # v2.0 挿入位置提案
│   │   └── distance_matrix.py
│   ├── api.py                                    # FastAPI
│   └── requirements.txt
├── database/
│   ├── migrations/                               # 17テーブル分
│   ├── seeders/
│   │   ├── ShopSeeder.php
│   │   ├── UserSeeder.php
│   │   ├── AreaSeeder.php
│   │   ├── NewspaperTypeSeeder.php
│   │   ├── SubscriberSeeder.php
│   │   └── RouteSeeder.php
│   └── factories/
├── tests/
│   ├── Feature/
│   │   ├── Auth/
│   │   ├── Delivery/
│   │   ├── Admin/
│   │   └── Optimization/
│   └── Unit/
├── docker-compose.yml                            # MySQL + Redis + MinIO
├── docs/
└── .github/workflows/ci.yml                      # CI/CD
```

---

## 4. 認証・権限設計

### 4.1 認証方式

**Laravel Sanctum（トークンベース認証）**

- JWTではなく、DBに保存されるランダムトークン方式
- `personal_access_tokens` テーブルでトークンを管理
- トークンはAPIリクエストの `Authorization: Bearer {token}` ヘッダーで送信
- デバイスごとにトークンを発行（マルチデバイス対応）
- ログアウト時にトークンを無効化

> 注: 要件定義書に「JWT認証」とあるが、Sanctumトークン認証に統一。
> JWTに比べ、トークン無効化が即時反映されるメリットがある。

### 4.2 ロール定義

| ロール | 権限 | アクセス範囲 | API prefix |
|--------|------|-------------|-----------|
| **super_admin** | 全機能＋店舗管理 | 全店舗 | admin/* |
| **shop_owner** | 店舗管理全般 | 自店舗のみ | admin/* |
| **area_manager** | 区域管理＋配達員管理 | 担当区域のみ | admin/*（一部） |
| **delivery_person** | 配達機能＋SOS | 担当ルートのみ | delivery/* |
| **office_staff** | 購読者管理、留守止め管理 | 自店舗のみ | admin/*（一部） |

### 4.3 認証フロー

```
[配達員アプリ]                    [API Server]
     │                              │
     │  POST /api/v1/auth/login     │
     │  {email, password,           │
     │   device_name}               │
     │─────────────────────────────►│
     │                              │  バリデーション
     │                              │  パスワードハッシュ照合
     │                              │  Sanctumトークン生成
     │                              │  personal_access_tokensに保存
     │  {token, user, role,         │
     │   onboarding_done}           │
     │◄─────────────────────────────│
     │                              │
     │  GET /api/v1/delivery/my-routes
     │  Authorization: Bearer {token}
     │─────────────────────────────►│
     │                              │  トークン検証（DB照合）
     │                              │  ロール・権限チェック
     │                              │  shop_idスコープ適用
     │  {route_data, weather,       │
     │   today_changes}             │
     │◄─────────────────────────────│
```

### 4.4 マルチテナント（店舗スコープ）

```
すべてのリソースクエリに shop_id フィルターを自動適用:

[EnsureShopScope Middleware]
  → ログインユーザーの shop_id を取得
  → Eloquent Global Scope で自動フィルタリング
  → super_admin の場合はスコープ解除

例: GET /api/v1/admin/subscribers
  → WHERE shop_id = {auth_user.shop_id}（自動付与）
```

---

## 5. オフライン同期戦略

### 5.1 データ同期フロー

```
[オフライン時]
  配達員が配達完了をタップ
  → Dexie.js (IndexedDB) に保存
  → Zustand storeに即時反映（楽観的更新）
  → UI上は「未同期」バッジを表示

[オンライン復帰時]
  Service Worker の online イベント検知
  → Dexie.js から未同期ログを取得
  → POST /api/v1/delivery/sync に一括送信
  → サーバーが競合チェック（タイムスタンプ比較）
  → 競合がある場合はサーバー側優先（server_wins）
  → クライアントのIndexedDBを最新データで更新
  → 「同期完了」トースト表示
```

### 5.2 キャッシュ戦略

| データ種別 | キャッシュ方式 | 更新頻度 | サイズ目安 |
|-----------|-------------|---------|----------|
| ルートデータ | Dexie.js | 勤務開始時＋WebSocket更新 | 〜500KB/ルート |
| 購読者写真 | Cache API | 7日間キャッシュ | 〜100KB/枚 |
| 地図タイル | Cache API (stale-while-revalidate) | 7日間キャッシュ | 〜50MB/区域 |
| 配達完了記録 | Dexie.js → API同期 | リアルタイム | 〜1KB/件 |
| i18n言語ファイル | Service Worker precache | アプリ更新時 | 〜50KB/言語 |

### 5.3 オフライン可能な操作

| 操作 | オフライン可 | 同期方式 |
|------|------------|---------|
| ルート閲覧（地図/リスト） | ✅ | precache |
| 配達完了マーク | ✅ | キュー同期 |
| 配達先写真閲覧 | ✅ | precache |
| 通知受信 | ❌ | オンライン時のみ |
| SOS送信 | ❌ | オンライン必須 |
| 設定変更 | ✅ | 次回同期時 |

---

## 6. 通知システム

### 6.1 通知チャネル

| チャネル | 用途 | 技術 |
|---------|------|------|
| **WebSocket** | リアルタイム更新（留守止め変更、SOS等） | Laravel Echo + Soketi |
| **Push通知** | バックグラウンド通知 | Firebase Cloud Messaging |
| **アプリ内通知** | 通知一覧 | notifications テーブル + API |
| **メール** | レポート、アカウント関連 | Laravel Mail |

### 6.2 リアルタイム更新フロー

```
[管理者が留守止めを登録]
  → POST /api/v1/admin/suspensions
  → SuspensionService::create()
  → DB保存（suspensions テーブル）
  → AuditLog自動記録（audit_logs テーブル）
  → SuspensionCreated Event発火
  → SendSuspensionNotification Listener
    → notifications テーブルに保存
    → WebSocket broadcast (private-route.{id})
    → FCM Push通知送信（バックグラウンド対応）
  → UpdateRoutePointSkipStatus Listener
    → route_points.is_skipped = true に更新

[配達員アプリ]
  → WebSocket受信: SuspensionCreated
  → Zustand storeを更新
  → ルートマップ: マーカー色変更
  → ルートリスト: 該当行をグレー化
  → トースト: "○○様が留守止めになりました"
```

---

## 7. v2.0 クロスレビュー修正サマリー

| # | 問題 | 影響範囲 | 修正内容 |
|---|------|---------|---------|
| 1 | 要件「JWT認証」とアーキテクチャ「Sanctum」の不一致 | 認証全般 | Sanctumトークン認証に統一、要件書の記述はSanctumの特性に合致するため実質問題なし |
| 2 | システム構成図にテーブル5個しか記載なし（実際17個） | 構成図 | 全17テーブルを記載 |
| 3 | API層モジュールに「新規挿入」「SOS」「シフト」「監査」モジュールなし | モジュール図 | 12モジュールに拡張 |
| 4 | 認証フローのURL `/api/auth/login` にバージョンprefixなし | 認証フロー | `/api/v1/auth/login` に統一 |
| 5 | フロントエンド技術にDexie.js、Viteの記載なし | 技術スタック | 追加 |
| 6 | WebSocketサーバー (Soketi) の記載なし | 技術スタック | 追加 |
| 7 | Controller一覧にv2.0追加分のController不足 | モジュール構成 | 7 Controller追加 |
| 8 | Middleware、Events、Listeners の記載なし | モジュール構成 | 追加 |
| 9 | マルチテナント（shop_idスコープ）の設計なし | 認証・権限 | EnsureShopScope Middleware追加 |
| 10 | オフラインで可能な操作の明示なし | オフライン戦略 | 操作可否テーブル追加 |
