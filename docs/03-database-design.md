# 🗄️ データベース設計書（ERD）v2.0

## AsahiRoute - MySQL 8.0

> v2.0: クロスレビューにより SPATIAL INDEX修正、4テーブル追加、フィールド不整合修正

---

## 1. ER図（テキスト表現）

```
┌──────────────┐
│    shops     │──┬──────────────────────────────────────────────┐
│ (新聞店)      │  │                                              │
└──────────────┘  │                                              │
                  ▼                                              ▼
          ┌──────────────────┐                         ┌──────────────────┐
          │     users        │────────────────────────>│  personal_access │
          │ (ユーザー)        │                         │  _tokens (Sanctum)│
          └──────┬───────────┘                         └──────────────────┘
                 │
        ┌────────┼────────────────────┐
        ▼        ▼                    ▼
┌──────────┐ ┌──────────┐    ┌──────────────┐
│  shifts  │ │deliveries│    │  sos_alerts  │
│(シフト)   │ │(配達記録) │    │(緊急SOS)     │
└──────────┘ └────┬─────┘    └──────────────┘
                  │
                  ▼
          ┌──────────────────┐
          │  delivery_logs   │
          │ (配達ログ)        │
          └──────────────────┘

┌──────────────┐     ┌──────────────────┐
│    areas     │────<│   routes         │
│ (配達区域)    │     │ (配達ルート)      │
└──────┬───────┘     └────────┬─────────┘
       │                      │
       ▼                      ▼
┌──────────────┐     ┌──────────────────┐
│ subscribers  │────<│  route_points    │
│ (購読者)      │     │ (ルートポイント)   │
└──────┬───────┘     └──────────────────┘
       │
       ├────────>┌──────────────────┐
       │         │  suspensions     │
       │         │ (留守止め)        │
       │         └──────────────────┘
       │
       ├────────>┌──────────────────┐
       │         │  new_insertions  │
       │         │ (新規挿入)        │
       │         └──────────────────┘
       │
       └────────>┌──────────────────────┐
                 │ subscriber_newspapers │
                 │ (購読者×新聞)         │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────┐
                 │ newspaper_types  │
                 │ (新聞種類)        │
                 └──────────────────┘

┌──────────────────┐     ┌──────────────────┐
│  notifications   │     │   audit_logs     │
│ (通知)           │     │ (操作ログ)        │
└──────────────────┘     └──────────────────┘
```

**テーブル一覧: 全17テーブル**（v1.0=13 + v2.0追加=4）

| # | テーブル名 | 説明 | v2.0追加 |
|---|-----------|------|---------|
| 1 | shops | 新聞店マスタ | - |
| 2 | users | ユーザーマスタ | - |
| 3 | personal_access_tokens | Sanctumトークン | - |
| 4 | areas | 配達区域マスタ | - |
| 5 | newspaper_types | 新聞種類マスタ | - |
| 6 | subscribers | 購読者マスタ | - |
| 7 | subscriber_newspapers | 購読者×新聞紐付け | - |
| 8 | routes | 配達ルート | - |
| 9 | route_points | ルートポイント（順路帳行） | - |
| 10 | suspensions | 留守止め管理 | - |
| 11 | new_insertions | 新規挿入管理 | - |
| 12 | deliveries | 配達記録 | - |
| 13 | delivery_logs | 配達ログ | - |
| 14 | notifications | 通知 | - |
| 15 | audit_logs | 操作ログ・監査証跡 | ✅ |
| 16 | shifts | シフト管理 | ✅ |
| 17 | sos_alerts | 緊急SOSアラート | ✅ |

---

## 2. テーブル定義

### 2.1 shops（新聞店）

```sql
CREATE TABLE shops (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(255) NOT NULL COMMENT '店舗名',
    code            VARCHAR(50) UNIQUE NOT NULL COMMENT '店舗コード',
    address         VARCHAR(500) NOT NULL COMMENT '住所',
    phone           VARCHAR(20) COMMENT '電話番号',
    emergency_phone VARCHAR(20) COMMENT '緊急連絡先（SOS用）',
    latitude        DECIMAL(10, 8) COMMENT '緯度',
    longitude       DECIMAL(11, 8) COMMENT '経度',
    is_active       BOOLEAN DEFAULT TRUE COMMENT '有効フラグ',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP NULL COMMENT 'ソフトデリート',

    INDEX idx_shops_code (code),
    INDEX idx_shops_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='新聞店マスタ';
```

