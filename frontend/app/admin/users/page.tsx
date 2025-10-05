"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    fetchUsers,
    fetchMyProfile,
    UserResponse,
    UserStatus,
    UserRole,
    PageResponse,
} from "@/lib/user-api";
import {
    getUserStatusLabel,
    getUserRoleLabel,
    USER_STATUS_LABELS,
    USER_ROLE_LABELS,
} from "@/lib/user-utils";
import { fetchMediaDetail } from "@/lib/media-api";
import { buildMediaUrl } from "@/lib/media-url";
import { useAuthStore } from "@/lib/auth-store";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
} from "@/components/ui/pagination";
import { Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ユーザー情報とアバター情報を組み合わせた型
type UserWithAvatar = UserResponse & {
    avatarStorageKey?: string | null;
};

function getInitials(displayName: string | null, email: string): string {
    if (displayName) {
        return displayName.charAt(0).toUpperCase();
    }
    return email.charAt(0).toUpperCase();
}

export default function UsersPage() {
    // URLパラメーターから初期値を設定
    const router = useRouter();
    const searchParams = useSearchParams();

    // 現在のユーザーID（自分自身は変更不可）
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [usersResponse, setUsersResponse] =
        useState<PageResponse<UserResponse> | null>(null);
    const [users, setUsers] = useState<UserWithAvatar[]>([]);
    const [authReady, setAuthReady] = useState(false);
    const [currentPage, setCurrentPage] = useState(
        Math.max(0, parseInt(searchParams.get("page") || "1") - 1) // URLは1始まり、内部は0始まり
    );
    const [statusFilter, setStatusFilter] = useState<UserStatus | "ALL">(
        (searchParams.get("status") as UserStatus) || "ALL"
    );
    // ロールフィルタの状態管理
    const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">(
        (searchParams.get("role") as UserRole) || "ALL"
    );
    const [itemsPerPage, setItemsPerPage] = useState<number>(
        parseInt(searchParams.get("size") || "10")
    );

    const { accessToken, refresh } = useAuthStore();

    useEffect(() => {
        let cancelled = false;

        const ensureSession = async () => {
            if (accessToken) {
                if (!cancelled) setAuthReady(true);
                return;
            }

            const token = await refresh();
            if (cancelled) return;
            if (token) {
                setAuthReady(true);
            } else {
                setAuthReady(false);
            }
        };

        ensureSession();

        return () => {
            cancelled = true;
        };
    }, [accessToken, refresh]);

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
                    page: currentPage,
                    size: itemsPerPage,
                };
                if (statusFilter !== "ALL") {
                    params.status = statusFilter;
                }
                if (roleFilter !== "ALL") {
                    params.role = roleFilter;
                }
                const data = await fetchUsers(params);

                setUsersResponse(data);

                // 各ユーザーのアバター情報を取得
                const usersWithAvatars = await Promise.all(
                    data.content.map(async (user) => {
                        let avatarStorageKey: string | null = null;

                        if (user.avatarMediaId) {
                            try {
                                const media = await fetchMediaDetail(
                                    user.avatarMediaId
                                );
                                avatarStorageKey = media.storageKey;
                            } catch (error) {
                                console.warn(
                                    `Failed to fetch avatar for user ${user.id}:`,
                                    error
                                );
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
                setLoading(false); // エラー時は即座にローディング終了
            }
        };
        load();
    }, [authReady, currentPage, statusFilter, roleFilter, itemsPerPage]);

    // URL更新関数（1始まりで保存）
    const updateURL = (
        page: number,
        status: UserStatus | "ALL",
        role: UserRole | "ALL",
        size: number
    ) => {
        const params = new URLSearchParams();
        params.set("page", (page + 1).toString()); // 内部の0始まりをURLの1始まりに変換
        if (status !== "ALL") params.set("status", status);
        if (role !== "ALL") params.set("role", role);
        if (size !== 10) params.set("size", size.toString()); // デフォルト値の場合はURLに含めない

        router.push(`?${params.toString()}`, { scroll: false });
    };

    // URLクエリパラメータの変更を監視して状態を同期
    useEffect(() => {
        const pageFromURL = parseInt(searchParams.get("page") || "1");
        const page = Math.max(0, pageFromURL - 1); // URLの1始まりを内部の0始まりに変換
        const status = (searchParams.get("status") as UserStatus) || "ALL";
        const role = (searchParams.get("role") as UserRole) || "ALL";
        const size = parseInt(searchParams.get("size") || "10");

        setCurrentPage(page);
        setStatusFilter(status);
        setRoleFilter(role);
        setItemsPerPage(size);
    }, [searchParams]);

    // 現在のユーザー情報を取得
    useEffect(() => {
        const loadCurrentUser = async () => {
            try {
                const profile = await fetchMyProfile();
                setCurrentUserId(profile.id);
            } catch (error) {
                console.error("Failed to load current user:", error);
            }
        };
        loadCurrentUser();
    }, []);

    const handleStatusFilter = (value: string) => {
        const newStatus = value as UserStatus | "ALL";
        setStatusFilter(newStatus);
        setCurrentPage(0); // フィルター変更時は最初のページに戻る
        updateURL(0, newStatus, roleFilter, itemsPerPage);
    };

    const handleRoleFilter = (value: string) => {
        const newRole = value as UserRole | "ALL";
        setRoleFilter(newRole);
        setCurrentPage(0); // フィルター変更時は最初のページに戻る
        updateURL(0, statusFilter, newRole, itemsPerPage);
    };

    const handleItemsPerPageChange = (size: string) => {
        const newSize = parseInt(size);
        setItemsPerPage(newSize);
        setCurrentPage(0); // 件数変更時は最初のページに戻る
        updateURL(0, statusFilter, roleFilter, newSize);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page - 1); // UIは1始まり、バックエンドは0始まり
        updateURL(page - 1, statusFilter, roleFilter, itemsPerPage);
    };

    // バックエンドのページネーション情報を使用
    const totalPages = usersResponse?.totalPages || 0;

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold">ユーザー管理</h1>
                <Button asChild>
                    <Link href="/admin/users/create">新規ユーザー作成</Link>
                </Button>
            </div>
            <div className="mb-6 flex gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">ステータス:</label>
                    <Select
                        value={statusFilter}
                        onValueChange={handleStatusFilter}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="すべて" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">すべて</SelectItem>
                            <SelectItem value="ACTIVE">
                                {USER_STATUS_LABELS.ACTIVE}
                            </SelectItem>
                            <SelectItem value="INACTIVE">
                                {USER_STATUS_LABELS.INACTIVE}
                            </SelectItem>
                            <SelectItem value="SUSPENDED">
                                {USER_STATUS_LABELS.SUSPENDED}
                            </SelectItem>
                            <SelectItem value="DELETED">
                                {USER_STATUS_LABELS.DELETED}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">ロール:</label>
                    <Select value={roleFilter} onValueChange={handleRoleFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="すべて" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">すべて</SelectItem>
                            <SelectItem value="ADMIN">
                                {USER_ROLE_LABELS.ADMIN}
                            </SelectItem>
                            <SelectItem value="EDITOR">
                                {USER_ROLE_LABELS.EDITOR}
                            </SelectItem>
                            <SelectItem value="AUTHOR">
                                {USER_ROLE_LABELS.AUTHOR}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">表示件数:</label>
                    <Select
                        value={itemsPerPage.toString()}
                        onValueChange={handleItemsPerPageChange}
                    >
                        <SelectTrigger className="w-24">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10件</SelectItem>
                            <SelectItem value="20">20件</SelectItem>
                            <SelectItem value="50">50件</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* ユーザー一覧テーブル */}
            <div className="border rounded-lg">
                <Table className="min-w-[1000px] table-auto">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="whitespace-nowrap min-w-[60px]">
                                ID
                            </TableHead>
                            <TableHead className="whitespace-nowrap min-w-[80px]">
                                アバター
                            </TableHead>
                            <TableHead className="whitespace-nowrap min-w-[200px]">
                                メールアドレス
                            </TableHead>
                            <TableHead className="whitespace-nowrap min-w-[140px]">
                                表示名
                            </TableHead>
                            <TableHead className="whitespace-nowrap min-w-[100px]">
                                ロール
                            </TableHead>
                            <TableHead className="whitespace-nowrap min-w-[100px]">
                                ステータス
                            </TableHead>
                            <TableHead className="whitespace-nowrap min-w-[160px]">
                                最終ログイン
                            </TableHead>
                            <TableHead className="whitespace-nowrap min-w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            [...Array(itemsPerPage)].map((_, i) => (
                                <TableRow key={i} className="h-12">
                                    <TableCell>
                                        <Skeleton className="h-4 w-2/3" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-12 w-12 rounded-full" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-2/3" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-2/3" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-2/3" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-2/3" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-2/3" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-2/3" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center">
                                    ユーザーが見つかりません
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.id}</TableCell>
                                    <TableCell>
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage
                                                src={
                                                    (user as UserWithAvatar)
                                                        .avatarStorageKey
                                                        ? buildMediaUrl(
                                                              (
                                                                  user as UserWithAvatar
                                                              )
                                                                  .avatarStorageKey!
                                                          ) || undefined
                                                        : undefined
                                                }
                                                alt={
                                                    user.displayName ||
                                                    user.email
                                                }
                                                className="object-cover"
                                            />
                                            <AvatarFallback className="text-xs">
                                                {getInitials(
                                                    user.displayName,
                                                    user.email
                                                )}
                                            </AvatarFallback>
                                        </Avatar>
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        {user.displayName || "-"}
                                    </TableCell>
                                    <TableCell>
                                        {getUserRoleLabel(user.role)}
                                    </TableCell>
                                    <TableCell>
                                        {getUserStatusLabel(user.status)}
                                    </TableCell>
                                    <TableCell>
                                        {(() => {
                                            if (!user.lastLoginAt) return "-";
                                            const date = new Date(
                                                user.lastLoginAt + "Z"
                                            );
                                            if (isNaN(date.getTime()))
                                                return "-";
                                            return date.toLocaleString(
                                                "ja-JP",
                                                {
                                                    timeZone: "Asia/Tokyo",
                                                    year: "numeric",
                                                    month: "2-digit",
                                                    day: "2-digit",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                }
                                            );
                                        })()}
                                    </TableCell>
                                    <TableCell>
                                        {currentUserId === user.id ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled
                                            >
                                                <Pencil className="h-4 w-4" />
                                                編集
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                asChild
                                            >
                                                <Link
                                                    href={`/admin/users/${user.id}/edit`}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                    編集
                                                </Link>
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* ページネーション */}
            {usersResponse && totalPages > 1 && (
                <Pagination className="mt-4">
                    <PaginationContent>
                        <PaginationItem>
                            <button
                                onClick={() => handlePageChange(currentPage)}
                                disabled={currentPage === 0 || loading}
                                className={cn(
                                    buttonVariants({
                                        variant: "outline",
                                        size: "sm",
                                    }),
                                    "gap-1 pl-2.5",
                                    currentPage === 0 || loading
                                        ? "pointer-events-none opacity-50"
                                        : "cursor-pointer"
                                )}
                                aria-label="前のページへ"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                <span>前へ</span>
                            </button>
                        </PaginationItem>

                        {/* ページ番号の表示ロジック */}
                        {Array.from({ length: totalPages }, (_, i) => i)
                            .filter((page) => {
                                // 現在のページ周辺と最初/最後を表示 (0始まり)
                                return (
                                    page === 0 ||
                                    page === totalPages - 1 ||
                                    (page >= currentPage - 1 &&
                                        page <= currentPage + 1)
                                );
                            })
                            .map((page, index, array) => (
                                <React.Fragment key={page}>
                                    {index > 0 &&
                                        array[index - 1] !== page - 1 && (
                                            <PaginationEllipsis />
                                        )}
                                    <PaginationItem>
                                        <PaginationLink
                                            onClick={() =>
                                                handlePageChange(page + 1)
                                            }
                                            isActive={currentPage === page}
                                            className={
                                                loading
                                                    ? "pointer-events-none opacity-50"
                                                    : "cursor-pointer"
                                            }
                                        >
                                            {page + 1}
                                        </PaginationLink>
                                    </PaginationItem>
                                </React.Fragment>
                            ))}

                        <PaginationItem>
                            <button
                                onClick={() =>
                                    handlePageChange(currentPage + 2)
                                }
                                disabled={
                                    currentPage === totalPages - 1 || loading
                                }
                                className={cn(
                                    buttonVariants({
                                        variant: "outline",
                                        size: "sm",
                                    }),
                                    "gap-1 pr-2.5",
                                    currentPage === totalPages - 1 || loading
                                        ? "pointer-events-none opacity-50"
                                        : "cursor-pointer"
                                )}
                                aria-label="次のページへ"
                            >
                                <span>次へ</span>
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
}
