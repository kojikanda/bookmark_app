import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabaseクライアント(サーバコンポーネント)を作成するメソッド
 * @returns Supabaseクライアントインスタンス
 */
export async function createClient() {
  // リクエストからCookieを取得するために cookieStoreを作成
  // SSR(Server Side Rendering)から呼ばれたときは、ブラウザのCookieを直接読めないため、
  // Next.jsのcookies()を使って、リクエストに含まれるCookieを取得する必要がある。
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // SupabaseがCookieを読み込むときに呼ばれるメソッド
        getAll() {
          return cookieStore.getAll();
        },
        // SupabaseがCookieを書き込むときに呼ばれるメソッド
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Componentから呼ばれた場合はsetできず、例外スローされるが特に問題ないため無視する
          }
        },
      },
    },
  );
}
