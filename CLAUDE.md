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

### これまでの実施内容

#### 環境構築
- Next.js (App Router) + TypeScript + Tailwind CSS でプロジェクト初期化
- shadcn/ui 初期化（Radix ベース、Tailwind v4 対応）
- Supabase クライアント (`@supabase/supabase-js`, `@supabase/ssr`) インストール
- OGP スクレイピング用に `cheerio` インストール

#### Supabase テーブル設計・作成
- `bookmarks` テーブル（id, url, title, description, image_url, created_at）
- `tags` テーブル（id, name, created_at）— name にユニーク制約あり
- `bookmark_tags` 中間テーブル（bookmark_id, tag_id）で多対多を表現（CASCADE DELETE 設定済み）

#### バックエンド API
- `src/app/api/ogp/route.ts` — OGP スクレイピング API
- `src/app/api/bookmarks/route.ts` — GET / POST / DELETE（動作確認済み）

#### フロントエンド UI
- `src/app/page.tsx` — SSR でブックマーク一覧を取得する Server Component
- `src/components/BookmarkClient.tsx` — state 管理を担う Client Component（タグフィルタ・追加・削除）
- `src/components/BookmarkCard.tsx` — ブックマーク1件を表示するカード
- `src/components/BookmarkForm.tsx` — URL・タグ入力フォーム
- `src/components/TagFilter.tsx` — タグによるフィルタリング

### 現在のディレクトリ構造

```
src/
├── app/
│   ├── api/
│   │   ├── bookmarks/
│   │   │   └── route.ts   # ✅ 実装済み
│   │   └── ogp/
│   │       └── route.ts   # ✅ 実装済み
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx           # ✅ 実装済み
├── components/
│   ├── ui/                # shadcn/ui コンポーネント置き場
│   ├── BookmarkCard.tsx   # ✅ 実装済み
│   ├── BookmarkClient.tsx # ✅ 実装済み
│   ├── BookmarkForm.tsx   # ✅ 実装済み
│   └── TagFilter.tsx      # ✅ 実装済み
├── lib/
│   ├── supabase/
│   │   ├── client.ts      # ✅ 実装済み
│   │   └── server.ts      # ✅ 実装済み
│   └── utils.ts
└── types/
    └── index.ts           # ✅ 実装済み
```

### 次のステップ

1. 全文検索機能の実装
   - キーワードで title / description を検索する検索バーの追加
   - `src/components/SearchBar.tsx`
   - Supabase の `ilike` クエリを活用
