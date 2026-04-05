# テーブル定義

```sql
-- タグテーブル
create table tags (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamp with time zone default now()
);

-- ブックマークテーブル
create table bookmarks (
  id          uuid primary key default gen_random_uuid(),
  url         text not null unique,
  title       text,
  description text,
  image_url   text,
  created_at  timestamp with time zone default now()
);

-- ブックマーク ↔ タグの中間テーブル（多対多）
create table bookmark_tags (
  bookmark_id uuid references bookmarks(id) on delete cascade,
  tag_id      uuid references tags(id)      on delete cascade,
  primary key (bookmark_id, tag_id)
);
```

中間テーブル(bookmark_tags)でboookmarksテーブルとtagsテーブルのキーを外部キーとして登録する。<br>
これにより、bookmarksテーブル→tagsテーブル、tagsテーブル→bookmarksテーブルの紐づきを設定する。<br>
bookmarksテーブルからtagsテーブルは1対多で、逆のtagsテーブル→bookmarksテーブルも1対多なので、多対多となる。
<br>

---

<br>

# 📚 学習メモ：OGP（Open Graph Protocol）の取得

## 1. OGP とは何か

OGP（Open Graph Protocol）とは、SNS や外部サービス（Twitter、Slack、LINE など）でページがシェアされた際に、そのページの **「タイトル・概要・画像」** をリッチなプレビュー（リンクカード）として表示させるための仕組み。

Web ページの HTML の `<head>` 内に、専用の `<meta>` タグとして埋め込まれる。

### 📄 HTML の構造例

```html
<head>
  <!-- ページの基本タイトル -->
  <title>Next.js入門 | Zenn</title>

  <!-- OGP用タグ (SNSなどで優先される) -->
  <meta property="og:title" content="Next.js入門" />
  <meta property="og:description" content="Next.jsの基礎を学ぶ記事です" />
  <meta
    property="og:image"
    content="[https://example.com/ogp.png](https://example.com/ogp.png)"
  />

  <!-- 標準のmetaタグ (検索エンジンなどが使用) -->
  <meta name="description" content="Next.jsの基礎を学ぶ記事です" />
</head>
```

## 2. 実装のポイント

### getMeta 関数の作成

cheerio などのライブラリを使用して HTML から情報を抽出する場合、サイトによって property 属性か name 属性かが異なるため、フォールバック（代替処理）を考慮した関数を作成する。

```typescript
const getMeta = (property: string) =>
  $(`meta[property="${property}"]`).attr("content") || // ① og: 系を探す
  $(`meta[name="${property}"]`).attr("content") || // ② name= 系を探す
  null; // ③ どちらもなければ null
```

| 優先順位 | 探すタグ            | 対応する HTML                              |
| -------- | ------------------- | ------------------------------------------ |
| ①        | property="og:title" | `<meta property="og:title" content="...">` |
| ②        | name="og:title"     | `<meta name="name:title" content="...">`   |

### ogp オブジェクトの構成とフォールバック

特定のメタタグがない場合でも、代替となるタグから値を取得するように設計する。

```typescript
const ogp = {
  title: getMeta("og:title") ?? $("title").text() ?? null,
  description: getMeta("og:description") ?? getMeta("description") ?? null,
  image_url: getMeta("og:image") ?? null,
};
```

- title: og:title がなければ、通常の `<title>` タグから取得。
- description: og:description がなければ、通常の name="description" から取得。

## 3. 取得結果のイメージ

例えば、Zennの記事ページから取得した場合、以下のようなオブジェクトが生成される。

### 入力 (HTML):

```html
<title>Next.js入門 | Zenn</title>
<meta property="og:title" content="Next.js入門" />
<meta property="og:image" content="https://res.cloudinary.com/.../ogp.png" />
```

### 出力 (JSON):

```json
{
  "title": "Next.js入門",
  "description": "Next.jsの基礎を学ぶ記事です",
  "image_url": "https://res.cloudinary.com/.../ogp.png"
}
```

