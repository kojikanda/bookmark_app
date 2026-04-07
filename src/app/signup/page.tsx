"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";

/**
 * ユーザ登録画面コンポーネント
 * - メールアドレスとパスワードを入力して新規アカウントを作成するフォームを提供
 * - サインアップ成功後はトップページへリダイレクトし、サーバーコンポーネントのキャッシュを破棄してユーザー情報を更新する
 * @returns ユーザ登録画面のJSX要素
 */
export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // フォームの送信ハンドラ
  const handleSignup: NonNullable<
    React.ComponentProps<"form">["onSubmit"]
  > = async (e) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      toast.error("ユーザ登録に失敗しました。", {
        description: error.message,
        classNames: {
          description: "!text-red-600",
        },
      });
    } else {
      toast.success("ユーザ登録に成功しました！");
      // ログイン画面ではなく、アプリのメイン画面へ直接飛ばす
      router.push("/");
      // セッション情報を反映させるためにサーバーコンポーネントのキャッシュを破棄して再取得する
      router.refresh();
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <Card className="w-full max-w-sm border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-600">アカウント登録</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                suppressHydrationWarning
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
                suppressHydrationWarning
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "登録中..." : "登録する"}
            </Button>
          </form>
          <p className="text-sm text-center text-muted-foreground mt-4">
            アカウントをお持ちの方は{" "}
            <Link href="/login" className="underline">
              ログイン
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
