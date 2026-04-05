"use client";

import { useState } from "react";
import { Bookmark } from "@/types";

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
  const handleSubmit = async (e: React.SyntheticEvent) => {
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
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 p-4 bg-white border rounded-lg shadow-sm"
    >
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">URL</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          required
          className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          タグ{" "}
          <span className="text-gray-400 font-normal">
            （カンマ区切りで複数入力可）
          </span>
        </label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="React, Next.js, TypeScript"
          className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white text-sm font-medium py-2 rounded hover:bg-blue-700 disabled:opacity-50 
  disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "登録中..." : "ブックマークを追加"}
      </button>
    </form>
  );
}
