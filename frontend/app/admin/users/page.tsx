"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useAdminUsers } from "@/features/admin/users/hooks/use-admin-users";
import { UserTable } from "@/components/admin/users/UserTable";
import { UserFilters } from "@/components/admin/users/UserFilters";
import { AdminPagination } from "@/features/admin/common/components/AdminPagination";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function UsersPageContent() {
    // hook から必要な状態とハンドラを取得
    const {
        usersResponse,
        users,
        currentUserId,
        loading,
        filters,
        handleStatusFilter,
        handleRoleFilter,
        handleItemsPerPageChange,
        handlePageChange,
    } = useAdminUsers();

    // 総ページ数
    const totalPages = usersResponse?.totalPages || 0;
    // ユーザー総件数
    const totalCount = usersResponse?.totalElements || 0;

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            {/* ヘッダー */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold">ユーザー管理</h1>
                <Button>
                    <UserPlus className="h-4 w-4" />
                    <Link href="/admin/users/create">新規ユーザー作成</Link>
                </Button>
            </div>

            {/* フィルターセクション */}
            <UserFilters
                statusFilter={filters.statusFilter}
                roleFilter={filters.roleFilter}
                itemsPerPage={filters.size}
                onStatusChange={handleStatusFilter}
                onRoleChange={handleRoleFilter}
                onItemsPerPageChange={handleItemsPerPageChange}
            />
            {/* 将来フィルタ側にも件数を渡す場合は props 拡張で対応 */}
            <div className="text-sm text-muted-foreground mb-3">
                {loading ? (
                    <Skeleton className="h-4 w-14" />
                ) : (
                    `全 ${totalCount} 件`
                )}
            </div>

            {/* テーブル */}
            <UserTable
                users={users}
                loading={loading}
                itemsPerPage={filters.size}
                currentUserId={currentUserId}
            />

            {/* ページネーション */}
            {usersResponse && (
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

export default function UsersPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <UsersPageContent />
        </Suspense>
    );
}
