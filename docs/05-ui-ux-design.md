# 🎨 UI/UX 共通デザインシステム v3.0

## AsahiRoute - Design System & Component Library

> **v3.0: 朝日新聞ブランドスタイルに統一。カラーパレット・タイポグラフィ・コンポーネントスタイルを asahi.com に合わせて全面改訂。**
>
> 本ファイルはモバイル・デスクトップ共通のデザインルール・トークン・コンポーネントを定義する。
> 各画面の詳細設計は以下の個別ファイルを参照:
> - **[05a-mobile-delivery-design.md](./05a-mobile-delivery-design.md)** — 配達員モバイルアプリ（全15画面：Landing + Login + Onboarding + 12アプリ画面）
> - **[05b-desktop-admin-design.md](./05b-desktop-admin-design.md)** — 管理者デスクトップダッシュボード（全15画面：Admin Login + 14管理画面）

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
/* === 朝日ブランドカラー（asahi.com準拠） === */
--color-primary-50:  #FFF5F5;
--color-primary-100: #FFE5E5;
--color-primary-200: #FFCCCC;
--color-primary-300: #FF9999;
--color-primary-400: #E63333;
--color-primary-500: #CC0000;   /* メインアクション（朝日レッド） */
--color-primary-600: #B30000;   /* ホバー */
--color-primary-700: #990000;   /* アクティブ */
--color-primary-800: #800000;   /* 強調 */
--color-primary-900: #660000;

/* === 朝日ニュートラル（新聞トーン） === */
--color-asahi-black:   #1A1A1A; /* ヘッダー・見出し・ロゴ */
--color-asahi-dark:    #333333; /* 本文テキスト */
--color-asahi-medium:  #666666; /* 2ndテキスト */
--color-asahi-light:   #999999; /* 補助テキスト */
--color-asahi-border:  #E5E5E5; /* カード区切り線 */
--color-asahi-bg:      #F5F5F5; /* セクション背景 */
--color-asahi-white:   #FFFFFF; /* ページ背景 */

/* === セマンティックカラー（UX機能色 — 変更なし） === */
--color-success-500: #22C55E;   /* 配達完了 */
--color-success-600: #16A34A;
--color-warning-400: #FBBF24;   /* 新規挿入・注意 */
--color-warning-500: #F59E0B;
--color-danger-500:  #EF4444;   /* エラー・SOS・失敗 */
--color-danger-600:  #DC2626;
--color-info-500:    #0EA5E9;   /* 情報 */

/* === ステータスカラー（UX機能色 — 変更なし） === */
--color-status-delivered:  #22C55E;
--color-status-pending:    #CC0000; /* 朝日レッド */
--color-status-suspended:  #9CA3AF;
--color-status-new:        #F59E0B;
--color-status-failed:     #EF4444;
--color-status-in-progress:#8B5CF6;

/* === ニュートラル（Tailwind互換） === */
--color-gray-50:  #FAFAFA;
--color-gray-100: #F5F5F5;
--color-gray-200: #E5E5E5;
--color-gray-300: #D4D4D4;
--color-gray-400: #A3A3A3;
--color-gray-500: #737373;
--color-gray-600: #525252;
--color-gray-700: #404040;
--color-gray-800: #262626;
--color-gray-900: #171717;

/* === ダークモード（夜間配達モード） === */
[data-theme="dark"] {
  --surface-page:     #121212;
  --surface-card:     #1E1E1E;
  --surface-elevated: #2A2A2A;
  --surface-input:    #1E1E1E;
  --text-primary:     #F5F5F5;
  --text-secondary:   #A3A3A3;
  --text-muted:       #737373;
  --border-default:   #333333;
  --border-focus:     #CC0000;
  --map-tiles:        CartoDB Dark Matter;
  --status-delivered: #4ADE80;
  --status-pending:   #FF6666;
  --status-suspended: #6B7280;
  --status-new:       #FCD34D;
  --status-failed:    #F87171;
}
```

### RULE-03: タイポグラフィ（朝日新聞スタイル）

```
フォントファミリー:
  見出し（日本語）: "Noto Serif JP", serif     ← 新聞の格調・信頼感
  本文（日本語）:   "Noto Sans JP", sans-serif  ← 可読性重視
  英数字:           "Inter", sans-serif
  フォールバック:   system-ui, -apple-system, "Hiragino Sans"