### 2.2 users（ユーザー）

```sql
CREATE TABLE users (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    shop_id         BIGINT UNSIGNED NOT NULL COMMENT '所属店舗',
    name            VARCHAR(255) NOT NULL COMMENT '氏名',
    email           VARCHAR(255) UNIQUE NOT NULL COMMENT 'メールアドレス',
    password        VARCHAR(255) NOT NULL COMMENT 'パスワード（ハッシュ）',
    phone           VARCHAR(20) COMMENT '電話番号',
    role            ENUM('super_admin', 'shop_owner', 'area_manager', 'delivery_person', 'office_staff')
                    NOT NULL DEFAULT 'delivery_person' COMMENT '権限ロール',
    preferred_lang  VARCHAR(10) DEFAULT 'ja' COMMENT '優先言語 (ja/en/vi/zh/ko/ne)',
    font_size       ENUM('small', 'medium', 'large', 'extra_large')
                    DEFAULT 'medium' COMMENT 'フォントサイズ設定',
    voice_guide     BOOLEAN DEFAULT FALSE COMMENT '音声案内ON/OFF',
    dark_mode       ENUM('auto', 'on', 'off') DEFAULT 'auto' COMMENT '夜間モード設定',
    onboarding_done BOOLEAN DEFAULT FALSE COMMENT 'オンボーディング完了フラグ',
    is_active       BOOLEAN DEFAULT TRUE COMMENT '有効フラグ',
    last_login_at   TIMESTAMP NULL COMMENT '最終ログイン',
    email_verified_at TIMESTAMP NULL COMMENT 'メール認証日時',
    remember_token  VARCHAR(100) COMMENT 'リメンバートークン',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP NULL,

    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    INDEX idx_users_shop (shop_id),
    INDEX idx_users_role (role),
    INDEX idx_users_email (email),
    INDEX idx_users_active (shop_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='ユーザーマスタ';
```

### 2.3 personal_access_tokens（Sanctum認証トークン）

```sql
CREATE TABLE personal_access_tokens (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tokenable_type  VARCHAR(255) NOT NULL,
    tokenable_id    BIGINT UNSIGNED NOT NULL,
    name            VARCHAR(255) NOT NULL COMMENT 'デバイス名',
    token           VARCHAR(64) UNIQUE NOT NULL COMMENT 'トークンハッシュ',
    abilities       TEXT COMMENT '権限JSON',
    last_used_at    TIMESTAMP NULL,
    expires_at      TIMESTAMP NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_pat_tokenable (tokenable_type, tokenable_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Laravel Sanctum認証トークン';
```

### 2.4 areas（配達区域）

```sql
CREATE TABLE areas (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    shop_id         BIGINT UNSIGNED NOT NULL COMMENT '所属店舗',
    name            VARCHAR(255) NOT NULL COMMENT '区域名',
    code            VARCHAR(50) NOT NULL COMMENT '区域コード',
    description     TEXT COMMENT '区域説明',
    boundary_geojson JSON COMMENT '区域境界（GeoJSON Polygon）',
    color           VARCHAR(7) DEFAULT '#3B82F6' COMMENT '表示色',
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP NULL,

    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    UNIQUE KEY uk_area_code (shop_id, code),
    INDEX idx_areas_shop (shop_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='配達区域マスタ';
```

### 2.5 newspaper_types（新聞種類）

```sql
CREATE TABLE newspaper_types (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    shop_id         BIGINT UNSIGNED NOT NULL COMMENT '所属店舗',
    name            VARCHAR(255) NOT NULL COMMENT '新聞名（例：朝日新聞朝刊）',
    code            VARCHAR(50) NOT NULL COMMENT '新聞コード',
    delivery_time   ENUM('morning', 'evening') NOT NULL COMMENT '朝刊/夕刊',
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    UNIQUE KEY uk_newspaper_code (shop_id, code),
    INDEX idx_nt_shop (shop_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='新聞種類マスタ';
```

### 2.6 subscribers（購読者）

> v2.0修正: SPATIAL INDEXをPOINT型カラムに変更、`address_kana`追加（ふりがな対応）

