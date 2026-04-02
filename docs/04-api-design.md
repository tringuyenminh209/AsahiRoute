# 🔌 API設計書 v2.0

## AsahiRoute - RESTful API v1

> v2.0: クロスレビューにより欠落API追加、命名統一、v2.0新機能反映

---

## 1. API設計原則

- **RESTful**: リソース指向、HTTP動詞準拠
- **JSON**: リクエスト/レスポンスはJSON形式
- **認証**: Laravel Sanctum（トークンベース認証）
- **バージョニング**: URL prefix `/api/v1/`
- **ページネーション**: cursor-based（モバイル）、offset-based（管理画面）
- **エラーハンドリング**: 統一エラーレスポンス形式
- **マルチテナント**: 全リソースは `shop_id` でスコープ
- **監査**: 作成/更新/削除はすべて `audit_logs` に自動記録

---

## 2. 共通レスポンス形式

### 成功レスポンス

```json
{
    "success": true,
    "data": { ... },
    "message": "操作が成功しました",
    "meta": {
        "current_page": 1,
        "per_page": 20,
        "total": 100
    }
}
```

### エラーレスポンス

```json
{
    "success": false,
    "message": "バリデーションエラー",
    "errors": {
        "email": ["メールアドレスは必須です"],
        "name": ["名前は255文字以内で入力してください"]
    },
    "error_code": "VALIDATION_ERROR"
}
```

### エラーコード一覧

| コード | HTTPステータス | 説明 |
|--------|-------------|------|
| VALIDATION_ERROR | 422 | バリデーション失敗 |
| UNAUTHORIZED | 401 | 未認証 |
| FORBIDDEN | 403 | 権限不足 |
| NOT_FOUND | 404 | リソースなし |
| CONFLICT | 409 | 競合（オフライン同期時） |
| SERVER_ERROR | 500 | サーバーエラー |

---

## 3. 認証API

### 3.1 ログイン
```
POST /api/v1/auth/login
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|---|------|------|
| email | string | ○ | メールアドレス |
| password | string | ○ | パスワード |
| device_name | string | ○ | デバイス名（例: "iPhone 15"） |

**レスポンス:**
```json
{
    "success": true,
    "data": {
        "token": "1|abc123...",
        "user": {
            "id": 1,
            "name": "山田太郎",
            "email": "yamada@example.com",
            "role": "delivery_person",
            "shop_id": 1,
            "shop_name": "朝日新聞 下関店",
            "preferred_lang": "ja",
            "font_size": "large",
            "voice_guide": true,
            "dark_mode": "auto",
            "onboarding_done": false
        }
    }
}
```

### 3.2 ログアウト
```
POST /api/v1/auth/logout
Authorization: Bearer {token}
```

### 3.3 ユーザー情報取得
```
GET /api/v1/auth/me
Authorization: Bearer {token}
```

### 3.4 設定更新
```
PUT /api/v1/auth/settings
Authorization: Bearer {token}
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|---|------|------|
| preferred_lang | string | - | 優先言語 (ja/en/vi/zh/ko/ne) |
| font_size | string | - | small/medium/large/extra_large |
| voice_guide | boolean | - | 音声案内ON/OFF |
| dark_mode | string | - | auto/on/off |
| onboarding_done | boolean | - | オンボーディング完了 |

---

## 4. 配達員向けAPI

### 4.1 自分のルート取得
```
GET /api/v1/delivery/my-routes
Authorization: Bearer {token}
```

**クエリパラメータ:**
| パラメータ | 型 | 説明 |
|-----------|---|------|
| date | date | 配達日（デフォルト:今日） |
| time | string | morning/evening |

