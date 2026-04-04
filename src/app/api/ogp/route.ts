import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

/**
 * URLからOGP情報を取得するAPIエンドポイント
 * @param request Next.jsのリクエストオブジェクト。クエリパラメータからURLを取得する。
 * @returns OGP情報をJSON形式で返す。URLが提供されていない場合や、URLの取得に失敗した場合はエラーメッセージを返す。
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BookmarkBot/1.0)" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch URL" },
        { status: 502 },
      );
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const getMeta = (property: string) =>
      $(`meta[property="${property}"]`).attr("content") ||
      $(`meta[name="${property}"]`).attr("content") ||
      null;

    const ogp = {
      title: getMeta("og:title") ?? $("title").text() ?? null,
      description: getMeta("og:description") ?? getMeta("description") ?? null,
      image_url: getMeta("og:image") ?? null,
    };

    return NextResponse.json(ogp);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
