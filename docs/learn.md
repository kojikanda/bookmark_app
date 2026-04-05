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

中間テーブル(bookmark_tags)でboookmarksテーブルとtagsテーブルのキーを外部キーとして登録する。
これにより、bookmarksテーブル→tagsテーブル、tagsテーブル→bookmarksテーブルの紐づきを設定する。
bookmarksテーブルからtagsテーブルは1対多で、逆のtagsテーブル→bookmarksテーブルも1対多なので、多対多となる。

# 📚 学習メモ：OGP（Open Graph Protocol）の取得

## 1. OGP とは何か

OGP（Open Graph Protocol）とは、SNS や外部サービス（Twitter、Slack、LINE など）でページがシェアされた際に、そのページの **「タイトル・概要・画像」** をリッチなプレビュー（リンクカード）として表示させるための仕組みです。

Web ページの HTML の `<head>` 内に、専用の `<meta>` タグとして埋め込まれます。

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