**レスポンス:**
```json
{
    "success": true,
    "data": {
        "route": {
            "id": 1,
            "name": "A区域-朝刊ルート",
            "area_name": "A区域",
            "delivery_time": "morning",
            "total_points": 150,
            "active_points": 147,
            "estimated_duration_min": 90,
            "estimated_distance_m": 12500,
            "points": [
                {
                    "id": 1,
                    "sequence_order": 1,
                    "subscriber": {
                        "id": 101,
                        "name": "田中様",
                        "name_kana": "たなかさま",
                        "address": "山口県下関市○○町1-2-3",
                        "address_kana": "やまぐちけん しものせきし ○○ちょう",
                        "address_detail": "ライオンズマンション 301号",
                        "latitude": 33.9500,
                        "longitude": 130.9500,
                        "delivery_note": "2階ポスト、右から3番目",
                        "delivery_note_translations": {
                            "en": "2nd floor mailbox, 3rd from right",
                            "vi": "Hộp thư tầng 2, thứ 3 từ phải"
                        },
                        "building_photo": "https://s3.../building_101.jpg",
                        "mailbox_photo": "https://s3.../mailbox_101.jpg"
                    },
                    "newspapers": [
                        {"id": 1, "name": "朝日新聞朝刊", "quantity": 1}
                    ],
                    "is_suspended": false,
                    "suspension": null,
                    "is_new": false,
                    "new_insertion": null
                }
            ]
        },
        "today_changes": {
            "new_suspensions": 2,
            "ended_suspensions": 1,
            "new_insertions": 1,
            "changes": [
                {"type": "suspension_new", "subscriber_name": "鈴木様", "detail": "4/1〜4/10 旅行"},
                {"type": "insertion_new", "subscriber_name": "佐藤様", "detail": "#45の後に挿入"}
            ]
        },
        "weather": {
            "condition": "sunny",
            "temperature": 12,
            "warning": null
        }
    }
}
```

### 4.2 配達開始
```
POST /api/v1/delivery/start
Authorization: Bearer {token}
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|---|------|------|
| route_id | integer | ○ | ルートID |
| delivery_date | date | ○ | 配達日 |
| delivery_time | string | ○ | morning/evening |
| is_learning | boolean | - | 練習モード（デフォルト: false） |

### 4.3 配達完了記録（単発）
```
POST /api/v1/delivery/log
Authorization: Bearer {token}
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|---|------|------|
| delivery_id | integer | ○ | 配達記録ID |
| route_point_id | integer | ○ | ルートポイントID |
| status | string | ○ | delivered/skipped/failed/absent |
| latitude | decimal | - | GPS緯度 |
| longitude | decimal | - | GPS経度 |
| failure_reason | string | - | 失敗理由（status=failedのとき必須） |

### 4.4 配達ログ一括同期（オフライン復帰用）
```
POST /api/v1/delivery/sync
Authorization: Bearer {token}
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|---|------|------|
| delivery_id | integer | ○ | 配達記録ID |
| logs | array | ○ | 配達ログの配列 |
| logs[].route_point_id | integer | ○ | ルートポイントID |
| logs[].status | string | ○ | 配達結果 |
| logs[].delivered_at | datetime | ○ | 配達時刻（端末時刻） |
| logs[].latitude | decimal | - | GPS緯度 |
| logs[].longitude | decimal | - | GPS経度 |
| logs[].failure_reason | string | - | 失敗理由 |

**レスポンス（競合解決付き）:**
```json
{
    "success": true,
    "data": {
        "synced": 45,
        "conflicts": [
            {
                "route_point_id": 12,
                "client_status": "delivered",
                "server_status": "skipped",
                "resolution": "server_wins",
                "reason": "留守止めが配達後に登録された"
            }
        ]
    }
}
```

### 4.5 配達完了（ルート全体）
```
POST /api/v1/delivery/{id}/complete
Authorization: Bearer {token}
```

**レスポンス（サマリー付き）:**
```json
{
    "success": true,
    "data": {
        "delivery_id": 1,
        "summary": {
            "total_delivered": 145,
            "total_skipped": 3,
            "total_failed": 0,
            "duration_min": 78,
            "distance_m": 11800,
            "started_at": "2026-04-02T04:15:00",
            "completed_at": "2026-04-02T05:33:00",
            "comparison": {
                "prev_duration_min": 85,
                "duration_diff_min": -7,
                "improvement_percent": 8.2
            }
        }
    }
}
```

### 4.6 通知取得
```
GET /api/v1/delivery/notifications
Authorization: Bearer {token}
```

| パラメータ | 型 | 説明 |
|-----------|---|------|
| unread_only | boolean | 未読のみ |
| limit | integer | 件数制限（デフォルト: 20） |

### 4.7 通知既読
```
PUT /api/v1/delivery/notifications/{id}/read
Authorization: Bearer {token}
```

### 4.8 SOS緊急送信【v2.0追加】
```
POST /api/v1/delivery/sos
Authorization: Bearer {token}
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|---|------|------|
| latitude | decimal | ○ | GPS緯度 |
| longitude | decimal | ○ | GPS経度 |
| notes | string | - | 状況メモ |

