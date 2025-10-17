import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";

/**
 * 管理画面全体で使用する認証セッション状態を管理
 *
 * @returns user - 現在のユーザー情報
 * @returns isLoading - 認証情報のローディング状態
 * @returns authReady - 認証情報の確定状態（ローディング完了 + ユーザー存在確認）
 */
export function useAdminSession() {
    const { user, accessToken, refresh } = useAuthStore();
    const [authReady, setAuthReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const ensureSession = async () => {
            // 既にアクセストークンがある場合は即座に確定
            if (accessToken) {
                if (!cancelled) {
                    setAuthReady(true);
                    setIsLoading(false);
                }
                return;
            }

            // トークンがない場合はリフレッシュを試行
            const token = await refresh();
            if (cancelled) return;

            if (token) {
                setAuthReady(true);
            } else {
                setAuthReady(false);
            }
            setIsLoading(false);
        };

        ensureSession();

        return () => {
            cancelled = true;
        };
    }, [accessToken, refresh]);

    return { user, isLoading, authReady };
}
