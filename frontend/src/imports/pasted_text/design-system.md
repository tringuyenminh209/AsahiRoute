# 🎨 UI/UX 共通デザインシステム v2.0

## AsahiRoute - Design System & Component Library

> 本ファイルはモバイル・デスクトップ共通のデザインルール・トークン・コンポーネントを定義する。
> 各画面の詳細設計は以下の個別ファイルを参照:
> - **[05a-mobile-delivery-design.md](./05a-mobile-delivery-design.md)** — 配達員モバイルアプリ（全12画面）
> - **[05b-desktop-admin-design.md](./05b-desktop-admin-design.md)** — 管理者デスクトップダッシュボード（全14画面）

---

## 1. 厳格デザインルール（Design Law）

> Figma Make や実装時に**必ず**遵守すべきルール。違反は設計不良とみなす。

### RULE-01: 8pxグリッドシステム

すべてのスペーシング・サイズは**8の倍数**で統一する。

```
Spacing Scale (Tailwind互換):
  --space-0:    0px
  --space-1:    4px     (例外的に4px許可: アイコン内余白のみ)
  --space-2:    8px     (最小余白)
  --space-3:   12px     (テキスト行間調整のみ)
  --space-4:   16px     (カード内パディング)
  --space-5:   20px
  --space-6:   24px     (セクション間)
  --space-8:   32px     (カード間)
  --space-10:  40px     (セクション大間隔)
  --space-12:  48px     (ページヘッダー高さ)
  --space-16:  64px     (ボトムナビ高さ)
```

### RULE-02: カラートークン（Design Tokens）

ハードコードの色値を**絶対に禁止**。必ずトークン変数を使う。

```css
/* === ブランドカラー === */
--color-primary-50:  #EFF6FF;
--color-primary-100: #DBEAFE;
--color-primary-200: #BFDBFE;
--color-primary-300: #93C5FD;
--color-primary-400: #60A5FA;
--color-primary-500: #3B82F6;   /* メインアクション */
--color-primary-600: #2563EB;   /* ホバー */
--color-primary-700: #1D4ED8;   /* アクティブ */
--color-primary-800: #1E40AF;   /* ロゴ・ヘッダー */
--color-primary-900: #1E3A8A;

/* === セマンティックカラー === */
--color-success-500: #22C55E;   /* 配達完了 */
--color-success-600: #16A34A;
--color-warning-400: #FBBF24;   /* 新規挿入・注意 */
--color-warning-500: #F59E0B;
--color-danger-500:  #EF4444;   /* エラー・失敗 */
--color-danger-600:  #DC2626;
--color-info-500:    #0EA5E9;   /* 情報 */

/* === ステータスカラー === */
--color-status-delivered:  #22C55E;
--color-status-pending:    #3B82F6;
--color-status-suspended:  #9CA3AF;
--color-status-new:        #F59E0B;
--color-status-failed:     #EF4444;
--color-status-in-progress:#8B5CF6;

/* === ニュートラル === */
--color-gray-50:  #F8FAFC;
--color-gray-100: #F1F5F9;
--color-gray-200: #E2E8F0;
--color-gray-300: #CBD5E1;
--color-gray-400: #94A3B8;
--color-gray-500: #64748B;
--color-gray-600: #475569;
--color-gray-700: #334155;
--color-gray-800: #1E293B;
--color-gray-900: #0F172A;

/* === ダークモード === */
[data-theme="dark"] {
  --surface-page:     #0F172A;
  --surface-card:     #1E293B;
  --surface-elevated: #334155;
  --surface-input:    #1E293B;
  --text-primary:     #F1F5F9;
  --text-secondary:   #94A3B8;
  --text-muted:       #64748B;
  --border-default:   #334155;
  --border-focus:     #3B82F6;
  --map-tiles:        CartoDB Dark Matter;
  --status-delivered: #4ADE80;
  --status-pending:   #60A5FA;
  --status-suspended: #6B7280;
  --status-new:       #FCD34D;
  --status-failed:    #F87171;
}
```

### RULE-03: タイポグラフィ

```
フォントファミリー:
  日本語: "Noto Sans JP", sans-serif
  英数字: "Inter", sans-serif
  フォールバック: system-ui, -apple-system

Font Weight:
  Regular: 400 (本文) | Medium: 500 (ラベル) | SemiBold: 600 (小見出し) | Bold: 700 (見出し)

Line Height:
  密: 1.25 (見出し) | 標準: 1.5 (本文) | 緩: 1.75 (多言語テキスト)
```

**フォントサイズスケール（4段階切替）:**