### 4.9 ルート引き継ぎ（代走転送）【v2.0追加】
```
POST /api/v1/delivery/handover
Authorization: Bearer {token}
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|---|------|------|
| delivery_id | integer | ○ | 配達記録ID |
| to_user_id | integer | ○ | 引き継ぎ先ユーザーID |
| notes | string | - | 引き継ぎメモ |

---

## 5. 管理者向けAPI

> 全エンドポイントに `Authorization: Bearer {token}` ＋ ロールベースアクセス制御が適用される。

### 5.1 店舗管理【v2.0追加: 欠落補完】

```
GET    /api/v1/admin/shops                     # 店舗一覧（super_adminのみ）
POST   /api/v1/admin/shops                     # 店舗作成
GET    /api/v1/admin/shops/{id}                # 店舗詳細
PUT    /api/v1/admin/shops/{id}                # 店舗更新
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|---|------|------|
| name | string | ○ | 店舗名 |
| code | string | ○ | 店舗コード |
| address | string | ○ | 住所 |
| phone | string | - | 電話番号 |
| emergency_phone | string | - | 緊急連絡先 |

### 5.2 新聞種類管理【v2.0追加: 欠落補完】

```
GET    /api/v1/admin/newspaper-types           # 新聞種類一覧
POST   /api/v1/admin/newspaper-types           # 新聞種類登録
PUT    /api/v1/admin/newspaper-types/{id}      # 新聞種類更新
DELETE /api/v1/admin/newspaper-types/{id}      # 新聞種類削除
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|---|------|------|
| name | string | ○ | 新聞名（例: 朝日新聞朝刊） |
| code | string | ○ | 新聞コード（例: asahi_morning） |
| delivery_time | string | ○ | morning/evening |

### 5.3 区域管理

```
GET    /api/v1/admin/areas                    # 区域一覧
POST   /api/v1/admin/areas                    # 区域作成
GET    /api/v1/admin/areas/{id}               # 区域詳細
PUT    /api/v1/admin/areas/{id}               # 区域更新
DELETE /api/v1/admin/areas/{id}               # 区域削除
GET    /api/v1/admin/areas/{id}/subscribers   # 区域内購読者一覧
GET    /api/v1/admin/areas/{id}/routes        # 区域内ルート一覧
GET    /api/v1/admin/areas/{id}/stats         # 区域統計
```

### 5.4 購読者管理

```
GET    /api/v1/admin/subscribers              # 購読者一覧
POST   /api/v1/admin/subscribers              # 購読者登録
GET    /api/v1/admin/subscribers/{id}         # 購読者詳細
PUT    /api/v1/admin/subscribers/{id}         # 購読者更新
DELETE /api/v1/admin/subscribers/{id}         # 購読者削除（ソフト）
POST   /api/v1/admin/subscribers/import       # CSV一括インポート
GET    /api/v1/admin/subscribers/export       # CSVエクスポート
POST   /api/v1/admin/subscribers/{id}/photos  # 写真アップロード【v2.0追加】
POST   /api/v1/admin/subscribers/photos/bulk  # 一括写真アップロード【v2.0追加】
```

**購読者登録パラメータ:**
| パラメータ | 型 | 必須 | 説明 |
|-----------|---|------|------|
| area_id | integer | ○ | 区域ID |
| customer_code | string | ○ | 顧客コード |
| name | string | ○ | 購読者名 |
| name_kana | string | - | 購読者名かな |
| address | string | ○ | 住所 |
| address_kana | string | - | 住所かな（ふりがな） |
| address_detail | string | - | 住所詳細（マンション名等） |
| phone | string | - | 電話番号 |
| delivery_note | string | - | 配達メモ |
| auto_translate | boolean | - | 配達メモを自動翻訳するか |
| newspapers | array | ○ | 購読新聞 |
| newspapers[].newspaper_type_id | integer | ○ | 新聞種類ID |
| newspapers[].quantity | integer | - | 部数（デフォルト: 1） |
| building_photo | file | - | 建物写真 |
| mailbox_photo | file | - | ポスト写真 |

### 5.5 留守止め管理

```
GET    /api/v1/admin/suspensions              # 留守止め一覧
POST   /api/v1/admin/suspensions              # 留守止め登録
GET    /api/v1/admin/suspensions/{id}         # 留守止め詳細
PUT    /api/v1/admin/suspensions/{id}         # 留守止め更新
DELETE /api/v1/admin/suspensions/{id}         # 留守止めキャンセル
GET    /api/v1/admin/suspensions/active       # 有効な留守止め一覧
POST   /api/v1/admin/suspensions/bulk         # 一括留守止め登録
GET    /api/v1/admin/suspensions/calendar     # カレンダービュー用データ【v2.0追加】
```

**カレンダーAPI クエリパラメータ:**
| パラメータ | 型 | 説明 |
|-----------|---|------|
| year | integer | 年（例: 2026） |
| month | integer | 月（例: 4） |
| area_id | integer | 区域フィルター（任意） |

**留守止め登録パラメータ:**
| パラメータ | 型 | 必須 | 説明 |
|-----------|---|------|------|
| subscriber_id | integer | ○ | 購読者ID |
| start_date | date | ○ | 開始日 |
| end_date | date | ○ | 終了日 |
| reason | string | - | 理由 |
| newspapers | array | - | 対象新聞ID（空=全新聞） |

> `registered_by` は認証ユーザーから自動設定。

### 5.6 新規挿入管理

```
GET    /api/v1/admin/insertions               # 新規挿入一覧
POST   /api/v1/admin/insertions               # 新規挿入登録
GET    /api/v1/admin/insertions/{id}          # 新規挿入詳細
PUT    /api/v1/admin/insertions/{id}          # 新規挿入更新
POST   /api/v1/admin/insertions/{id}/approve  # 承認
POST   /api/v1/admin/insertions/{id}/reject   # 却下
GET    /api/v1/admin/insertions/{id}/suggest-position  # 挿入位置提案
```

### 5.7 ルート管理

```
GET    /api/v1/admin/routes                   # ルート一覧
POST   /api/v1/admin/routes                   # ルート作成
GET    /api/v1/admin/routes/{id}              # ルート詳細
PUT    /api/v1/admin/routes/{id}              # ルート更新
DELETE /api/v1/admin/routes/{id}              # ルート削除
PUT    /api/v1/admin/routes/{id}/reorder      # 順序変更
POST   /api/v1/admin/routes/{id}/optimize     # ルート最適化実行
GET    /api/v1/admin/routes/{id}/preview      # 最適化プレビュー
POST   /api/v1/admin/routes/{id}/assign       # 配達員割当
GET    /api/v1/admin/routes/{id}/print        # 印刷用順路帳データ【v2.0追加】
```

**印刷API レスポンス:**
```json
{
    "success": true,
    "data": {
        "route_name": "A区域 朝刊ルート",
        "generated_at": "2026-04-02T08:00:00",
        "assigned_user": "佐藤太郎",
        "total_points": 148,
        "suspended_count": 3,
        "points": [
            {
                "order": 1,
                "customer_code": "A-0001",
                "name": "山本太郎 様",
                "address": "○○町1-1",
                "newspapers": "朝日朝刊×1",
                "note": "2階ポスト",
                "status": "active"
            }
        ]
    }
}
```

### 5.8 配達員管理

```
GET    /api/v1/admin/users                    # ユーザー一覧
POST   /api/v1/admin/users                    # ユーザー登録
GET    /api/v1/admin/users/{id}               # ユーザー詳細
PUT    /api/v1/admin/users/{id}               # ユーザー更新
DELETE /api/v1/admin/users/{id}               # ユーザー無効化
GET    /api/v1/admin/users/{id}/deliveries    # 配達実績
GET    /api/v1/admin/users/{id}/performance   # パフォーマンス統計【v2.0追加】
```

### 5.9 シフト管理【v2.0追加】

```
GET    /api/v1/admin/shifts                   # シフト一覧
POST   /api/v1/admin/shifts                   # シフト登録
PUT    /api/v1/admin/shifts/{id}              # シフト更新
DELETE /api/v1/admin/shifts/{id}              # シフト削除
GET    /api/v1/admin/shifts/calendar          # カレンダー表示用
POST   /api/v1/admin/shifts/bulk              # 一括シフト登録
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|---|------|------|
| user_id | integer | ○ | 配達員ID |
| route_id | integer | - | 担当ルートID |
| shift_date | date | ○ | シフト日 |
| shift_type | string | ○ | morning/evening/both |

