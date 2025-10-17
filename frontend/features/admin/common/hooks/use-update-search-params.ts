import { useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * URL検索パラメータを更新するための汎用hook
 *
 * @returns updateSearchParams - パラメータを更新してURLをプッシュする関数
 */
export function useUpdateSearchParams() {
    const router = useRouter();

    // 検索パラメータを更新してルーターにプッシュ
    const updateSearchParams = useCallback(
        (params: Record<string, string | number | undefined | null>) => {
            const searchParams = new URLSearchParams();

            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== "") {
                    searchParams.set(key, String(value));
                }
            });

            router.push(`?${searchParams.toString()}`, { scroll: false });
        },
        [router]
    );

    return { updateSearchParams };
}
