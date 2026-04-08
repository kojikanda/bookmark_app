# テーブル定義

## 1. 開発当初のテーブル定義

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

## 2. RLS対応

RLS対応のため、各テーブルにカラム：user_idを追加し、テーブルに対してRLSを有効化して、RLSポリシーを設定する。

具体的には以下SQLを実行する。

```sql
-- 1. user_idカラム追加
-- bookmarks
ALTER TABLE bookmarks
  ADD COLUMN user_id uuid REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid();

-- tags
ALTER TABLE tags
  ADD COLUMN user_id uuid REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid();

-- bookmark_tags
ALTER TABLE bookmark_tags
  ADD COLUMN user_id uuid REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid();

-- 2. tags, bookmarks のユニーク制約を変更
-- ユーザーごとに同じタグ名を持てるよう (name, user_id)の複合ユニーク制約に変更する。

-- tags
-- 既存のユニーク制約を削除
ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_name_key;
-- 複合ユニーク制約を追加
ALTER TABLE tags ADD CONSTRAINT tags_name_user_id_key UNIQUE (name, user_id);

-- bookmarks
-- 既存のユニーク制約を削除
ALTER TABLE bookmarks DROP CONSTRAINT IF EXISTS bookmarks_url_key;
-- 複合ユニーク制約を追加
ALTER TABLE bookmarks ADD CONSTRAINT bookmarks_url_user_id_key UNIQUE (url, user_id);

-- 3. RLSを有効化
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmark_tags ENABLE ROW LEVEL SECURITY;

-- 4. RLSポリシーを設定
-- bookmarks
CREATE POLICY "自分のブックマークのみ参照" ON bookmarks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "自分のブックマークのみ追加" ON bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "自分のブックマークのみ削除" ON bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- tags
CREATE POLICY "自分のタグのみ参照" ON tags
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "自分のタグのみ追加" ON tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- bookmark_tags（前回から変更：シンプルになる）
CREATE POLICY "自分のbookmark_tagsのみ参照" ON bookmark_tags
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "自分のbookmark_tagsのみ追加" ON bookmark_tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "自分のbookmark_tagsのみ削除" ON bookmark_tags
  FOR DELETE USING (auth.uid() = user_id);
```

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

このアプリはブックマーク管理ツールなので SEO はあまり関係無いが、**ページを開いた瞬間に一覧が見えるという初期表示の速さをユーザ体験させる**のために SSR を活用する。

## 4. Supabaseサーバコンポーネントの実装

### 実装

```typescript
/**
 * Supabaseクライアント(サーバコンポーネント)を作成するメソッド
 * @returns Supabaseクライアントインスタンス
 */
export async function createClient() {
  // リクエストからCookieを取得するために cookieStoreを作成
  // SSR(Server Side Rendering)から呼ばれたときは、ブラウザのCookieを直接読めないため、
  // Next.jsのcookies()を使って、リクエストに含まれるCookieを取得する必要がある。
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // SupabaseがCookieを読み込むときに呼ばれるメソッド
        getAll() {
          return cookieStore.getAll();
        },
        // SupabaseがCookieを書き込むときに呼ばれるメソッド
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Componentから呼ばれた場合はsetできず、例外スローされるが特に問題ないため無視する
          }
        },
      },
    },
  );
}
```

### なぜこのような実装となるのか

この処理は、SSRによるSupabaseへのリクエストを行う処理で、Next.jsのサーバサイド処理とSupabaseの中間に当たる処理である。<br>
一方でSupabaseはログイン情報などをCookieから取得したり、逆にログインしたときはログインしたことをCookieに設定してブラウザに通知したい。<br>
しかし、この処理はサーバサイド処理からのリクエストにより動くため、この処理(コンポーネント)自身はブラウザのCookie情報を持たない。

そこで、Supabaseがリクエスト(HTTP)からCookieの情報を取得したり、レスポンスにCookieの情報を書き込むために、上記のようなCookieに関する処理を書く必要がある。

