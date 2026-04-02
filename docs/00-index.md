# 📚 AsahiRoute ドキュメント一覧

## 新聞配達ルート最適化アプリ - 設計ドキュメント

---

| # | ドキュメント | ファイル | 内容 |
|---|-------------|---------|------|
| 1 | [プロジェクト概要・要件定義書](./01-project-overview.md) | `01-project-overview.md` | 背景、ターゲットユーザー、機能要件、非機能要件、用語集 |
| 2 | [システムアーキテクチャ設計書](./02-system-architecture.md) | `02-system-architecture.md` | 技術スタック、システム構成図、モジュール構成、認証・権限、オフライン戦略 |
| 3 | [データベース設計書](./03-database-design.md) | `03-database-design.md` | ER図、全17テーブル定義、インデックス設計、データ量見積もり |
| 4 | [API設計書](./04-api-design.md) | `04-api-design.md` | RESTful API全エンドポイント、リクエスト/レスポンス仕様、WebSocket |
| 5 | [UI/UX 共通デザインシステム](./05-ui-ux-design.md) | `05-ui-ux-design.md` | デザインルール・トークン・コンポーネントライブラリ・アクセシビリティ |
| 5a | [モバイル配達員アプリ UI設計](./05a-mobile-delivery-design.md) | `05a-mobile-delivery-design.md` | 配達員アプリ全12画面詳細＋Figma Makeプロンプト |
| 5b | [デスクトップ管理者UI設計](./05b-desktop-admin-design.md) | `05b-desktop-admin-design.md` | 管理ダッシュボード全14画面詳細＋Figma Makeプロンプト |
| 6 | [開発ロードマップ](./06-development-roadmap.md) | `06-development-roadmap.md` | 6フェーズ開発計画、タスク一覧、チーム構成、リスク対策 |

---

## クイックサマリー

### アプリ概要

**AsahiRoute**は、新聞配達の順路帳をデジタル化し、配達員（特に新人・高齢者・外国人留学生）の業務を支援するアプリです。

### 2つのアプリ

| アプリ | 対象 | プラットフォーム |
|--------|------|---------------|
| **配達員アプリ** | 配達員（新人・高齢者・留学生） | スマートフォン（PWA） |
| **管理ダッシュボード** | 店長・区域管理者・事務員 | PC/タブレット（Web） |

### コア機能

1. **デジタル順路帳** - 地図/リストで配達ルートをナビゲーション
2. **留守止め管理** - リアルタイムで留守止め情報を反映
3. **新規挿入管理** - 新しい購読者をルートに最適配置
4. **多言語対応** - 日/英/越/中/韓/ネパール語
5. **AIルート最適化** - 最短距離・時間でルートを自動計算
6. **オフライン対応** - 電波が届かない場所でも動作

### 技術スタック

- **Backend:** Laravel 11 + MySQL 8.0 + Redis
- **Frontend:** React + Tailwind CSS + Leaflet.js
- **Optimization:** Python (OR-Tools)
- **Real-time:** WebSocket (Laravel Echo)

### 開発期間

**約5ヶ月（20週間）** - 6フェーズ段階的開発