```sql
CREATE TABLE subscribers (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    shop_id         BIGINT UNSIGNED NOT NULL COMMENT '所属店舗',
    area_id         BIGINT UNSIGNED NOT NULL COMMENT '配達区域',
    customer_code   VARCHAR(50) NOT NULL COMMENT '顧客コード',
    name            VARCHAR(255) NOT NULL COMMENT '購読者名',
    name_kana       VARCHAR(255) COMMENT '購読者名かな（検索用）',
    address         VARCHAR(500) NOT NULL COMMENT '住所',
    address_kana    VARCHAR(500) COMMENT '住所かな（ふりがな表示用）',
    address_detail  VARCHAR(255) COMMENT '住所詳細（マンション名・部屋番号等）',
    location        POINT NOT NULL COMMENT '位置情報（GIS）',
    phone           VARCHAR(20) COMMENT '電話番号',
    delivery_note   TEXT COMMENT '配達メモ（ポスト位置、注意事項等）',
    delivery_note_translations JSON COMMENT '配達メモ翻訳 {"en":"...","vi":"..."}',
    building_photo  VARCHAR(500) COMMENT '建物写真パス',
    mailbox_photo   VARCHAR(500) COMMENT 'ポスト写真パス',
    status          ENUM('active', 'suspended', 'cancelled') DEFAULT 'active' COMMENT '購読状態',
    contract_start  DATE COMMENT '契約開始日',
    contract_end    DATE COMMENT '契約終了日',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP NULL,

    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE,
    UNIQUE KEY uk_customer_code (shop_id, customer_code),
    INDEX idx_subscribers_area (area_id),
    INDEX idx_subscribers_status (status),
    INDEX idx_subscribers_name_kana (name_kana),
    SPATIAL INDEX idx_subscribers_location (location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='購読者マスタ';
```

**SPATIAL INDEX修正メモ:**
旧設計は `DECIMAL` の `latitude`/`longitude` にSPATIAL INDEXを貼っていたが、MySQL SPATIAL INDEXは `POINT`型にのみ対応。`location POINT NOT NULL` に変更。
アプリ層では `ST_X(location)` で緯度、`ST_Y(location)` で経度を取得する。

### 2.7 subscriber_newspapers（購読者×新聞紐付け）

```sql
CREATE TABLE subscriber_newspapers (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    subscriber_id   BIGINT UNSIGNED NOT NULL,
    newspaper_type_id BIGINT UNSIGNED NOT NULL,
    quantity        TINYINT UNSIGNED DEFAULT 1 COMMENT '部数',
    start_date      DATE NOT NULL COMMENT '購読開始日',
    end_date        DATE COMMENT '購読終了日',
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (subscriber_id) REFERENCES subscribers(id) ON DELETE CASCADE,
    FOREIGN KEY (newspaper_type_id) REFERENCES newspaper_types(id) ON DELETE CASCADE,
    UNIQUE KEY uk_sub_newspaper (subscriber_id, newspaper_type_id),
    INDEX idx_sub_news_active (subscriber_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='購読者×新聞紐付け';
```

### 2.8 routes（配達ルート）

```sql
CREATE TABLE routes (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    area_id         BIGINT UNSIGNED NOT NULL COMMENT '配達区域',
    name            VARCHAR(255) NOT NULL COMMENT 'ルート名',
    delivery_time   ENUM('morning', 'evening') NOT NULL COMMENT '朝刊/夕刊',
    assigned_user_id BIGINT UNSIGNED COMMENT '担当配達員',
    total_points    INT UNSIGNED DEFAULT 0 COMMENT '配達先数',
    estimated_duration_min INT UNSIGNED COMMENT '予想配達時間（分）',
    estimated_distance_m INT UNSIGNED COMMENT '予想距離（メートル）',
    optimized_at    TIMESTAMP NULL COMMENT '最終最適化日時',
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP NULL,

    FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_routes_area (area_id),
    INDEX idx_routes_user (assigned_user_id),
    INDEX idx_routes_time (delivery_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='配達ルート';
```

### 2.9 route_points（ルートポイント）

```sql
CREATE TABLE route_points (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    route_id        BIGINT UNSIGNED NOT NULL COMMENT '所属ルート',
    subscriber_id   BIGINT UNSIGNED NOT NULL COMMENT '購読者',
    sequence_order  INT UNSIGNED NOT NULL COMMENT '配達順序',
    is_skipped      BOOLEAN DEFAULT FALSE COMMENT 'スキップフラグ（留守止め等）',
    skip_reason     VARCHAR(255) COMMENT 'スキップ理由',
    notes           TEXT COMMENT '備考',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
    FOREIGN KEY (subscriber_id) REFERENCES subscribers(id) ON DELETE CASCADE,
    UNIQUE KEY uk_route_sequence (route_id, sequence_order),
    UNIQUE KEY uk_route_subscriber (route_id, subscriber_id),
    INDEX idx_rp_route_order (route_id, sequence_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='ルートポイント（順路帳の各行に対応）';
```

