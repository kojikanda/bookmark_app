import { createClient } from "@/lib/supabase/server";
import { Bookmark, Tag } from "@/types";
import BookmarkClient from "@/components/BookmarkClient";
import LogoutButton from "@/components/LogoutButton";
import { Bookmark as BookmarkIcon } from "lucide-react";

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
    .select(`*, bookmark_tags(tags(*))`)
    .order("created_at", { ascending: false });

  // Supabaseから取得したデータをBookmarkClientで扱いやすい形式に変換
  const bookmarks: Bookmark[] = (data ?? []).map((b) => ({
    ...b,
    tags: b.bookmark_tags.map((bt: { tags: Tag }) => bt.tags),
    bookmark_tags: undefined,
  }));

  // サーバーコンポーネント内でユーザー情報を取得する
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-muted/40">
      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookmarkIcon className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold">技術記事ブックマーク</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <LogoutButton />
          </div>
        </div>
        <BookmarkClient initialBookmarks={bookmarks} />
      </div>
    </main>
  );
}
