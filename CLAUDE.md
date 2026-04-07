# 技術記事のブックマークアプリ開発

## 目的

このプロジェクトは技術記事のブックマークアプリ開発です。
具体的には、以下の機能を実装します。

### 基本的な機能

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

- `bookmarks` テーブル（id, url, title, description, image_url, created_at, user_id）— (url, user_id) に複合ユニーク制約
- `tags` テーブル（id, name, created_at, user_id）— (name, user_id) に複合ユニーク制約（ユーザーごとにタグを分離）
- `bookmark_tags` 中間テーブル（bookmark_id, tag_id, user_id）で多対多を表現（CASCADE DELETE 設定済み）

#### バックエンド API

- `src/app/api/ogp/route.ts` — OGP スクレイピング API
- `src/app/api/bookmarks/route.ts` — GET / POST / DELETE（動作確認済み）

#### フロントエンド UI

- `src/app/page.tsx` — SSR でブックマーク一覧を取得する Server Component
- `src/components/BookmarkClient.tsx` — state 管理を担う Client Component（タグフィルタ・追加・削除・検索）
- `src/components/BookmarkCard.tsx` — ブックマーク1件を表示するカード
- `src/components/BookmarkForm.tsx` — URL・タグ入力フォーム
- `src/components/TagFilter.tsx` — タグによるフィルタリング
- `src/components/SearchBar.tsx` — キーワード検索バー

#### UI リファクタリング

- 全コンポーネントを shadcn/ui（Card, Input, Label, Badge, Alert, Button）に移行
- lucide-react アイコン（BookmarkPlus, ExternalLink, Trash2, Search 等）を導入
- shadcn/ui は @base-ui/react ベース（Radix UI ではない）— `asChild` は使えず `render` prop を使う
- フォームイベント型は React 19 では `React.FormEvent` が非推奨のため `NonNullable<React.ComponentProps<'form'>['onSubmit']>` を使う

#### 削除確認ダイアログ

- `BookmarkCard.tsx` の `confirm()` を shadcn/ui の `AlertDialog` に置き換え
- 削除ボタン（Trigger）は `variant="destructive"`、削除中は両ボタンを `disabled` に設定

#### Toast 通知（Sonner）

- `sonner` をインストール、`src/app/layout.tsx` に `<Toaster richColors position="bottom-right" />` を配置
- ブックマーク登録成功・削除成功時に `toast.success()`、失敗時に `toast.error()` を表示
- `BookmarkForm.tsx` のインラインエラー表示（Alert）を削除し toast に一本化

#### タグ入力 UX 改善（TagInput コンポーネント）

- `src/components/TagInput.tsx` を新規作成
- shadcn/ui の `Command`（cmdk ベース）+ `Badge` を組み合わせたオートコンプリート付きタグ入力
- 既存タグの候補表示・新規タグの追加・チップ（Badge）表示・× ボタンで削除
- キーボード操作対応：↓↑ でアイテム移動、Enter で選択、Escape でドロップダウンを閉じる
- マウスホバー・キーボード選択ともに青系ハイライト（`bg-blue-100 dark:bg-blue-900/50`）
- `BookmarkForm.tsx` の tags state を `string` → `string[]` に変更し `TagInput` を使用
- `BookmarkClient.tsx` から `allTags` を `BookmarkForm` に渡す構成
- **注意点・ハマりどころ：**
  - shadcn/ui Card の `overflow-hidden` がドロップダウンを隠す → Card に `style={{ overflow: 'visible' }}` で対処（`overflow-visible` クラスは Tailwind v4 環境では tailwind-merge で確実に上書きされない場合がある）
  - className 文字列に改行を含めるとハイドレーションエラーが発生する → 必ず1行で記述する
  - cmdk の `Command` は `value=""` を「未制御」と解釈し最初のアイテムを自動選択する → `value="__none__"` で回避
  - cmdk の `Command` に `value` を渡す場合は `shouldFilter={false}` と組み合わせる
  - 送信時に未確定テキストをリセットするには `TagInput` の `key` を変更して再マウントする

#### バグ修正

- OGP 取得失敗時（存在しない URL 等）でもブックマークが登録されてしまう問題を修正
  - `POST /api/bookmarks` で `ogpRes.ok` が false の場合は 400 を返して登録を中断するよう変更

#### VSCode デバッグ環境

- `.vscode/launch.json` を作成（server-side / client-side / full stack の3構成）
- Turbopack 内部のソースマップ警告は無害であることを確認済み

#### 全文検索

- `GET /api/bookmarks?q=keyword` — Supabase の `ilike` で title・description を OR 検索
- `src/components/SearchBar.tsx` — 検索フォーム（Enter キー / 検索ボタン対応）
- `BookmarkClient.tsx` の `handleSearch` で API を呼び出し bookmarks state を更新

#### 認証機能（Supabase Auth）

- `src/middleware.ts` — セッション管理・未認証ユーザーを `/login` へリダイレクト
  - `/api/` ルートはリダイレクト対象外（内部フェッチが `/login` にリダイレクトされる問題を回避）
  - `/login` / `/signup` は未認証でもアクセス可能
- `src/app/login/page.tsx` — メール・パスワードによるログインページ
- `src/app/signup/page.tsx` — アカウント登録ページ（登録後は即ログイン）
- `src/components/LogoutButton.tsx` — ログアウトボタン（Client Component）
- `src/app/page.tsx` — ヘッダーにログイン中のメールアドレスと `LogoutButton` を表示

#### RLS（Row Level Security）

- 3テーブル（`bookmarks` / `tags` / `bookmark_tags`）すべてで RLS を有効化
- タグはユーザーごとに分離（グローバル共有なし）
- **注意点・ハマりどころ：**
  - `tags` テーブルの `upsert` は競合時に `UPDATE` が走り、`UPDATE` ポリシー未設定だと RLS エラーになる → `upsert` をやめて「SELECT して存在しなければ INSERT」に変更
  - API Route 内で `fetch('/api/ogp')` を呼ぶ内部リクエストにはクッキーが含まれず Middleware に弾かれる → `/api/` パスを Middleware のリダイレクト対象外にすることで解決

### 現在のディレクトリ構造

```
src/
├── app/
│   ├── api/
│   │   ├── bookmarks/
│   │   │   └── route.ts   # ✅ 実装済み（認証チェック・user_id 挿入対応済み）
│   │   └── ogp/
│   │       └── route.ts   # ✅ 実装済み
│   ├── login/
│   │   └── page.tsx       # ✅ 実装済み
│   ├── signup/
│   │   └── page.tsx       # ✅ 実装済み
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx           # ✅ 実装済み（ユーザー情報・ログアウトボタン追加済み）
├── components/
│   ├── ui/                # shadcn/ui コンポーネント（button, card, input, label, badge, alert, alert-dialog, sonner, command）
│   ├── BookmarkCard.tsx   # ✅ 実装済み
│   ├── BookmarkClient.tsx # ✅ 実装済み
│   ├── BookmarkForm.tsx   # ✅ 実装済み
│   ├── LogoutButton.tsx   # ✅ 実装済み
│   ├── SearchBar.tsx      # ✅ 実装済み
│   ├── TagFilter.tsx      # ✅ 実装済み
│   └── TagInput.tsx       # ✅ 実装済み
├── lib/
│   ├── supabase/
│   │   ├── client.ts      # ✅ 実装済み
│   │   └── server.ts      # ✅ 実装済み
│   └── utils.ts
├── middleware.ts           # ✅ 実装済み
└── types/
    └── index.ts           # ✅ 実装済み（user_id フィールド追加済み）
```

### 次のステップ

未定