### 2.10 suspensions（留守止め）

```sql
CREATE TABLE suspensions (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    subscriber_id   BIGINT UNSIGNED NOT NULL COMMENT '対象購読者',
    start_date      DATE NOT NULL COMMENT '留守止め開始日',
    end_date        DATE NOT NULL COMMENT '留守止め終了日',
    reason          VARCHAR(500) COMMENT '理由',
    newspapers      JSON COMMENT '対象新聞 [newspaper_type_id, ...]（空=全て）',
    status          ENUM('scheduled', 'active', 'completed', 'cancelled')
                    DEFAULT 'scheduled' COMMENT '状態',
    registered_by   BIGINT UNSIGNED NOT NULL COMMENT '登録者',
    cancelled_by    BIGINT UNSIGNED COMMENT 'キャンセル者',
    cancelled_at    TIMESTAMP NULL COMMENT 'キャンセル日時',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (subscriber_id) REFERENCES subscribers(id) ON DELETE CASCADE,
    FOREIGN KEY (registered_by) REFERENCES users(id),
    FOREIGN KEY (cancelled_by) REFERENCES users(id),
    INDEX idx_susp_subscriber (subscriber_id),
    INDEX idx_susp_dates (start_date, end_date),
    INDEX idx_susp_status (status),
    INDEX idx_susp_active_lookup (subscriber_id, status, start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='留守止め管理';
```

### 2.11 new_insertions（新規挿入）

```sql
CREATE TABLE new_insertions (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    subscriber_id   BIGINT UNSIGNED NOT NULL COMMENT '新規購読者',
    route_id        BIGINT UNSIGNED COMMENT '挿入先ルート',
    suggested_order INT UNSIGNED COMMENT '提案挿入位置',
    actual_order    INT UNSIGNED COMMENT '確定挿入位置',
    status          ENUM('pending', 'approved', 'inserted', 'rejected')
                    DEFAULT 'pending' COMMENT '状態',
    effective_date  DATE NOT NULL COMMENT '配達開始日',
    registered_by   BIGINT UNSIGNED NOT NULL COMMENT '登録者',
    approved_by     BIGINT UNSIGNED COMMENT '承認者',
    approved_at     TIMESTAMP NULL COMMENT '承認日時',
    notes           TEXT COMMENT '備考',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (subscriber_id) REFERENCES subscribers(id) ON DELETE CASCADE,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL,
    FOREIGN KEY (registered_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    INDEX idx_ni_status (status),
    INDEX idx_ni_effective (effective_date),
    INDEX idx_ni_route (route_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='新規挿入管理';
```

### 2.12 deliveries（配達記録）

```sql
CREATE TABLE deliveries (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    route_id        BIGINT UNSIGNED NOT NULL COMMENT 'ルート',
    user_id         BIGINT UNSIGNED NOT NULL COMMENT '配達員',
    delivery_date   DATE NOT NULL COMMENT '配達日',
    delivery_time   ENUM('morning', 'evening') NOT NULL COMMENT '朝刊/夕刊',
    is_learning     BOOLEAN DEFAULT FALSE COMMENT '練習モードフラグ',
    started_at      TIMESTAMP NULL COMMENT '配達開始時刻',
    completed_at    TIMESTAMP NULL COMMENT '配達完了時刻',
    total_points    INT UNSIGNED DEFAULT 0 COMMENT '総配達先数（留守止め除外後）',
    total_delivered INT UNSIGNED DEFAULT 0 COMMENT '配達完了数',
    total_skipped   INT UNSIGNED DEFAULT 0 COMMENT 'スキップ数',
    total_failed    INT UNSIGNED DEFAULT 0 COMMENT '配達失敗数',
    total_distance_m INT UNSIGNED COMMENT '実走距離（メートル）',
    status          ENUM('not_started', 'in_progress', 'completed', 'incomplete')
                    DEFAULT 'not_started' COMMENT '配達状態',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_delivery_daily (route_id, delivery_date, delivery_time),
    INDEX idx_del_user_date (user_id, delivery_date),
    INDEX idx_del_status (status),
    INDEX idx_del_learning (is_learning)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='配達記録';
```

