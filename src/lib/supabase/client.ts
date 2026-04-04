import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabaseクライアント(クライアントコンポーネント)を作成するメソッド
 * @returns Supabaseクライアントインスタンス
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
