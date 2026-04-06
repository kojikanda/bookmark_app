"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { X, Tag as TagIcon } from "lucide-react";
import { Tag } from "@/types";

type Props = {
  value: string[];
  onChange: (tags: string[]) => void;
  allTags: Tag[];
};

export default function TagInput({ value, onChange, allTags }: Props) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1); // -1 = 何も選択していない

  // タグを追加するメソッド(重複や空白は無視)
  const addTag = (tagName: string) => {
    const trimmed = tagName.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setInputValue("");
    setFocusedIndex(-1);
  };

  // タグを削除するメソッド
  const removeTag = (tagName: string) => {
    onChange(value.filter((t) => t !== tagName));
  };

  // タグを入力値でフィルタリング。すでに選択されているタグは除外する。
  const filteredTags = allTags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.includes(tag.name),
  );

  // 新しいタグを追加できるか判断
  const canAddNew =
    inputValue.trim() !== "" &&
    !allTags.some(
      (t) => t.name.toLowerCase() === inputValue.trim().toLowerCase(),
    ) &&
    !value.includes(inputValue.trim());

  // キーボードナビゲーション用のフラットなアイテムリスト
  // 既存タグ → 新しいタグ の順に並べる
  const navItems = [
    ...filteredTags.map((tag) => ({
      label: tag.name,
      onSelect: () => addTag(tag.name),
    })),
    ...(canAddNew
      ? [{ label: inputValue.trim(), onSelect: () => addTag(inputValue) }]
      : []),
  ];

  // キーボードイベントのハンドラ
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      setFocusedIndex(-1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault(); // ページスクロールを防ぐ
      if (!open) setOpen(true);
      setFocusedIndex((prev) => Math.min(prev + 1, navItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && focusedIndex >= 0) {
      e.preventDefault(); // フォーム送信を防ぐ
      navItems[focusedIndex]?.onSelect();
      setOpen(false);
    }
  };

  return (
    <div
      className="relative"
      onBlur={(e) => {
        // フォーカスがコンポーネント外に移ったらドロップダウンを閉じる
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setOpen(false);
          setFocusedIndex(-1);
        }
      }}
    >
      {/* 入力エリア：チップ + テキスト入力 */}
      <div
        className="flex flex-wrap gap-1.5 min-h-10 px-3 py-2 border rounded-md bg-background cursor-text focus-within:ring-2 focus-within:ring-ring"
        onClick={() => setOpen(true)}
      >
        {value.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="flex items-center gap-1 h-6"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="hover:text-destructive focus:outline-none"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          className="flex-1 min-w-24 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
          placeholder={value.length === 0 ? "タグを入力して選択..." : ""}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setOpen(true);
            setFocusedIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* ドロップダウン */}
      {open && (filteredTags.length > 0 || canAddNew) && (
        <div
          className="absolute z-50 w-full mt-1 border rounded-md bg-popover shadow-md"
          onMouseDown={(e) => e.preventDefault()} // クリック時に input のフォーカスを維持する
        >
          <Command shouldFilter={false} value="__none__">
            <CommandList>
              <CommandEmpty>タグが見つかりません</CommandEmpty>
              {filteredTags.length > 0 && (
                <CommandGroup heading="既存のタグ">
                  {filteredTags.map((tag, i) => (
                    <CommandItem
                      key={tag.id}
                      className={`${focusedIndex === i ? "bg-blue-100 dark:bg-blue-900/50" : ""} hover:bg-blue-100 dark:hover:bg-blue-900/50`}
                      onSelect={() => {
                        addTag(tag.name);
                        setOpen(false);
                      }}
                    >
                      <TagIcon className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      {tag.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {canAddNew && (
                <CommandGroup heading="新しいタグ">
                  <CommandItem
                    className={`${focusedIndex === filteredTags.length ? "bg-blue-100 dark:bg-blue-900/50" : ""} hover:bg-blue-100 dark:hover:bg-blue-900/50`}
                    onSelect={() => {
                      addTag(inputValue);
                      setOpen(false);
                    }}
                  >
                    <TagIcon className="h-3.5 w-3.5 mr-2" />「{inputValue}
                    」を追加
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
