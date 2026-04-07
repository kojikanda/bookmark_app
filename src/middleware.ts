import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 *  Supabaseのセッション管理を行うMiddleware
 *  - クッキーの読み書きをフックして、サーバーコンポーネントとクライアントコンポーネントの両方でセッションを共有できるようにする
 *  - ユーザーが未ログインで保護されたページにアクセスしたときにログインページへリダイレクトする
 * @param request Next.jsのNextRequestオブジェクト
 * @returns NextResponseオブジェクト（必要に応じてリダイレクトを含む）
 */
export async function middleware(request: NextRequest) {
  // レスポンスを一旦作成（後でクッキーを書き込むために必要）
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Supabaseクライアントを作成。クッキーの読み書きをフックするために、ここでクライアントを作成する必要がある。
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // リクエスト側にも書く（後続のサーバーコンポーネントが読めるように）
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          // レスポンス側にも書く（ブラウザのクッキーを更新するために）
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // セッションを更新する
  // getUser()を呼ぶことで、内部でトークンのリフレッシュが走る
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 未ログインユーザーが保護ページにアクセスしたらログインページへリダイレクト
  // /login, /signup, /apiなどのパブリックなパスは除外する
  const publicPaths = ["/login", "/signup"];
  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");
  if (!user && !isApiRoute && !publicPaths.includes(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

// Middleware を実行するパスを指定
export const config = {
  matcher: [
    // Next.js の内部ファイルと静的ファイルはスキップ
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
