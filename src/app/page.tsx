import { createClient } from "@/lib/supabase/server";
import { Bookmark, Tag } from "@/types";
import BookmarkClient from "@/components/BookmarkClient";

/**
 * トップページコンポーネント
 * @description サーバーコンポーネントとして、Supabaseからブックマークとタグの情報を取得し、
 * BookmarkClientコンポーネントに渡す役割を持つ。
 * クライアント側での状態管理やユーザーインタラクションはBookmarkClientに任せる。
 * @returns トップページのJSX要素を返す。ブックマークの一覧とタグフィルターを含むBookmarkClientコンポーネントを表示する。
 */
export default async function Home() {
  const supabase = await createClient();

  // Supabaseからブックマークとタグの情報を取得
  // Server Component内でのデータ取得はサーバーサイドで完結させるため、クライアントへのAPI呼び出しは行わない
  const { data } = await supabase
    .from("bookmarks")
    .select(
      `
        *,                                                                                                                                   
        bookmark_tags(
          tags(*)                                                                                                                            
        )         
      `,
    )
    .order("created_at", { ascending: false });

  const bookmarks: Bookmark[] = (data ?? []).map((b) => ({
    ...b,
    tags: b.bookmark_tags.map((bt: { tags: Tag }) => bt.tags),
    bookmark_tags: undefined,
  }));

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-gray-800">
          技術記事ブックマーク
        </h1>
        <BookmarkClient initialBookmarks={bookmarks} />
      </div>
    </main>
  );
}
