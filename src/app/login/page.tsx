"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

/**
 * ログインページコンポーネント
 * - メールアドレスとパスワードを入力してログインするフォームを提供
 * - ログイン成功後はトップページへリダイレクトし、サーバーコンポーネントのキャッシュを破棄してユーザー情報を更新する
 * @returns ログインページのJSX要素
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // フォームの送信ハンドラー
  const handleLogin: NonNullable<
    React.ComponentProps<"form">["onSubmit"]
  > = async (e) => {
    // フォームのデフォルトの送信動作をキャンセル
    e.preventDefault();
    setLoading(true);

    // ログインを実行
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error("ログインに失敗しました。", {
        description: "メールアドレスとパスワードを確認してください。",
        classNames: {
          description: "!text-red-600",
        },
      });

      // エラー時のみローディング状態を解除する（成功時はリダイレクトするため不要）
      setLoading(false);
    } else {
      toast.success("ログインしました");
      router.push("/");
      // サーバーコンポーネントのキャッシュを破棄して再取得することで、ユーザー情報が更新されるようにする
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>ログイン</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "ログイン中..." : "ログイン"}
            </Button>
          </form>
          <p className="text-sm text-center text-muted-foreground mt-4">
            アカウントをお持ちでない方は{" "}
            <Link href="/signup" className="underline">
              新規登録
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
