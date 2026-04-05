"use client";

import { Tag } from "@/types";

type Props = {
  tags: Tag[];
  selectedTag: string | null;
  onSelect: (tagName: string | null) => void;
};

/**
 * タグフィルターコンポーネント
 * @description ブックマークに付与されたタグの一覧を表示し、ユーザーがタグを選択してブックマークを絞り込めるようにするコンポーネント。
 * タグはボタン形式で表示され、選択されたタグはスタイルが変わる。すべてのタグを表示する「すべて」ボタンも含まれる。
 * @param props タグの配列、現在選択されているタグ名、タグが選択されたときの処理を受け取る。
 * @param tags ブックマークに付与されたタグの配列。各タグはid、name、created_atを含む。
 * @param selectedTag 現在選択されているタグの名前。nullの場合はすべてのタグが選択されている状態。
 * @param onSelect タグが選択されたときに呼び出されるコールバック関数。引数として選択されたタグの名前を受け取る。すべてのタグが選択された場合はnullが渡される。
 * @returns
 */
export default function TagFilter({ tags, selectedTag, onSelect }: Props) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={`text-sm px-3 py-1 rounded-full border transition-colors ${
          selectedTag === null
            ? "bg-blue-600 text-white border-blue-600"
            : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
        }`}
      >
        すべて
      </button>

      {tags.map((tag) => (
        <button
          key={tag.id}
          onClick={() => onSelect(tag.name)}
          className={`text-sm px-3 py-1 rounded-full border transition-colors ${
            selectedTag === tag.name
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
          }`}
        >
          {tag.name}
        </button>
      ))}
    </div>
  );
}
