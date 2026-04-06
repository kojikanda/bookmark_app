"use client";

import { useState } from "react";
import { Bookmark } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
  const [deleting, setDeleting] = useState(false);

  // ブックマーク削除イベントハンドラ
  const handleDelete = async () => {
    setDeleting(true);

    // APIにDELETEリクエストを送る
    const res = await fetch(`/api/bookmarks?id=${bookmark.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error("削除に失敗しました");
      setDeleting(false);
      return;
    }

    // 削除成功後、親コンポーネントに削除されたブックマークのIDを渡す
    // 親コンポーネントはこのIDを使ってローカルの状態から削除されたブックマークを取り除く
    // 削除したときは、setDeleting(false)は呼び出さない。
    // なぜなら、削除されたブックマークはUIから消えるため、削除中の状態をリセットする必要がないから。
    onDelete(bookmark.id);
    toast.success("ブックマークを削除しました");
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

        {/* 削除ダイアログ */}
        <div className="flex justify-end mt-1">
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button variant="destructive" size="sm" className="h-7 px-2" />
              }
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              削除
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  ブックマークを削除しますか？
                </AlertDialogTitle>
                <AlertDialogDescription>
                  「{bookmark.title ?? bookmark.url}」を削除します。
                  <br />
                  この操作は取り消せません。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>
                  キャンセル
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? "削除中..." : "削除する"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
