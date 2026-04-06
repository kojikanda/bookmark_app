"use client";

import { useState } from "react";
import { Bookmark } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookmarkPlus, Loader2, AlertCircle } from "lucide-react";

type Props = {
  onAdd: (bookmark: Bookmark) => void;
};

/**
 * ブックマーク登録フォームコンポーネント
 * @description ユーザーがURLとタグを入力してブックマークを登録できるフォームコンポーネント。
 * URLは必須で、タグはカンマ区切りで複数入力可能。
 * 登録ボタンを押すとAPIにPOSTリクエストを送り、成功したら親コンポーネントに新しいブックマークを渡す。
 * @param props ブックマークが正常に登録されたときのコールバックを受け取る。
 * @param props.onAdd ブックマークが正常に登録された後に呼び出されるコールバック関数。引数として新しく登録されたブックマークの情報を受け取る。
 * @returns ブックマーク登録フォームのJSX要素を返す。
 */
export default function BookmarkForm({ onAdd }: Props) {
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // フォームの送信イベントハンドラ
  const handleSubmit: NonNullable<
    React.ComponentProps<"form">["onSubmit"]
  > = async (e) => {
    // フォームのデフォルトの送信動作をキャンセル
    e.preventDefault();
    setLoading(true);
    setError(null);

    const tagNames = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t !== "");

    const res = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, tags: tagNames }),
    });

    if (!res.ok) {
      setError("登録に失敗しました。URLを確認してください。");
      setLoading(false);
      return;
    }

    const newBookmark = await res.json();
    onAdd(newBookmark);
    setUrl("");
    setTags("");
    setLoading(false);
  };

  return (
    <Card>
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
            <Label htmlFor="tags">
              タグ{" "}
              <span className="text-muted-foreground font-normal text-xs">
                （カンマ区切りで複数入力可）
              </span>
            </Label>
            <Input
              id="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="React, Next.js, TypeScript"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

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