### 5.10 SOS管理【v2.0追加】

```
GET    /api/v1/admin/sos-alerts               # SOSアラート一覧
PUT    /api/v1/admin/sos-alerts/{id}/acknowledge  # SOS確認
PUT    /api/v1/admin/sos-alerts/{id}/resolve      # SOS解決
```

### 5.11 レポート

```
GET    /api/v1/admin/reports/daily            # 日次レポート
GET    /api/v1/admin/reports/weekly           # 週次レポート
GET    /api/v1/admin/reports/monthly          # 月次レポート
GET    /api/v1/admin/reports/delivery-stats   # 配達統計
GET    /api/v1/admin/reports/area-stats       # 区域統計
GET    /api/v1/admin/reports/user-performance # 配達員パフォーマンス
```

### 5.12 ダッシュボード

```
GET    /api/v1/admin/dashboard/summary        # 全体サマリー
GET    /api/v1/admin/dashboard/today          # 本日の状況
GET    /api/v1/admin/dashboard/alerts         # アラート一覧
```

### 5.13 グローバル検索【v2.0追加】

```
GET    /api/v1/admin/search
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|---|------|------|
| q | string | ○ | 検索クエリ（3文字以上） |
| type | string | - | subscriber/area/user/route（絞り込み） |
| limit | integer | - | 件数制限（デフォルト: 10） |

**レスポンス:**
```json
{
    "success": true,
    "data": {
        "subscribers": [
            {"id": 1, "name": "田中太郎", "code": "A-0001", "address": "○○町1-2-3"}
        ],
        "areas": [],
        "users": [],
        "routes": []
    }
}
```

### 5.14 操作ログ【v2.0追加】

```
GET    /api/v1/admin/audit-logs               # 操作ログ一覧
GET    /api/v1/admin/audit-logs/export        # CSV出力
```

| パラメータ | 型 | 説明 |
|-----------|---|------|
| user_id | integer | 操作者フィルター |
| action | string | create/update/delete |
| auditable_type | string | モデルフィルター |
| date_from | date | 開始日 |
| date_to | date | 終了日 |
| per_page | integer | ページサイズ |

---

## 6. ルート最適化API（Pythonサービス）

> Laravel → Python (FastAPI) への内部通信。クライアントは直接呼ばない。

### 6.1 ルート最適化

```
POST /optimize/route
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|---|------|------|
| start_point | object | ○ | 出発点 {lat, lng}（店舗位置） |
| end_point | object | - | 帰還点 {lat, lng}（デフォルト=出発点） |
| points | array | ○ | 配達先リスト [{id, lat, lng}, ...] |
| constraints | object | - | 制約条件 |
| constraints.one_way_streets | array | - | 一方通行リスト |
| constraints.avoid_points | array | - | 回避ポイント |