| トークン | 小 | 中（標準） | 大 | 特大 |
|---------|---|---------|---|-----|
| `--text-xs` | 10px | 12px | 14px | 16px |
| `--text-sm` | 12px | 14px | 16px | 18px |
| `--text-base` | 14px | 16px | 20px | 24px |
| `--text-lg` | 16px | 18px | 24px | 28px |
| `--text-xl` | 18px | 20px | 28px | 32px |
| `--text-2xl` | 20px | 24px | 32px | 40px |
| `--text-3xl` | 24px | 30px | 38px | 48px |

### RULE-04: コンポーネントサイズ

| 要素 | モバイル（配達員） | デスクトップ（管理者） |
|------|----------------|-------------------|
| タッチ/クリックターゲット | 最小44px、推奨48px | 最小32px |
| ボタン高さ（標準） | 48px | 40px |
| ボタン高さ（CTA） | 56px | 44px |
| 入力フィールド高さ | 52px | 40px |
| カード角丸 | 12px | 12px |
| カード影 | medium | small |
| カード内パディング | 16px | 20px |
| アイコン（標準） | 24px | 20px |

### RULE-05: ステータス表現の統一

**色＋形＋テキスト**の3要素で表現（色覚バリアフリー対応）。

| ステータス | 色 | 形状 | テキスト | Lucideアイコン |
|-----------|-----|------|---------|---------------|
| 配達済み | `#22C55E` | ✓チェック | 完了 / Done | `check-circle` |
| 未配達 | `#3B82F6` | ・中点 | 未配達 / Pending | `circle-dot` |
| 留守止め | `#9CA3AF` | / 斜線 | 留守 / Stopped | `circle-slash` |
| 新規 | `#F59E0B` | ★ 星 | 新規 / New | `star` |
| 失敗 | `#EF4444` | × バツ | 失敗 / Failed | `x-circle` |
| 配達中 | `#8B5CF6` | → 矢印 | 配達中 / Active | `arrow-right-circle` |

### RULE-06: アニメーション

```
--transition-fast:   150ms ease-out  (ホバー、トグル)
--transition-normal: 250ms ease-out  (モーダル、ドロワー)
--transition-slow:   350ms ease-out  (ページ遷移)

禁止: 300ms超のブロッキング、prefers-reduced-motion時は全無効化
```

### RULE-07: z-index

```
--z-base: 0 | --z-dropdown: 10 | --z-sticky: 20 | --z-overlay: 30
--z-modal: 40 | --z-toast: 50 | --z-tooltip: 60
```

### RULE-08: ブレイクポイント

```
--breakpoint-sm: 640px (モバイル上限)
--breakpoint-md: 768px (タブレット)
--breakpoint-lg: 1024px (デスクトップ開始)
--breakpoint-xl: 1280px (ワイドデスクトップ)
```

### RULE-09: 多言語テキスト拡張対策

| 言語 | 日本語比 | 対策 |
|------|---------|------|
| 日本語 | 1.0x | 基準 |
| 英語 | 1.3x | 折り返し許可 |
| ベトナム語 | 1.4x | 折り返し許可 |
| ネパール語 | 1.5x | 折り返し＋フォント調整 |

### RULE-10: アイコン規則

```
セット: Lucide Icons（統一）
ストローク幅: 1.5px（標準）、2px（大/特大モード）
カラー: currentColor継承
禁止: セット混在、ラスターアイコン、テキストなしアイコンボタン（ツールチップ必須）
```

---

## 2. Figma Make 共通プロンプトコンテキスト

> 全画面プロンプトの先頭にこのブロックを付与する。

```
【共通デザインコンテキスト - 全画面に適用】

アプリ名: AsahiRoute（新聞配達ルート最適化アプリ）
業種: 新聞配達業

デザインシステム:
- フォント: "Noto Sans JP"（日本語）+ "Inter"（英数字）
- グリッド: 8pxベースグリッド
- 角丸: 12px（カード）、8px（ボタン・入力）、全角丸（バッジ・アバター）
- 影: small=0 1px 2px rgba(0,0,0,0.05), medium=0 4px 6px rgba(0,0,0,0.1)

カラーパレット:
- Primary: #1E40AF（ダーク）、#3B82F6（標準）、#DBEAFE（ライト）
- Success/配達完了: #22C55E
- Warning/新規: #F59E0B
- Danger/失敗: #EF4444
- Gray系: #F8FAFC（背景）、#E2E8F0（ボーダー）、#64748B（2ndテキスト）、#1E293B（1stテキスト）
- 留守止め: #9CA3AF

アクセシビリティ:
- タッチターゲット最小44×44px
- WCAG AA準拠コントラスト比4.5:1以上
- 色のみでステータスを伝えない（形状＋テキストも併用）

スタイル: クリーン、プロフェッショナル、余白を活かしたモダンUI。
過度な装飾を避け、情報の可読性を最優先する。
```

