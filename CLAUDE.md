# 技術記事のブックマークアプリ開発

## 目的

このプロジェクトは技術記事のブックマークアプリ開発です。
具体的には、以下の機能を実装します。

- URLを貼るだけ: 気になった技術記事（Zenn, Qiita, 海外公式ドキュメント等）のURLを入力する。

- 自動メタデータ取得: Next.jsのサーバーサイド機能（API Route）を使って、その記事のタイトル、画像（OGP）、概要を自動でスクレイピングして保存する。

- タグ付け・分類: 「Java」「React」「アルゴリズム」などのタグを付けて管理する。

- 全文検索: 過去に保存した記事の中から、キーワードで一瞬で検索できる。

## 使用する言語、フレームワーク、DBなど

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase

## 作業の進め方

このプロジェクトは、Next.jsなど、モダンなWebアプリ開発環境の学習を兼ねています。
そのため、**あなたはコードを教えるだけで実装はしないでください。**

以下の流れで作業を進めます。

1. まず最初に環境構築を行います。基本的にこちらで指示しますが、その際、環境構築手順を整理して示してください。また、環境構築に関しては、こちらで許可を出せば、あなたが環境構築を実行してください。
1. 環境構築が完了したら、コーディングを進めます。こちらから何の機能を実装するかを指示しますが、段階的にコードを示してください。
   その際、どのファイルにどのような変更をするのかを示してください。
   また、なぜそのような変更をするのかを示してください。
1. 作業の区切りで、進捗状況をCLAUDE.mdに記載し、次回は続きから作業ができるようにしてください。

## 進捗状況

### 2026-04-04 — 環境構築 〜 バックエンド API 実装完了

**実施内容:**

#### 環境構築
- Next.js (App Router) + TypeScript + Tailwind CSS でプロジェクト初期化
- shadcn/ui 初期化（Radix ベース、Tailwind v4 対応）
- Supabase クライアント (`@supabase/supabase-js`, `@supabase/ssr`) インストール
- OGP スクレイピング用に `cheerio` インストール

#### Supabase テーブル設計・作成
- `bookmarks` テーブル（id, url, title, description, image_url, created_at）
- `tags` テーブル（id, name, created_at）
- `bookmark_tags` 中間テーブル（bookmark_id, tag_id）で多対多を表現

#### 実装済みファイル
- `src/types/index.ts` — `Bookmark` / `Tag` / `BookmarkInsert` 型定義
- `src/lib/supabase/client.ts` — ブラウザ用 Supabase クライアント
- `src/lib/supabase/server.ts` — サーバー用 Supabase クライアント（Cookie 対応）
- `src/app/api/ogp/route.ts` — OGP スクレイピング API（動作確認済み）

**現在のディレクトリ構造:**
```
src/
├── app/
│   ├── api/
│   │   ├── bookmarks/   # route.ts を実装予定（次回）
│   │   └── ogp/
│   │       └── route.ts # ✅ 実装済み・動作確認済み
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── ui/              # shadcn/ui コンポーネント置き場
├── lib/
│   ├── supabase/
│   │   ├── client.ts    # ✅ 実装済み
│   │   └── server.ts    # ✅ 実装済み
│   └── utils.ts
└── types/
    └── index.ts         # ✅ 実装済み
```

**次のステップ:**
1. `src/app/api/bookmarks/route.ts` を実装（GET / POST / DELETE）
2. フロントエンド UI の実装
   - `src/components/BookmarkCard.tsx`
   - `src/components/BookmarkForm.tsx`
   - `src/components/TagFilter.tsx`
   - `src/app/page.tsx`（一覧ページ）