### 2.13 delivery_logs（配達ログ）

```sql
CREATE TABLE delivery_logs (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    delivery_id     BIGINT UNSIGNED NOT NULL COMMENT '配達記録',
    route_point_id  BIGINT UNSIGNED NOT NULL COMMENT 'ルートポイント',
    status          ENUM('delivered', 'skipped', 'failed', 'absent')
                    NOT NULL COMMENT '配達結果',
    delivered_at    TIMESTAMP NULL COMMENT '配達時刻',
    latitude        DECIMAL(10, 8) COMMENT '配達時GPS緯度',
    longitude       DECIMAL(11, 8) COMMENT '配達時GPS経度',
    failure_reason  VARCHAR(500) COMMENT '失敗理由',
    photo           VARCHAR(500) COMMENT '配達証拠写真パス',
    synced          BOOLEAN DEFAULT FALSE COMMENT 'サーバー同期済み',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE CASCADE,
    FOREIGN KEY (route_point_id) REFERENCES route_points(id) ON DELETE CASCADE,
    UNIQUE KEY uk_delivery_point (delivery_id, route_point_id),
    INDEX idx_dl_delivery (delivery_id),
    INDEX idx_dl_synced (synced)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='配達ログ（各配達先の結果）';
```

### 2.14 notifications（通知）

```sql
CREATE TABLE notifications (
    id              CHAR(36) PRIMARY KEY COMMENT 'UUID',
    user_id         BIGINT UNSIGNED NOT NULL COMMENT '送信先ユーザー',
    type            VARCHAR(100) NOT NULL COMMENT '通知タイプ',
    title           VARCHAR(255) NOT NULL COMMENT 'タイトル',
    body            TEXT NOT NULL COMMENT '本文',
    data            JSON COMMENT '追加データ',
    read_at         TIMESTAMP NULL COMMENT '既読日時',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notif_user_read (user_id, read_at),
    INDEX idx_notif_type (type),
    INDEX idx_notif_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='通知';
```

### 2.15 audit_logs（操作ログ・監査証跡）【v2.0追加】

```sql
CREATE TABLE audit_logs (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED COMMENT '操作者（NULLはシステム）',
    shop_id         BIGINT UNSIGNED COMMENT '対象店舗',
    action          VARCHAR(50) NOT NULL COMMENT '操作種別 (create/update/delete)',
    auditable_type  VARCHAR(255) NOT NULL COMMENT '対象モデル（例: App\\Models\\Suspension）',
    auditable_id    BIGINT UNSIGNED NOT NULL COMMENT '対象レコードID',
    old_values      JSON COMMENT '変更前の値',
    new_values      JSON COMMENT '変更後の値',
    ip_address      VARCHAR(45) COMMENT 'IPアドレス',
    user_agent      VARCHAR(500) COMMENT 'ユーザーエージェント',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_target (auditable_type, auditable_id),
    INDEX idx_audit_shop (shop_id),
    INDEX idx_audit_created (created_at),
    INDEX idx_audit_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='操作ログ・監査証跡';
```

### 2.16 shifts（シフト管理）【v2.0追加】

```sql
CREATE TABLE shifts (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED NOT NULL COMMENT '配達員',
    route_id        BIGINT UNSIGNED COMMENT '担当ルート',
    shift_date      DATE NOT NULL COMMENT 'シフト日',
    shift_type      ENUM('morning', 'evening', 'both') NOT NULL COMMENT 'シフト種別',
    status          ENUM('scheduled', 'confirmed', 'absent', 'substitute')
                    DEFAULT 'scheduled' COMMENT '状態',
    substitute_user_id BIGINT UNSIGNED COMMENT '代走配達員',
    notes           VARCHAR(500) COMMENT '備考',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL,
    FOREIGN KEY (substitute_user_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY uk_user_shift (user_id, shift_date, shift_type),
    INDEX idx_shifts_date (shift_date),
    INDEX idx_shifts_route (route_id, shift_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='シフト管理';
```

### 2.17 sos_alerts（緊急SOSアラート）【v2.0追加】