Font Weight:
  Regular: 400 (本文) | Medium: 500 (ラベル・h1〜h4ベース) | SemiBold: 600 (小見出し) | Bold: 700 (見出し)

Line Height:
  密: 1.25 (見出し) | 標準: 1.5 (本文・h1〜h4・label・button・input) | 緩: 1.75 (多言語テキスト)

見出し使い分け:
  h1, h2: Noto Serif JP Bold — ページタイトル・セクション見出し（手動適用: font-family指定）
  h3以下:  Noto Sans JP SemiBold — サブ見出し・カードタイトル
  本文:    Noto Sans JP Regular — 全テキスト

実装Note:
  fonts.css でGoogle Fonts 3書体を@import済み。
  theme.css の @layer base で h1-h4 は font-weight: medium, line-height: 1.5 を設定。
  Noto Serif JP は h1/h2 に手動で className="font-serif" 等で適用する。
  自動適用ではないため、Serif見出しが必要な箇所で明示指定が必要。
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
| カード角丸 | **4px** | **4px** |
| カード区切り | **border-bottom 1px #E5E5E5** | **border-bottom 1px #E5E5E5** |
| カード内パディング | 16px | 20px |
| アイコン（標準） | 24px | 20px |

### RULE-05: ステータス表現の統一

**色＋形＋テキスト**の3要素で表現（色覚バリアフリー対応）。

| ステータス | 色 | 形状 | テキスト | Lucideアイコン |
|-----------|-----|------|---------|---------------|
| 配達済み | `#22C55E` | ✓チェック | 完了 / Done | `check-circle` |
| 未配達 | `#CC0000` | ・中点 | 未配達 / Pending | `circle-dot` |
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
メイン: Lucide React（lucide-react v0.487）— 全画面で統一使用
補助:   MUI Icons（@mui/icons-material v7.3）— 一部Material Designアイコン
ストローク幅: 1.5px（標準）、2px（大/特大モード）
カラー: currentColor継承
禁止: ラスターアイコン、テキストなしアイコンボタン（ツールチップ必須）
```

---

## 1.5 フロントエンド技術スタック（実装済み）

> frontend/ で使用中のライブラリ・フレームワーク一覧。

### コア

| カテゴリ | ライブラリ | バージョン | 用途 |
|---------|----------|-----------|------|
| フレームワーク | React | 18.3.1 | UIコア |
| ビルド | Vite | 6.3.5 | 高速ビルド・HMR |
| ルーティング | React Router | 7.13.0 | SPA画面遷移 |
| CSS | Tailwind CSS | 4.1.12 | ユーティリティCSS |
| 言語 | TypeScript | - | 型安全 |

### UIコンポーネント

| カテゴリ | ライブラリ | 用途 |
|---------|----------|------|
| プリミティブ | Radix UI | Dialog, Dropdown, Tabs, Switch, Select 等20+コンポーネント |
| デザインシステム | shadcn/ui パターン | Radix + Tailwind統合 (class-variance-authority, clsx, tailwind-merge) |
| Material | MUI v7 | 一部のMaterial Designコンポーネント |
| アイコン | Lucide React + MUI Icons | Lucideメイン、MUI補助 |

### 機能ライブラリ

| カテゴリ | ライブラリ | 用途 |
|---------|----------|------|
| 地図 | React Leaflet + Leaflet | ルートマップ・ライブ追跡 |
| チャート | Recharts | レポート・ダッシュボードグラフ |
| アニメーション | Motion (Framer Motion) | ページ遷移・UI動作 |
| ドラッグ&ドロップ | React DnD | ルート順序変更 |
| フォーム | React Hook Form | バリデーション付きフォーム |
| 日付 | date-fns + React Day Picker | 日付選択・フォーマット |
| トースト | Sonner | 通知トースト |
| ドロワー | Vaul | モバイルボトムシート |
| カルーセル | Embla Carousel | オンボーディング・スライダー |
| スワイプ | react-swipeable | モバイルスワイプジェスチャー |
| プルリフレッシュ | react-pull-to-refresh | モバイルプルリフレッシュ |
| コマンドパレット | cmdk | Ctrl+K グローバル検索 |

### テーマシステム（theme.css）

```
2系統のCSS変数が共存:

