"use client";

import { useState } from "react";
import { Bookmark } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BookmarkPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import TagInput from "@/components/TagInput";
import { Tag } from "@/types";

type Props = {
  onAdd: (bookmark: Bookmark) => void;
  allTags: Tag[];
};

/**
 * ブックマーク登録フォームコンポーネント
 * @description ユーザーがURLとタグを入力してブックマークを登録できるフォームコンポーネント。
 * URLは必須で、タグはカンマ区切りで複数入力可能。
 * 登録ボタンを押すとAPIにPOSTリクエストを送り、成功したら親コンポーネントに新しいブックマークを渡す。
 * @param props ブックマークが正常に登録されたときのコールバックを受け取る。
 * @param props.onAdd ブックマークが正常に登録された後に呼び出されるコールバック関数。引数として新しく登録されたブックマークの情報を受け取る。
 * @param props.allTags ブックマークに付与された全てのタグの配列。
 * @returns ブックマーク登録フォームのJSX要素を返す。
 */
export default function BookmarkForm({ onAdd, allTags }: Props) {
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [tagInputKey, setTagInputKey] = useState(0);

  // フォームの送信イベントハンドラ
  const handleSubmit: NonNullable<
    React.ComponentProps<"form">["onSubmit"]
  > = async (e) => {
    // フォームのデフォルトの送信動作をキャンセル
    e.preventDefault();
    setLoading(true);

    // 送信直後にTagInputKeyの値を変更することで、TagInputコンポーネントのkeyを更新して
    // 強制的に再レンダリングし、入力フィールドをリセットする
    setTagInputKey((prev) => prev + 1);

    // タグはTagInputコンポーネントから文字列の配列で受け取る
    const tagNames = tags;

    // APIを使用してブックマークを登録するためのPOSTリクエストを送る
    const res = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, tags: tagNames }),
    });

    if (!res.ok) {
      toast.error("登録に失敗しました", {
        description: "URLを確認してください。",
        classNames: {
          description: "!text-red-600",
        },
      });
      setLoading(false);
      return;
    }

    const newBookmark = await res.json();
    onAdd(newBookmark);
    toast.success("ブックマークを登録しました");
    setUrl("");
    setTags([]);
    setLoading(false);
  };

  return (
    <Card style={{ overflow: "visible" }}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookmarkPlus className="h-5 w-5" />
          ブックマークを追加
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>タグ</Label>
            <TagInput
              key={tagInputKey}
              value={tags}
              onChange={setTags}
              allTags={allTags}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                登録中...
              </>
            ) : (
              "ブックマークを追加"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