```sql
CREATE TABLE sos_alerts (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED NOT NULL COMMENT '発信者',
    shop_id         BIGINT UNSIGNED NOT NULL COMMENT '所属店舗',
    latitude        DECIMAL(10, 8) NOT NULL COMMENT 'SOS発信時GPS緯度',
    longitude       DECIMAL(11, 8) NOT NULL COMMENT 'SOS発信時GPS経度',
    status          ENUM('sent', 'acknowledged', 'resolved')
                    DEFAULT 'sent' COMMENT '状態',
    acknowledged_by BIGINT UNSIGNED COMMENT '確認者',
    acknowledged_at TIMESTAMP NULL COMMENT '確認日時',
    resolved_at     TIMESTAMP NULL COMMENT '解決日時',
    notes           TEXT COMMENT 'メモ',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
    FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_sos_shop (shop_id, status),
    INDEX idx_sos_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='緊急SOSアラート';
```

---

## 3. インデックス設計方針

| テーブル | インデックス | 用途 | 追加理由 |
|---------|------------|------|---------|
| subscribers | SPATIAL(location) | 近傍検索・最適化 | v2.0 POINT型修正 |
| subscribers | (area_id, status) | 区域別アクティブ購読者 | |
| subscribers | (name_kana) | かな検索 | v2.0追加 |
| route_points | (route_id, sequence_order) | ルート順序取得 | |
| suspensions | (subscriber_id, status, start_date, end_date) | 有効な留守止め判定 | 複合INDEX強化 |
| deliveries | (user_id, delivery_date) | 配達員別日次実績 | |
| delivery_logs | UNIQUE(delivery_id, route_point_id) | 二重記録防止 | v2.0追加 |
| audit_logs | (auditable_type, auditable_id) | 対象別操作履歴 | v2.0新テーブル |
| shifts | UNIQUE(user_id, shift_date, shift_type) | シフト重複防止 | v2.0新テーブル |
| sos_alerts | (shop_id, status) | 店舗別未解決SOS | v2.0新テーブル |

---

## 4. データ量見積もり

| テーブル | 1店舗あたり | 100店舗 | 増加ペース |
|---------|-----------|---------|-----------|
| shops | 1 | 100 | 月1-2件 |
| users | 20 | 2,000 | 月5件/店 |
| subscribers | 3,000 | 300,000 | 月50件/店 |
| routes | 15 | 1,500 | ほぼ固定 |
| route_points | 3,000 | 300,000 | 購読者に連動 |
| deliveries | 30/日 | 3,000/日 | 日次 |
| delivery_logs | 3,000/日 | 300,000/日 | 日次 |
| suspensions | 100/月 | 10,000/月 | 月次 |
| audit_logs | 200/日 | 20,000/日 | 日次（要定期パージ） |
| shifts | 30/月 | 3,000/月 | 月次 |
| sos_alerts | 1/月 | 100/月 | 低頻度 |

---

## 5. v2.0 クロスレビュー修正サマリー

| # | 問題 | 修正 |
|---|------|------|
| 1 | SPATIAL INDEXが DECIMAL列に貼られていた | `location POINT NOT NULL` に変更 |
| 2 | Sanctum用 `personal_access_tokens` テーブル未定義 | テーブル追加 |
| 3 | `newspaper_types` に `shop_id` がなくマルチテナント不可 | `shop_id` FK追加 |
| 4 | `subscriber_newspapers` にUNIQUE制約なし | UK追加 |
| 5 | `delivery_logs` に二重記録防止のUNIQUE制約なし | UK追加 |
| 6 | `suspensions` にキャンセル者の追跡なし | `cancelled_by`, `cancelled_at` 追加 |
| 7 | `new_insertions` に承認日時なし | `approved_at` 追加 |
| 8 | `deliveries` に練習モードフラグなし | `is_learning` 追加 |
| 9 | `deliveries` に実走距離フィールドなし | `total_distance_m` 追加 |
| 10 | `users` にオンボーディング完了フラグなし | `onboarding_done` 追加 |
| 11 | `users` にダークモード設定なし | `dark_mode` 追加 |
| 12 | `shops` に緊急連絡先なし（SOS機能用） | `emergency_phone` 追加 |
| 13 | `subscribers` にふりがなフィールドなし | `name_kana`, `address_kana` 追加 |
| 14 | v2.0 操作ログ機能のテーブルなし | `audit_logs` 追加 |
| 15 | v2.0 シフト管理のテーブルなし | `shifts` 追加 |
| 16 | v2.0 SOS機能のテーブルなし | `sos_alerts` 追加 |
