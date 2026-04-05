"use client";

import { useState, useMemo } from "react";
import { Bookmark, Tag } from "@/types";
import BookmarkForm from "@/components/BookmarkForm";
import BookmarkCard from "@/components/BookmarkCard";
import TagFilter from "@/components/TagFilter";

type Props = {
  initialBookmarks: Bookmark[];
};

/**
 * ブックマーククライアントコンポーネント
 * @description クライアントコンポーネントとして、ブックマークの一覧表示、タグフィルター、ブックマークの追加・削除機能を提供する。
 * 親コンポーネントから初期ブックマークのデータを受け取り、内部で状態管理を行う。ユーザーがタグを選択してブックマークを絞り込むこともできる。
 * @param props 初期ブックマークのデータを受け取る。
 * @param props.initialBookmarks サーバーコンポーネントから渡される初期ブックマークの配列。
 * 各ブックマークはid、url、title、description、image_url、created_at、tagsを含む。
 * @returns ブックマーククライアントのJSX要素を返す。BookmarkForm、TagFilter、BookmarkCardを組み合わせて表示する。
 */
export default function BookmarkClient({ initialBookmarks }: Props) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // 全ブックマークからタグを重複なく抽出する
  const allTags: Tag[] = useMemo(() => {
    const map = new Map<string, Tag>();
    bookmarks.forEach((b) => b.tags.forEach((t) => map.set(t.id, t)));
    return Array.from(map.values());
  }, [bookmarks]);

  // 選択中のタグでフィルタリングする
  const filtered = selectedTag
    ? bookmarks.filter((b) => b.tags.some((t) => t.name === selectedTag))
    : bookmarks;

  const handleAdd = (bookmark: Bookmark) => {
    setBookmarks((prev) => [
      { ...bookmark, tags: bookmark.tags ?? [] },
      ...prev,
    ]);
  };

  const handleDelete = (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div className="flex flex-col gap-6">
      <BookmarkForm onAdd={handleAdd} />
      <TagFilter
        tags={allTags}
        selectedTag={selectedTag}
        onSelect={setSelectedTag}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((bookmark) => (
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
