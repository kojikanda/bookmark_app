"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

type Props = {
  onSearch: (query: string) => void;
};

/**
 * 検索バーコンポーネント
 * @description ユーザーがキーワードを入力してブックマークを検索できるようにするコンポーネント。
 * 入力フィールドと検索ボタン、入力内容をクリアするボタンを含む。検索クエリは親コンポーネントに渡される。
 * @param props 検索クエリが更新されたときのコールバックを受け取る。
 * @param props.onSearch 検索クエリが更新されたときに呼び出されるコールバック関数。引数として現在の検索クエリを受け取る。
 * @returns 検索バーのJSX要素を返す。ユーザーがキーワードを入力して検索できるようにするUIを提供する。
 * 入力フィールドには検索アイコンが表示され、入力内容がある場合はクリアボタンも表示される。
 */
export default function SearchBar({ onSearch }: Props) {
  const [value, setValue] = useState("");

  const handleSubmit: NonNullable<
    React.ComponentProps<"form">["onSubmit"]
  > = async (e) => {
    e.preventDefault();
    onSearch(value);
  };

  const handleClear = () => {
    setValue("");
    onSearch("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="キーワードで検索..."
          className="pl-8 pr-8"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Button type="submit" variant="secondary">
        検索
      </Button>
    </form>
  );
}