### SupabaseはなぜCookieを更新する必要があるのか

Supabase のセッショントークンは有効期限があり、定期的にリフレッシュされる。<br>
リフレッシュされた新しいトークンをブラウザに保存させるために、レスポンスの Cookie を更新する必要がある。

## 5. 🏗️ コンポーネント構成

```plaintext
page.tsx (Server Component)
├── SSRでブックマーク一覧を取得
├── BookmarkForm.tsx (Client Component) ← "use client"
├── TagFilter.tsx (Client Component) ← "use client"
└── BookmarkCard.tsx (Client Component) ← "use client"
```

### ⚖️ Server Component と Client Component の使い分け

| 特徴・機能             | Server Component | Client Component |
| ---------------------- | ---------------- | ---------------- |
| 初期データ取得 (SSR)   | ✅               | ✗                |
| useState / useEffect   | ✗                | ✅               |
| クリック・入力イベント | ✗                | ✅               |
| ブラウザAPIの使用      | ✗                | ✅               |

### 💡 設計方針

page.tsx のみを Server Component として扱い、データの取得（Fetch）を担当させる。<br>
一方で、フォームの入力、ボタンのクリック、フィルタリングなどの「動き（インタラクション）」が
必要な子コンポーネントはすべて Client Component ("use client") として切り分けて管理する。

### ✍️ 補足メモ

この「データ取得は親（Server）で、動きは子（Client）で」という設計は、Next.jsのベストプラクティスの一つ。

- サーバー側で重い処理やDBアクセスを済ませることで、ブラウザに送るJSの量を減らせる。
- クライアント側で React のリッチな操作感を実現できる。

という、いいとこ取りができる。

<br>

---

<br>

# 📚️ 学習メモ：RLS(Row Level Security)

## RLSとは

Supabaseの「Row Level Security (RLS)」は、一言で言うと
**データベースの行（レコード）ごとに、『誰がそのデータを操作していいか』というルールを直接書き込む仕組み**のこと。

通常、Webアプリではサーバー側（Node.jsなど）で
「このデータは、このユーザーのものだから編集させてOK」というチェック処理を書くが、
Supabaseではそれをデータベースそのものに担当させる。

## RLSあり・なしの比較

### 1. RLSがない状態（危険）

状態: データベースが「鍵のかかっていない倉庫」になっている状態。

リスク: 悪意のあるユーザーがAPIを直接叩けば、自分以外のユーザーのブックマークを勝手に見たり、削除したりできてしまう。<br>
アプリのコード（Next.js側）でいくらガードしていても、データベース自体に鍵がないため防げない。

### 2. RLSがある状態（安全）

状態: データベースの各行に「この行の user_id と、今ログインしている人の id が一致する場合のみ操作を許可する」という透明な壁がある状態。

メリット: たとえアプリ側にバグがあっても、データベースが「お前はこのデータの持ち主じゃないからダメだ」と自動でブロックしてくれる。

## 具体例

### 1. データの持ち方とチェックの場所

テーブルに user_id カラム（作成者の識別子）を持たせるのが大前提。

- 従来（サーバーサイドで制御）:

SQLで SELECT \* FROM bookmarks WHERE user_id = 'ログイン中のID' というクエリをエンジニアが書く。<br>
もし WHERE 句を書き忘れたら、全ユーザーのデータが露出するバグになる。

- Supabase RLS（データベースで制御）:

データベース側に「自分のID以外の操作は拒否」という**ポリシー→検閲ルール**を1度だけ設定する。<br>
アプリから SELECT \* FROM bookmarks と（WHERE句なしで）投げても、データベースが勝手にフィルタリングして、本人の分しか返さない。

### 2. なぜ「セキュリティが高まる」のか？

最大の利点は**実装ミスによる情報漏洩を防げること**。

- APIを直接叩かれても安全: 悪意のあるユーザーがブラウザのコンソールから「他人のID」を指定してデータを盗もうとしても、
  データベース層でシャットアウトされる。