1. Asahi Brand Tokens（本デザインシステム準拠）:
   --color-primary-500: #CC0000（朝日レッド）
   --color-asahi-black: #1A1A1A
   --surface-*, --text-*, --border-* 等

2. shadcn/Radix互換レイヤー:
   --primary: #1E40AF → shadcn/Radixコンポーネント用（移行予定）
   --background, --foreground, --card, --border 等（oklch値）
   --sidebar-* 系変数

※ 新規コンポーネントは Asahi Brand Tokens を優先使用すること。
※ shadcn互換レイヤーは段階的にAsahi Tokensへ統一予定。
```

### 状態管理

```
現在: React Context（LanguageContext のみ）
予定: Zustand（グローバル状態）、Dexie.js（オフラインDB）— 未実装
```

---

## 2. Figma Make 共通プロンプトコンテキスト

> 全画面プロンプトの先頭にこのブロックを付与する。

```
【共通デザインコンテキスト - 全画面に適用（v3.0 朝日新聞ブランド）】

アプリ名: AsahiRoute（新聞配達ルート最適化アプリ）
業種: 新聞配達業（朝日新聞社系列）

デザインシステム:
- フォント見出し: "Noto Serif JP"（日本語見出し — 新聞の格調）
- フォント本文: "Noto Sans JP"（日本語本文）+ "Inter"（英数字）
- グリッド: 8pxベースグリッド
- 角丸: 4px（カード — シャープで新聞的）、8px（ボタン・入力）、全角丸（バッジ・アバター）
- 区切り: shadow非使用。border-bottom 1px #E5E5E5 でカード区切り

カラーパレット（朝日新聞ブランド）:
- Primary/朝日レッド: #CC0000（メイン）、#990000（ダーク）、#FFF5F5（ライト）
- 見出し・ロゴ: #1A1A1A（朝日ブラック）
- 本文: #333333 | 2ndテキスト: #666666 | 補助: #999999
- 背景: #FFFFFF（ページ）、#F5F5F5（セクション）
- ボーダー: #E5E5E5
- Success/配達完了: #22C55E（UX機能色 — 変更なし）
- Warning/新規: #F59E0B（UX機能色 — 変更なし）
- Danger/SOS/失敗: #EF4444（UX機能色 — 変更なし）
- 留守止め: #9CA3AF

アクセシビリティ:
- タッチターゲット最小44×44px
- WCAG AA準拠コントラスト比4.5:1以上
- 色のみでステータスを伝えない（形状＋テキストも併用）

スタイル: 朝日新聞の信頼感と格調を継承。シャープなライン、
新聞的なセリフ見出し、赤と黒の力強いコントラスト。
過度な装飾を避け、情報の可読性と権威性を最優先。
```

---

## 2.5 画面ルーティングマップ（実装済み）

```
/                          → Landing（Mobile/Admin選択画面）
/login                     → 配達員ログイン
/admin/login               → 管理者ログイン
/onboarding                → オンボーディング（3スライド）

/mobile/                   → ホームダッシュボード
  ├── route/:id/map        → ルートマップ（Leaflet）
  ├── route/:id/list       → ルートリスト
  ├── route/:id/point/:pid → 配達先詳細
  ├── route/:id/learn      → 学習モード
  ├── delivery/:id/summary → 配達サマリー
  ├── notifications        → 通知一覧
  ├── delivery-inventory   → 配達物一覧（新規）
  ├── delivery-status-management → 配達状態管理（新規）
  ├── settings             → 設定
  ├── sos                  → SOS緊急
  └── profile              → プロフィール

/admin/                    → ダッシュボード（A1）
  ├── areas                → 区域管理（A2）
  ├── subscribers          → 購読者管理（A3）
  ├── subscribers/:id      → 購読者詳細（A4）
  ├── routes               → ルート管理（A5）
  ├── routes/:id/edit      → ルート編集（A6）
  ├── routes/:id/print     → 印刷順路帳（A12）※サブページ
  ├── suspensions          → 留守止め管理（A7）
  ├── insertions           → 新規挿入管理（A8）
  ├── users                → 配達員管理（A9）
  ├── deliveries/live      → リアルタイム配達（A10）
  ├── reports              → レポート（A11）
  ├── audit-log            → 操作ログ（A13）
  └── settings             → 店舗設定（A14）
