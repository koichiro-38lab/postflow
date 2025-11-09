import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { fetchAdminPosts, PostsResponse } from "@/lib/api/admin/posts";
import { fetchCategories, Category } from "@/lib/api/admin/categories";
import { useAdminSession } from "@/features/admin/common/hooks/use-admin-session";
import { useUpdateSearchParams } from "@/features/admin/common/hooks/use-update-search-params";
import { isApiError } from "@/lib/api";
import { PostsFilterParams, SortField, SortDirection } from "../types";
import { derivePublicationState } from "@/features/admin/posts/utils/derive-publication-state";

/**
 * 管理画面の投稿一覧ページで使用する状態管理hook
 * 認証待ち、クエリ同期、API フェッチ、フィルタ変更を統合
 */
export function useAdminPosts() {
    const { authReady } = useAdminSession();
    const searchParams = useSearchParams();
    const { updateSearchParams } = useUpdateSearchParams();

    // URLパラメータから検索条件を抽出
    const filters = useMemo<PostsFilterParams>(() => {
        const pageFromURL = parseInt(searchParams.get("page") || "1");
        return {
            page: Math.max(0, pageFromURL - 1), // URLは1始まり、内部は0始まり
            size: parseInt(searchParams.get("size") || "10"),
            sortField: (searchParams.get("sort") as SortField) || "publishedAt",
            sortDirection:
                (searchParams.get("order") as SortDirection) || "desc",
            statusFilter: searchParams.get("status") || "",
            categoryFilter: searchParams.get("category") || "",
        };
    }, [searchParams]);

    // 投稿一覧のレスポンスデータ
    const [postsResponse, setPostsResponse] = useState<PostsResponse | null>(
        null
    );
    // ローディング状態
    const [loading, setLoading] = useState(true);
    // エラーメッセージ
    const [error, setError] = useState<string | null>(null);
    // カテゴリ一覧
    const [categories, setCategories] = useState<Category[]>([]);

    // カテゴリ一覧を取得（認証完了後）
    useEffect(() => {
        if (!authReady) return;

        const loadCategories = async () => {
            try {
                const data = await fetchCategories();
                setCategories(data);
            } catch (e) {
                console.error("カテゴリ取得エラー:", e);
            }
        };
        loadCategories();
    }, [authReady]);

    // 投稿一覧を API から取得（認証完了後のみ）
    useEffect(() => {
        if (!authReady) return;

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchAdminPosts({
                    page: filters.page,
                    size: filters.size,
                    sort: filters.sortField,
                    order: filters.sortDirection,
                    status: filters.statusFilter,
                    categoryId: filters.categoryFilter,
                });
                // 予約公開情報を付与した投稿一覧
                const enhancedContent = data.content.map((post) => ({
                    ...post,
                    publicationState: derivePublicationState(post),
                }));
                // 公開状態付きレスポンス
                const enhancedData = { ...data, content: enhancedContent };
                setPostsResponse(enhancedData);
                // スケルトンを少し長めに表示するために遅延を追加
                setTimeout(() => {
                    setLoading(false);
                }, 200);
            } catch (e: unknown) {
                if (!(isApiError(e) && e.response?.status === 401)) {
                    setError(
                        e instanceof Error ? e.message : "取得に失敗しました"
                    );
                }
                setLoading(false);
            }
        };
        load();
    }, [authReady, filters]);

    // URL 更新とフィルタ変更を統合したハンドラ（1始まりで保存）
    const updateFilters = useCallback(
        (updates: Partial<PostsFilterParams>) => {
            const newFilters = { ...filters, ...updates };

            // ページを1始まりに変換してURLに保存
            updateSearchParams({
                page: newFilters.page + 1,
                sort: newFilters.sortField,
                order: newFilters.sortDirection,
                status: newFilters.statusFilter || undefined,
                category: newFilters.categoryFilter || undefined,
                size: newFilters.size !== 10 ? newFilters.size : undefined,
            });
        },
        [filters, updateSearchParams]
    );

    // ソート変更ハンドラ
    const handleSort = useCallback(
        (field: SortField) => {
            const newDirection =
                filters.sortField === field && filters.sortDirection === "asc"
                    ? "desc"
                    : "asc";
            updateFilters({
                sortField: field,
                sortDirection: newDirection,
                page: 0, // ソート変更時は最初のページに戻る
            });
        },
        [filters.sortField, filters.sortDirection, updateFilters]
    );

    // ステータスフィルタ変更ハンドラ
    const handleStatusFilter = useCallback(
        (status: string) => {
            const actualStatus = status === "all" ? "" : status;
            updateFilters({
                statusFilter: actualStatus,
                page: 0, // フィルター変更時は最初のページに戻る
            });
        },
        [updateFilters]
    );

    // カテゴリフィルタ変更ハンドラ
    const handleCategoryFilter = useCallback(
        (categoryId: string) => {
            const actualCategoryId = categoryId === "all" ? "" : categoryId;
            updateFilters({
                categoryFilter: actualCategoryId,
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
        postsResponse,
        categories,
        // 状態
        loading,
        error,
        // フィルタ
        filters,
        // ハンドラ
        handleSort,
        handleStatusFilter,
        handleCategoryFilter,
        handleItemsPerPageChange,
        handlePageChange,
    };
}
