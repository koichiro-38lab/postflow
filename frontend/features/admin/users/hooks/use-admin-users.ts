import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
    fetchUsers,
    fetchMyProfile,
    PageResponse,
    UserResponse,
    UserStatus,
    UserRole,
} from "@/lib/api/admin/users";
import { fetchMediaDetail } from "@/lib/api/admin/media";
import { useAdminSession } from "@/features/admin/common/hooks/use-admin-session";
import { useUpdateSearchParams } from "@/features/admin/common/hooks/use-update-search-params";
import { UsersFilterParams, UserWithAvatar } from "../types";

/**
 * 管理画面のユーザー一覧ページで使用する状態管理hook
 * ページネーション、フィルタ、アバター取得を管理
 */
export function useAdminUsers() {
    const { authReady } = useAdminSession();
    const searchParams = useSearchParams();
    const { updateSearchParams } = useUpdateSearchParams();

    // URLパラメータから検索条件を抽出
    const filters = useMemo<UsersFilterParams>(() => {
        const pageFromURL = parseInt(searchParams.get("page") || "1");
        return {
            page: Math.max(0, pageFromURL - 1), // URLは1始まり、内部は0始まり
            size: parseInt(searchParams.get("size") || "10"),
            statusFilter: searchParams.get("status") || "ALL",
            roleFilter: searchParams.get("role") || "ALL",
        };
    }, [searchParams]);

    // ユーザー一覧のレスポンスデータ
    const [usersResponse, setUsersResponse] =
        useState<PageResponse<UserResponse> | null>(null);
    // アバター情報を含むユーザー一覧
    const [users, setUsers] = useState<UserWithAvatar[]>([]);
    // ローディング状態
    const [loading, setLoading] = useState(true);
    // 現在のユーザーID（自分自身は変更不可）
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    // アバターキャッシュ（メディアID → storageKey）
    const [avatarCache] = useState<Map<number, string>>(new Map());

    // 現在のユーザー情報を取得
    useEffect(() => {
        if (!authReady) return;

        const loadCurrentUser = async () => {
            try {
                const profile = await fetchMyProfile();
                setCurrentUserId(profile.id);
            } catch (error) {
                console.error("Failed to load current user:", error);
            }
        };
        loadCurrentUser();
    }, [authReady]);

    // ユーザー一覧を API から取得（認証完了後のみ）
    useEffect(() => {
        if (!authReady) return;

        const load = async () => {
            setLoading(true);
            try {
                const params: {
                    page: number;
                    size: number;
                    status?: UserStatus;
                    role?: UserRole;
                } = {
                    page: filters.page,
                    size: filters.size,
                };

                if (filters.statusFilter !== "ALL") {
                    params.status = filters.statusFilter as UserStatus;
                }
                if (filters.roleFilter !== "ALL") {
                    params.role = filters.roleFilter as UserRole;
                }

                const data = await fetchUsers(params);
                setUsersResponse(data);

                // 各ユーザーのアバター情報を取得（キャッシュ活用）
                const usersWithAvatars = await Promise.all(
                    data.content.map(async (user) => {
                        let avatarStorageKey: string | null = null;

                        if (user.avatarMediaId) {
                            // キャッシュから取得を試みる
                            if (avatarCache.has(user.avatarMediaId)) {
                                avatarStorageKey = avatarCache.get(
                                    user.avatarMediaId
                                )!;
                            } else {
                                // キャッシュにない場合は API から取得
                                try {
                                    const media = await fetchMediaDetail(
                                        user.avatarMediaId
                                    );
                                    avatarStorageKey = media.storageKey;
                                    avatarCache.set(
                                        user.avatarMediaId,
                                        media.storageKey
                                    );
                                } catch (error) {
                                    console.warn(
                                        `Failed to fetch avatar for user ${user.id}:`,
                                        error
                                    );
                                }
                            }
                        }

                        return {
                            ...user,
                            avatarStorageKey,
                        };
                    })
                );

                setUsers(usersWithAvatars);
                // スケルトンを少し長めに表示するために遅延を追加
                setTimeout(() => {
                    setLoading(false);
                }, 200);
            } catch (e: unknown) {
                console.error("Failed to load users:", e);
                setLoading(false);
            }
        };
        load();
    }, [authReady, filters, avatarCache]);

    // URL 更新とフィルタ変更を統合したハンドラ
    const updateFilters = useCallback(
        (updates: Partial<UsersFilterParams>) => {
            const newFilters = { ...filters, ...updates };

            updateSearchParams({
                page: newFilters.page + 1, // 内部の0始まりをURLの1始まりに変換
                status:
                    newFilters.statusFilter !== "ALL"
                        ? newFilters.statusFilter
                        : undefined,
                role:
                    newFilters.roleFilter !== "ALL"
                        ? newFilters.roleFilter
                        : undefined,
                size: newFilters.size !== 10 ? newFilters.size : undefined,
            });
        },
        [filters, updateSearchParams]
    );

    // ステータスフィルタ変更ハンドラ
    const handleStatusFilter = useCallback(
        (value: string) => {
            updateFilters({
                statusFilter: value,
                page: 0, // フィルター変更時は最初のページに戻る
            });
        },
        [updateFilters]
    );

    // ロールフィルタ変更ハンドラ
    const handleRoleFilter = useCallback(
        (value: string) => {
            updateFilters({
                roleFilter: value,
                page: 0, // フィルター変更時は最初のページに戻る
            });
        },
        [updateFilters]
    );

    // 表示件数変更ハンドラ
    const handleItemsPerPageChange = useCallback(
        (size: string) => {
            const newSize = parseInt(size);
            updateFilters({
                size: newSize,
                page: 0, // 件数変更時は最初のページに戻る
            });
        },
        [updateFilters]
    );

    // ページ変更ハンドラ（UIは1始まり、内部は0始まり）
    const handlePageChange = useCallback(
        (page: number) => {
            updateFilters({
                page: page - 1, // UIの1始まりを内部の0始まりに変換
            });
        },
        [updateFilters]
    );

    return {
        // データ
        usersResponse,
        users,
        currentUserId,
        // 状態
        loading,
        // フィルタ
        filters,
        // ハンドラ
        handleStatusFilter,
        handleRoleFilter,
        handleItemsPerPageChange,
        handlePageChange,
    };
}