```

---

## 3. コンポーネントライブラリ（Radix UI + shadcn/ui パターン）

> 実装では Radix UI プリミティブ + Tailwind CSS でコンポーネントを構成。
> `src/app/components/ui/` に shadcn/ui スタイルのコンポーネント群を配置。

### 3.1 Radix UI プリミティブ（実装済み）

| コンポーネント | Radix パッケージ | 用途 |
|-------------|----------------|------|
| Dialog | @radix-ui/react-dialog | モーダル・確認ダイアログ |
| DropdownMenu | @radix-ui/react-dropdown-menu | ユーザーメニュー・操作メニュー |
| Select | @radix-ui/react-select | ドロップダウン選択 |
| Tabs | @radix-ui/react-tabs | 設定画面・ビュー切替 |
| Switch | @radix-ui/react-switch | トグル設定 |
| Checkbox | @radix-ui/react-checkbox | 一括選択・フォーム |
| RadioGroup | @radix-ui/react-radio-group | 単一選択 |
| Progress | @radix-ui/react-progress | 進捗バー |
| Tooltip | @radix-ui/react-tooltip | ヘルプテキスト |
| Avatar | @radix-ui/react-avatar | ユーザーアバター |
| Popover | @radix-ui/react-popover | ポップオーバー |
| Accordion | @radix-ui/react-accordion | 折りたたみ |
| ScrollArea | @radix-ui/react-scroll-area | カスタムスクロール |
| Slider | @radix-ui/react-slider | 範囲入力 |
| Separator | @radix-ui/react-separator | 区切り線 |
| Label | @radix-ui/react-label | フォームラベル |
| NavigationMenu | @radix-ui/react-navigation-menu | ナビゲーション |
| ContextMenu | @radix-ui/react-context-menu | 右クリックメニュー |
| HoverCard | @radix-ui/react-hover-card | ホバー詳細 |
| AlertDialog | @radix-ui/react-alert-dialog | 重要確認 |

### 3.2 カスタムコンポーネント（実装済み）

| コンポーネント | ファイル | 用途 |
|-------------|---------|------|
| BottomNavigation | `components/BottomNavigation.tsx` | モバイル4タブ下部ナビ（🏠ホーム/🗺️ルート/📰配達物/👤プロフィール） |
| SOSButton | `components/SOSButton.tsx` | フローティング緊急ボタン |
| DraggableRoutePoint | `components/DraggableRoutePoint.tsx` | ルート順序ドラッグ&ドロップ |
| AdminLayout | `layouts/AdminLayout.tsx` | サイドバー+トップバー+メインコンテンツ |
| RootLayout | `layouts/RootLayout.tsx` | モバイルレイアウト+BottomNavigation |

### 3.3 Organisms

| コンポーネント | 説明 | 使用先 |
|-------------|------|-------|
| **モバイル専用** | | |
| DeliveryRouteCard | ルート情報カード | ホーム |
| MapWithMarkers | Leaflet地図+マーカー群 | ルートマップ |
| BottomSheet (Vaul) | ドラッグ可能なボトムシート | ルートマップ |
| BottomNavigation | 4タブ下部ナビ（ホーム/ルート/配達物/プロフィール） | 全画面 |
| SOSButton | フローティング緊急ボタン | 全画面 |
| **デスクトップ専用** | | |
| AdminLayout (SideNav) | 左サイドバー（240px/64px折りたたみ） | 全画面 |
| TopBar | 検索(Ctrl+K)+通知+ユーザー | 全画面 |
| DataTable | ソート+フィルター+ページネーション | 管理画面 |
| ModalDialog (Radix) | Radix Dialog ベース | CRUD操作 |
| CalendarGrid | 月間カレンダー（バー付き） | 留守止め・シフト |
| DraggableRoutePoint | React DnD並び替えリスト | ルート編集 |
| SplitPane | react-resizable-panels | ルート管理 |
| **共通** | | |
| ToastNotification | Sonner ベース | 全画面 |
| ConfirmDialog | Radix AlertDialog | 重要操作 |
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