今回作るブックマークアプリでは、これがそのままブックマークやリンクカードのプレビュー表示に使用される。
<br>

---

<br>

# 📚 学習メモ：SSR（Server-Side Rendering）

SSR について、従来の React（CSR）との違いを比較して整理する。

## 1. レンダリング方式の比較

### CSR（Client-Side Rendering）— 従来の React

1.  **ブラウザ → サーバー**: 「HTMLをください」
2.  **サーバー → ブラウザ**: 空のHTML + JSファイルを返す
3.  **ブラウザ**: JSを実行してレンダリング開始
4.  **ブラウザ**: APIを叩いてデータ取得
5.  **ブラウザ**: データが来たら画面を更新

- 👉 **結果**: 最初は空の画面（ローディング）が表示され、データが来てから中身が表示される。

### SSR（Server-Side Rendering）— Next.js

1.  **ブラウザ → サーバー**: 「HTMLをください」
2.  **サーバー**: DBからデータを取得してHTMLを組み立てる
3.  **サーバー → ブラウザ**: **データ入り完成済みHTML**を返す
4.  **ブラウザ**: そのまま表示

- 👉 **結果**: ユーザーがページを開いた瞬間に、最初からデータが入った状態で画面が表示される。

## 2. Next.js での具体的なイメージ (`page.tsx`)

Next.js の Server Components（デフォルト）では、コンポーネント自体を `async` にしてサーバー側でデータを取得できます。

```tsx
// page.tsx はサーバー上で実行される
export default async function Home() {
  // この fetch はサーバー上で実行される（ブラウザではない）
  const res = await fetch("http://localhost:3000/api/bookmarks");
  const bookmarks = await res.json();

  // データが入った状態で HTML を組み立ててブラウザに返す
  return <BookmarkCard bookmarks={bookmarks} />;
}
```

## 3. SSR のメリット・デメリット

| 比較項目     | CSR                              | SSR                          |
| ------------ | -------------------------------- | ---------------------------- |
| 初期表示     | 遅い（JS実行後に表示）           | 速い（完成済みHTMLが届く）   |
| SEO          | 弱い（クローラーが空HTMLを見る） | 強い（データ入りHTMLを見る） |
| サーバー負荷 | 低い（ブラウザが頑張る）         | 高い（サーバーが組み立てる） |

### 💡 本プロジェクトでの採用理由

このアプリはブックマーク管理ツールなので SEO はあまり関係無いが、**「ページを開いた瞬間に一覧が見える」という初期表示の速さ（ユーザー体験）**のために SSR を活用する。
<br>

---

<br>

# 🏗️ コンポーネント構成

```plaintext
page.tsx (Server Component)
├── SSRでブックマーク一覧を取得
├── BookmarkForm.tsx (Client Component) ← "use client"
├── TagFilter.tsx (Client Component) ← "use client"
└── BookmarkCard.tsx (Client Component) ← "use client"
```

## ⚖️ Server Component と Client Component の使い分け

| 特徴・機能             | Server Component | Client Component |
| ---------------------- | ---------------- | ---------------- |
| 初期データ取得 (SSR)   | ✅               | ✗                |
| useState / useEffect   | ✗                | ✅               |
| クリック・入力イベント | ✗                | ✅               |
| ブラウザAPIの使用      | ✗                | ✅               |

## 💡 設計方針

page.tsx のみを Server Component として扱い、データの取得（Fetch）を担当させる。<br>
一方で、フォームの入力、ボタンのクリック、フィルタリングなどの「動き（インタラクション）」が
必要な子コンポーネントはすべて Client Component ("use client") として切り分けて管理する。

## ✍️ 補足メモ

この「データ取得は親（Server）で、動きは子（Client）で」という設計は、Next.jsのベストプラクティスの一つ。

- サーバー側で重い処理やDBアクセスを済ませることで、ブラウザに送るJSの量を減らせる。
- クライアント側で React のリッチな操作感を実現できる。

という、いいとこ取りができる。