**レスポンス:**
```json
{
    "success": true,
    "data": {
        "optimized_order": [3, 1, 7, 2, 5],
        "total_distance_m": 12500,
        "estimated_duration_min": 85,
        "savings": {
            "distance_saved_m": 3200,
            "time_saved_min": 15,
            "improvement_percent": 20.4
        }
    }
}
```

### 6.2 挿入位置提案

```
POST /optimize/suggest-insertion
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|---|------|------|
| route_points | array | ○ | 既存ルートポイント |
| new_point | object | ○ | 新規ポイント {lat, lng} |
| start_point | object | ○ | 出発点 |

**レスポンス:**
```json
{
    "success": true,
    "data": {
        "suggested_position": 45,
        "after_subscriber_id": 101,
        "distance_impact_m": 120,
        "time_impact_min": 1,
        "alternatives": [
            {"position": 44, "distance_impact_m": 180},
            {"position": 46, "distance_impact_m": 150}
        ]
    }
}
```

---

## 7. WebSocket イベント

### 7.1 チャネル定義

| チャネル | 対象 | 認証 |
|---------|------|------|
| `private-user.{id}` | 個人 | ユーザーID一致 |
| `private-shop.{id}` | 店舗全員 | shop_id一致 |
| `private-route.{id}` | ルート担当者 | assigned_user_id一致 |

### 7.2 イベント一覧

| イベント名 | トリガー | ペイロード |
|-----------|---------|----------|
| `SuspensionCreated` | 留守止め登録 | `{suspension_id, subscriber_id, subscriber_name, start_date, end_date}` |
| `SuspensionCancelled` | 留守止め解除 | `{suspension_id, subscriber_id, subscriber_name}` |
| `NewInsertionApproved` | 新規挿入承認 | `{insertion_id, subscriber, route_id, position}` |
| `RouteUpdated` | ルート変更 | `{route_id, change_type, changes}` |
| `RouteHandover` | ルート引き継ぎ | `{delivery_id, from_user, to_user}` |
| `DeliveryCompleted` | 配達完了 | `{delivery_id, user_id, stats}` |
| `SosAlertCreated` | SOS発信 | `{alert_id, user_id, user_name, latitude, longitude}` |
| `SosAlertAcknowledged` | SOS確認 | `{alert_id, acknowledged_by}` |

---

## 8. API × DB × Architecture 整合性マトリクス

| 機能 | DBテーブル | APIエンドポイント | Architectureモジュール |
|------|----------|----------------|---------------------|
| 認証 | users, personal_access_tokens | auth/* | 認証Module ✅ |
| 店舗管理 | shops | admin/shops/* | ─（super_admin専用） ✅ |
| 区域管理 | areas | admin/areas/* | 区域管理Module ✅ |
| 新聞種類 | newspaper_types | admin/newspaper-types/* | ─（設定系） ✅ |
| 購読者管理 | subscribers, subscriber_newspapers | admin/subscribers/* | 購読者Module ✅ |
| ルート管理 | routes, route_points | admin/routes/* | ルート最適化Module ✅ |
| 留守止め | suspensions | admin/suspensions/* | 留守止めModule ✅ |
| 新規挿入 | new_insertions | admin/insertions/* | 新規挿入Module ✅ |
| 配達記録 | deliveries, delivery_logs | delivery/* | 配達管理Module ✅ |
| 通知 | notifications | delivery/notifications/* | 通知Module ✅ |
| SOS | sos_alerts | delivery/sos, admin/sos-alerts/* | SOSModule ✅ |
| シフト | shifts | admin/shifts/* | 配達員管理Module ✅ |
| 操作ログ | audit_logs | admin/audit-logs/* | 監査Module ✅ |
| レポート | (集計クエリ) | admin/reports/* | レポートModule ✅ |
| 検索 | (全文検索) | admin/search | ─（横断機能） ✅ |
| 最適化 | (外部サービス) | optimize/* | Python Service ✅ |
