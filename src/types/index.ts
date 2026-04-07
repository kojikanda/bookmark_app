/**
 * DB周り型宣言
 */

// Tagテーブル型宣言
export type Tag = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

// Bookmarkテーブル型宣言
export type Bookmark = {
  id: string;
  user_id: string;
  url: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  created_at: string;
  tags: Tag[];
};

// Bookmark登録時型宣言
export type BookmarkInsert = {
  url: string;
  title?: string | null;
  description?: string | null;
  image_url?: string | null;
};
