"use client";

import { Tag } from "@/types";
import { Button } from "@/components/ui/button";

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
      <Button
        variant={selectedTag === null ? "default" : "outline"}
        size="sm"
        onClick={() => onSelect(null)}
        className="rounded-full"
      >
        すべて
      </Button>

      {tags.map((tag) => (
        <Button
          key={tag.id}
          variant={selectedTag === tag.name ? "default" : "outline"}
          size="sm"
          onClick={() => onSelect(tag.name)}
          className="rounded-full"
        >
          {tag.name}
        </Button>
      ))}
    </div>
  );
}