- フロントエンドに集中できる: セキュリティロジックをDB側に持たせることで、Next.js側では「データの表示」に専念でき、コードがシンプルになる。

### 3. 具体的な設定のイメージ

SQL（ポリシー）としては、裏側でこのような設定が動いている。

```sql
-- 「bookmarks」テーブルに対するポリシーの例
CREATE POLICY "Users can only access their own bookmarks"
ON bookmarks
FOR ALL -- 参照・追加・更新・削除すべて
USING (auth.uid() = user_id); -- ログイン中のIDと、データのuser_idが一致する場合のみ許可
```

<br>

---

<br>

# 📚️ 学習メモ：ユーザ認証

## 1. Middleware処理

```typescript
export async function proxy(request: NextRequest) {
  // レスポンスを一旦作成（後でクッキーを書き込むために必要）
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Supabaseクライアントを作成。クッキーの読み書きをフックするために、ここでクライアントを作成する必要がある。
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // リクエスト側にも書く（後続のサーバーコンポーネントが読めるように）
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          // レスポンス側にも書く（ブラウザのクッキーを更新するために）
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // セッションを更新する
  // getUser()を呼ぶことで、内部でトークンのリフレッシュが走る
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 未ログインユーザーが保護ページにアクセスしたらログインページへリダイレクト
  // /login, /signup, /apiなどのパブリックなパスは除外する
  const publicPaths = ["/login", "/signup"];
  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");
  if (!user && !isApiRoute && !publicPaths.includes(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

// Middleware を実行するパスを指定
export const config = {
  matcher: [
    // Next.js の内部ファイルと静的ファイルはスキップ
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

## 2. Cookieの書き込み (Supabaseサーバコンポーネントとの違い)

Middlewareでは、リクエストとレスポンスの両方のCookieを更新・設定する。

Supabaseサーバコンポーネントでは、**リクエストのCookieを読み取り専用で扱う**が、Middlewareは**requestオブジェクトを直接操作できる特殊な環境**となる。
よって、Middlewareでは、**requestオブジェクトを直接書き換えられる**。

```typescript
request.cookies.set(name, value);
```

この処理は元のリクエストを書き換えるのではなく、**後続の処理に渡すリクエストオブジェクトのメモリ上の値を更新する**イメージ。

## 3. なぜ Middleware が必要か

Supabase Auth はセッションをクッキーに保存する。<br>
クッキーは有効期限があり、期限が近づいたら**自動更新**する必要がある。

Next.js では、Middleware はすべてのリクエストの前に実行されるため、ここでセッションを更新するのが定石。<br>
これをしないと、サーバーコンポーネントで getUser() を呼んでも認証情報が取れないことがある。

### Middlewareの立ち位置

```plaintext
ブラウザ → [Middleware] → Server Components / Route Handlers → [Middleware] → ブラウザ
```

## 4. なぜリクエストとレスポンス両方に書き込むのか

Middleware はリクエストとレスポンスの中間に位置するため、2つの書き込み先に異なる目的がある。

### 目的1：後続のサーバーコンポーネントが新しいトークンを読めるようにする

```typescript
// ① リクエスト側に書く
request.cookies.set(name, value);
```

トークンがリフレッシュされた場合、Middleware より後に動くサーバーコンポーネントが古いトークンを読んでしまわないように、リクエストオブジェクトを更新しておく必要がある。

### 目的2：ブラウザの Cookie を更新する

```typescript
// ② レスポンス側に書く
supabaseResponse.cookies.set(name, value, options);
```

次回以降のリクエストで新しいトークンが送られてくるようにブラウザのCookieを更新する。

### 流れのまとめ

```plaintext
①トークンリフレッシュ発生
    ↓
②リクエストの Cookie を更新
  → 後続のサーバーコンポーネントが新しいトークンで動ける
    ↓
③レスポンスの Cookie を更新
  → ブラウザが新しいトークンを保存し、次回から使える