---

## 3. コンポーネントライブラリ（Atomic Design）

### 3.1 Atoms

| コンポーネント | バリアント | 用途 |
|-------------|----------|------|
| Button | primary, secondary, ghost, danger / sm, md, lg, xl | 全画面 |
| Input | text, email, password, search / default, focus, error, disabled | フォーム |
| Badge | status(6色), count, label / sm, md | ステータス |
| Icon | Lucide全般 / 16, 20, 24, 32px | 全画面 |
| Toggle | on, off / default, disabled | 設定 |
| Avatar | image, initials / sm(32), md(40), lg(64)px | ユーザー |
| ProgressBar | linear, circular / 色6種 | 進捗 |
| Chip | selectable, removable / active, inactive | フィルター |
| Divider | horizontal, vertical / light, dark | 区切り |
| Skeleton | text, card, avatar, table-row | ローディング |

### 3.2 Molecules

| コンポーネント | 構成 | 主な使用先 |
|-------------|------|----------|
| FormField | ラベル+入力+エラー | フォーム全般 |
| SearchBar | アイコン+入力+クリア | 検索 |
| StatCard | アイコン+数値+ラベル+変化率 | ダッシュボード |
| NotificationItem | アイコン+タイトル+説明+時間 | 通知 |
| LanguageSelector | 言語チップ6個 | ログイン・設定 |
| StatusBadge | 色丸+形+テキスト（RULE-05準拠） | 全画面 |
| DeliveryPointItem | 番号+名前+住所+ステータス | ルートリスト |
| PhotoThumbnail | 画像+ラベル+拡大 | 配達先詳細 |
| DateRangePicker | 開始日+終了日+カレンダー | 留守止め管理 |
| StepIndicator | ステップ番号+ラベル+進捗線 | ウィザードフォーム |

### 3.3 Organisms

| コンポーネント | 説明 | 使用先 |
|-------------|------|-------|
| **モバイル専用** | | |
| DeliveryRouteCard | ルート情報カード | ホーム |
| MapWithMarkers | Leaflet地図+マーカー群 | ルートマップ |
| BottomSheet | ドラッグ可能なボトムシート | ルートマップ |
| BottomNavigation | 4タブ下部ナビ | 全画面 |
| SwipeableCard | 左右スワイプ対応カード | 配達操作 |
| SOSButton | フローティング緊急ボタン | 全画面 |
| **デスクトップ専用** | | |
| SideNavigation | 左サイドバー（240px） | 全画面 |
| TopBar | 検索+通知+ユーザー | 全画面 |
| DataTable | ソート+フィルター+ページネーション | 管理画面 |
| ModalDialog | sm/md/lg サイズ | CRUD操作 |
| CalendarGrid | 月間カレンダー（バー付き） | 留守止め・シフト |
| RouteOrderList | ドラッグ並び替えリスト | ルート編集 |
| SplitPane | 左地図+右リスト | ルート管理 |
| **共通** | | |
| ToastNotification | 成功/エラー/情報トースト | 全画面 |
| ConfirmDialog | 確認ダイアログ | 重要操作 |
| EmptyState | アイコン+メッセージ+CTA | データなし時 |

---

## 4. アクセシビリティ規則

### 4.1 高齢者向け

| 規則 | 根拠 |
|------|------|
| タッチターゲット最小56×56px（大モード） | WCAG 2.5.8 |
| コントラスト比4.5:1以上 | WCAG 1.4.3 AA |
| 主要機能まで最大2タップ | ユーザビリティ |
| タップ時に視覚＋触覚＋音声の3重FB | 高齢者UX |
| 重要操作は確認ダイアログ必須 | エラー防止 |
| 無限スクロール禁止 | 認知負荷軽減 |

### 4.2 外国人留学生向け

| 規則 |
|------|
| すべてのボタン・ラベルにアイコン併用 |
| 配達メモは管理者入力→AI翻訳→配達員言語で表示 |
| 日本語UI時、住所にふりがなオプション |
| 建物・ポスト写真を配達メモより上に配置 |
| ルート番号は色・形状・数字の3要素表現 |
| システムメッセージはJLPT N4レベルの簡易日本語 |

### 4.3 色覚バリアフリー

| ステータス | 色 | パターン | 形状 | テキスト |
|-----------|---|---------|------|---------|
| 配達済み | 緑 | 塗りつぶし | ✓ | "完了" |
| 未配達 | 青 | ドット | ・ | "未配達" |
| 留守止め | グレー | 斜線ハッチ | / | "留守" |
| 新規 | 黄 | 星パターン | ★ | "NEW" |
| 失敗 | 赤 | ×クロス | × | "失敗" |
