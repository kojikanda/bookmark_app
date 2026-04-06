"use client";

import { Bookmark } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Trash2 } from "lucide-react";

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
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      {bookmark.image_url && (
        // ユーザー入力のURLを表示するため、サーバー負荷を考慮し最適化をスキップ
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bookmark.image_url}
          alt={bookmark.title ?? ""}
          loading="lazy"
          decoding="async"
          className="w-full h-40 object-cover"
        />
      )}
      <CardContent className="p-4 flex flex-col gap-2">
        {/* タイトル */}
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-blue-600 hover:underline line-clamp-2 flex items-start gap-1"
        >
          <ExternalLink className="h-4 w-4 mt-0.5 shrink-0" />
          {bookmark.title ?? bookmark.url}
        </a>

        {/* 説明 */}
        {bookmark.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {bookmark.description}
          </p>
        )}

        {/* タグ */}
        <div className="flex flex-wrap gap-1 mt-1">
          {bookmark.tags.map((tag) => (
            <Badge key={tag.id} variant="secondary">
              {tag.name}
            </Badge>
          ))}
        </div>

        {/* 削除ボタン */}
        <div className="flex justify-end mt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-muted-foreground hover:text-destructive h-7 px-2"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            削除
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
