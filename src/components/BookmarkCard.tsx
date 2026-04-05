"use client";

import { Bookmark } from "@/types";

type Props = {
  bookmark: Bookmark;
  onDelete: (id: string) => void;
};

/**
 * ブックマークカードコンポーネント
 * @description ブックマークのURL、タイトル、説明、タグを表示するカードコンポーネント。削除ボタンも含まれる。
 * URLはクリック可能で新しいタブで開く。OGP画像がある場合はカードの上部に表示される。
 * @param props ブックマークデータと削除後の処理を受け取る。
 * @param props.bookmark: ブックマークの情報を含むオブジェクト。
 * @param props.onDelete: ブックマークが削除された後に呼び出されるコールバック関数。
 * @returns ブックマークカードのJSX要素を返す。
 */
export default function BookmarkCard({ bookmark, onDelete }: Props) {
  // 削除ボタン押下時のイベントハンドラ
  const handleDelete = async () => {
    if (!confirm("削除しますか？")) return;

    await fetch(`/api/bookmarks?id=${bookmark.id}`, { method: "DELETE" });
    onDelete(bookmark.id);
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* OGP画像 */}
      {bookmark.image_url && (
        <>
          {/* ユーザー入力のURLを表示するため、サーバー負荷を考慮し最適化をスキップ */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bookmark.image_url}
            alt={bookmark.title ?? ""}
            loading="lazy" // 画面外の画像はロードしない（表示速度と通信量の節約）
            decoding="async" // 画像の展開を非同期で行い、スクロールのカクつきを防止
            className="w-full h-40 object-cover"
          />
        </>
      )}

      <div className="p-4 flex flex-col gap-2">
        {/* タイトル */}
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-blue-600 hover:underline line-clamp-2"
        >
          {bookmark.title ?? bookmark.url}
        </a>

        {/* 説明 */}
        {bookmark.description && (
          <p className="text-sm text-gray-500 line-clamp-2">
            {bookmark.description}
          </p>
        )}

        {/* タグ */}
        <div className="flex flex-wrap gap-1 mt-1">
          {bookmark.tags.map((tag) => (
            <span
              key={tag.id}
              className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full"
            >
              {tag.name}
            </span>
          ))}
        </div>

        {/* 削除ボタン */}
        <button
          onClick={handleDelete}
          className="self-end text-xs text-red-400 hover:text-red-600 mt-1"
        >
          削除
        </button>
      </div>
    </div>
  );
}
