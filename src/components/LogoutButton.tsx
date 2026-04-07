"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

/**
 * ログアウトボタンコンポーネント
 * @description ユーザーがログアウトするためのボタンコンポーネント。
 * クリックするとSupabaseのサインアウト機能を呼び出し、成功したらログインページへリダイレクトする。
 * @returns ログアウトボタンのJSX要素を返す。
 */
export default function LogoutButton() {
  const router = useRouter();

  // ログアウトイベントハンドラ
  const handleLogout = async () => {
    const supabase = createClient();
    // ログアウトを実行
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error("ログアウトに失敗しました。", {
        description: error.message,
        classNames: {
          description: "!text-red-600",
        },
      });
    } else {
      toast.success("ログアウトしました");
      // ログアウト成功後はログインページへリダイレクトし、サーバーコンポーネントのキャッシュを破棄してユーザー情報を更新する
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleLogout}>
      <LogOut className="h-4 w-4 mr-1" />
      ログアウト
    </Button>
  );
}
