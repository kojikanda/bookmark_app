import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * ブックマーク一覧をタグ情報込みで取得するAPIエンドポイント
 * @returns ブックマークの配列をJSON形式で返す。各ブックマークには関連するタグの情報も含まれる。エラーが発生した場合はエラーメッセージを返す。
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  let query = supabase.from("bookmarks").select(
    `         
      *,
      bookmark_tags(
        tags(*)
       )
    `,
  );

  if (q) {
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // DBの結果を Bookmark 型に整形する
  // bookmark_tags: [{ tags: { id, name, created_at } }] → tags: Tag[]
  const bookmarks = data.map((b) => ({
    ...b,
    tags: b.bookmark_tags.map((bt: { tags: unknown }) => bt.tags),
    bookmark_tags: undefined, // 不要なフィールドを削除
  }));

  return NextResponse.json(bookmarks);
}

/**
 * リクエストボディからURLとタグ名の配列を受け取り、ブックマークを新規登録するAPIエンドポイント
 * 1. URLからOGP情報を取得（内部で /api/ogp を呼び出す）
 * 2. bookmarks テーブルに挿入
 * 3. タグを処理（既存タグはそのまま使い、なければ新規作成）
 * 4. bookmark_tags 中間テーブルに紐付けを挿入
 * @param request Next.jsのリクエストオブジェクト。リクエストボディからURLとタグ名の配列を取得する。
 * @returns 登録されたブックマークの情報をJSON形式で返す。エラーが発生した場合はエラーメッセージを返す。
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // リクエストボディから url とタグ名の配列を取得
  const body = await request.json();
  const { url, tags: tagNames = [] }: { url: string; tags: string[] } = body;

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  // OGP情報を取得（既存の /api/ogp を内部で呼び出す）
  const ogpRes = await fetch(
    `${request.nextUrl.origin}/api/ogp?url=${encodeURIComponent(url)}`,
  );
  const ogp = ogpRes.ok ? await ogpRes.json() : {};

  // bookmarks テーブルに挿入
  const { data: bookmark, error: bookmarkError } = await supabase
    .from("bookmarks")
    .insert({
      url,
      title: ogp.title ?? null,
      description: ogp.description ?? null,
      image_url: ogp.image_url ?? null,
    })
    .select()
    .single();

  if (bookmarkError) {
    return NextResponse.json({ error: bookmarkError.message }, { status: 500 });
  }

  // タグを処理（既存タグはそのまま使い、なければ新規作成）
  for (const name of tagNames) {
    if (!name.trim()) continue;

    // upsert: 同名タグが存在すれば取得、なければ挿入
    const { data: tag, error: tagError } = await supabase
      .from("tags")
      .upsert({ name: name.trim() }, { onConflict: "name" })
      .select()
      .single();

    if (tagError || !tag) continue;

    // bookmark_tags 中間テーブルに紐付けを挿入
    await supabase
      .from("bookmark_tags")
      .insert({ bookmark_id: bookmark.id, tag_id: tag.id });
  }

  return NextResponse.json(bookmark, { status: 201 });
}

/**
 * クエリパラメータからブックマークIDを受け取り、そのブックマークを削除するAPIエンドポイント
 * @param request Next.jsのリクエストオブジェクト。クエリパラメータからブックマークIDを取得する。
 * @returns 削除成功のメッセージをJSON形式で返す。IDが提供されていない場合や、削除に失敗した場合はエラーメッセージを返す。
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();

  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // bookmark_tags は CASCADE DELETE で自動削除される（Supabaseの外部キー設定次第）
  const { error } = await supabase.from("bookmarks").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
