"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useAdminPosts } from "@/features/admin/posts/hooks/use-admin-posts";
import { AdminPostsTable } from "@/components/admin/posts/AdminPostsTable";
import { AdminPostsFilters } from "@/components/admin/posts/AdminPostsFilters";
import { AdminPagination } from "@/features/admin/common/components/AdminPagination";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil } from "lucide-react";

function AdminPostsPageContent() {
    // hook から必要な状態とハンドラを取得
    const {
        postsResponse,
        categories,
        loading,
        error,
        filters,
        handleSort,
        handleStatusFilter,
        handleCategoryFilter,
        handleItemsPerPageChange,
        handlePageChange,
    } = useAdminPosts();

    // 投稿一覧データ
    const posts = postsResponse?.content || [];
    // 総ページ数
    const totalPages = postsResponse?.totalPages || 0;
    // 投稿総件数
    const totalCount = postsResponse?.totalElements || 0;

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            {/* ヘッダー */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold">記事一覧</h1>
                <Link href="/admin/posts/new">
                    <Button>
                        <Pencil className="h-4 w-4" />
                        新規作成
                    </Button>
                </Link>
            </div>

            {/* フィルターセクション */}
            <AdminPostsFilters
                statusFilter={filters.statusFilter}
                categoryFilter={filters.categoryFilter}
                itemsPerPage={filters.size}
                categories={categories}
                onStatusChange={handleStatusFilter}
                onCategoryChange={handleCategoryFilter}
                onItemsPerPageChange={handleItemsPerPageChange}
            />
            {/* 将来フィルタ側にも件数を渡す場合は props 拡張で対応 */}

            {(loading || postsResponse) && (
                <div className="text-sm text-muted-foreground mb-3">
                    {loading ? (
                        <Skeleton className="h-4 w-14" />
                    ) : (
                        `全 ${totalCount} 件`
                    )}
                </div>
            )}

            {/* エラー表示 */}
            {error && <div className="text-red-500 mb-4">{error}</div>}

            {/* テーブル */}
            <AdminPostsTable
                posts={posts}
                loading={loading}
                itemsPerPage={filters.size}
                sortField={filters.sortField}
                sortDirection={filters.sortDirection}
                onSort={handleSort}
            />

            {/* ページネーション */}
            {postsResponse && (
                <AdminPagination
                    currentPage={filters.page}
                    totalPages={totalPages}
                    loading={loading}
                    onPageChange={handlePageChange}
                />
            )}
        </div>
    );
}

export default function AdminPostsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AdminPostsPageContent />
        </Suspense>
    );
}