```

両方に書かないと、「今回のリクエスト中は古いトークンで動く」「次回のリクエストからは新しいトークンになる」という不整合が起きてしまう。

<br>

---

<br>

# Vercelへのデプロイ

## 1. GitHubにプッシュする

Vercelでは、GitHubのリポジトリをそのままインポートすることが可能。

## 2. Vercelにログイン

## 3. GitHubのリポジトリをインポート

Add Newボタン＞Projectからインポートが可能。

最初にGitHubのどのリポジトリをインポートするかを選択する。<br>
選択できない/選択したいリポジトリの表示が無いときは、
「Add GitHub Account」から画面下のRepository accessで、プッシュしているリポジトリを選択することができる。

Vercelにインポートしたいリポジトリが表示されたら、importボタンをクリック。

## 4. 環境変数の設定

Environment Variablesで、.envファイルに設定したAPIキーなどの環境変数を設定する。
.envファイルを直接指定して、読み込ませることも可能。

## 5. デプロイ実行

Deployボタンをクリックして、デプロイを実行する。<br>
デプロイ完了までは少し時間がかかる。

## 6. デプロイ確認

プレビュー画面がリンクになっており、クリックすると公開されたアプリにアクセスすることができる。

## 7. Supabaseの設定

Supabase側で、公開されたアプリのURLを指定する必要がある。

Authentication＞URL ConfigurationのSite URLとRedirect URLsを、公開されたアプリのURL(https://ドメイン)を指定する。

## 8. 独自ドメインの指定

### Vercel 側のドメイン追加設定

まず、Vercelに対して「このドメインでアクセスが来たら、このプロジェクトを表示してね」と教える作業を行う。

左サイドバーの 「Domains」 を選択する。<br>
「Add Existing Domein」ボタンをクリックし、使いたいドメインを入力する。<br>
プロジェクトは今回利用するプロジェクトを指定する。<br>

画面に設定したドメインの設定と、「Invalid Configuration」という表示が出る。<br>
ドメインの設定を開き、CNAMEのnameとvalueをメモする。<br>
今回CNAMEのnameは「bookmarkapp」で説明する。

### ドメイン管理会社での DNS 設定

次に、世界中のインターネットに対して「bookmarkapp へのアクセスは Vercel に飛ばして」と交通整理をする設定を行う。

ドメインを購入したサービス（お名前.com、Cloudflare、Google Domains等）の管理画面にログインする。
今回はお名前.comで説明する。

#### 1. お名前.com Naviにログインする

#### 2. DNSレコードを設定する

まずは、住所となるDNSレコード設定を行う。

##### 2-1. お名前.comのTOP画面から、ネームサーバ/DNS＞ドメインDNS設定を選択する

##### 2-2. 対象のドメインの右側にある、「ドメインDNS」のボタンをクリックする

##### 2-3. DNSレコード設定をクリックする

##### 2-4. レコードを入力する

- ホスト名: bookmarkapp（CNAMEのname）
- Type: CNAME（プルダウンから選択）
- TTL: 3600（デフォルトのままでOK）
- VALUE: Vercelで示されたCNAMEのvalue（ただし、末尾の「.」を省く）
- 状態: 有効

追加ボタンを押下して、追加する。

##### 2-5. 設定を保存する

「確認画面へ進む」 ＞ 「設定する」 をクリックして完了。

#### 3. ネームサーバ設定を設定する

次に、住所を置く棚となるネームサーバの設定を行う。

##### 3-1. お名前.comのTOP画面から、ネームサーバ/DNS＞ネームサーバ設定を選択する。

##### 3-2. 対象のドメイン名のチェックボックスをチェックする

##### 3-3. お名前.comのネームサーバを使うのラジオボタンをチェックする

##### 3-4. 設定を保存する

「確認」 ＞ 「設定する」 をクリックして完了。

### Supabaseにドメインを反映

「7. Supabaseの設定」と同様に、設定した新たなドメインを設定する。
