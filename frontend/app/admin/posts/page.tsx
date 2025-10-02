"use client";

import * as React from "react";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    fetchPosts,
    PostsResponse,
    CategorySummary,
    fetchCategories,
} from "@/lib/post-api";
import { buildCategoryTree, CategoryWithLevel } from "@/lib/category-utils";
import { isApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { TagBadge } from "@/components/TagBadge";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import {
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    ChevronLeft,
    ChevronRight,
    FileText,
    Eye,
    Archive,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
} from "@/components/ui/pagination";

type SortField = "title" | "slug" | "publishedAt" | "category" | "status";
type SortDirection = "asc" | "desc";

function AdminPostsPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // URLクエリパラメータから初期状態を取得
    const [postsResponse, setPostsResponse] = useState<PostsResponse | null>(
        null
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [authReady, setAuthReady] = useState(false);
    const [sortField, setSortField] = useState<SortField>(
        (searchParams.get("sort") as SortField) || "publishedAt"
    );
    const [sortDirection, setSortDirection] = useState<SortDirection>(
        (searchParams.get("order") as SortDirection) || "desc"
    );
    const [currentPage, setCurrentPage] = useState(
        Math.max(0, parseInt(searchParams.get("page") || "1") - 1) // URLは1始まり、内部は0始まり
    );
    const [statusFilter, setStatusFilter] = useState<string>(
        searchParams.get("status") || ""
    );
    const [categoryFilter, setCategoryFilter] = useState<string>(
        searchParams.get("category") || ""
    );
    const [itemsPerPage, setItemsPerPage] = useState<number>(
        parseInt(searchParams.get("size") || "10")
    );
    const [categories, setCategories] = useState<CategorySummary[]>([]);

    // buildCategoryTree と PL_CLASSES を共通化した helpers からインポート

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

    // URL更新関数（1始まりで保存）
    const updateURL = (
        page: number,
        sort: SortField,
        order: SortDirection,
        status: string,
        category: string,
        size: number
    ) => {
        const params = new URLSearchParams();
        params.set("page", (page + 1).toString()); // 内部の0始まりをURLの1始まりに変換
        params.set("sort", sort);
        params.set("order", order);
        if (status) params.set("status", status);
        if (category) params.set("category", category);
        if (size !== 10) params.set("size", size.toString()); // デフォルト値の場合はURLに含めない

        router.push(`?${params.toString()}`, { scroll: false });
    }; // URLクエリパラメータの変更を監視して状態を同期
    useEffect(() => {
        const pageFromURL = parseInt(searchParams.get("page") || "1");
        const page = Math.max(0, pageFromURL - 1); // URLの1始まりを内部の0始まりに変換
        const sort = (searchParams.get("sort") as SortField) || "publishedAt";
        const order = (searchParams.get("order") as SortDirection) || "desc";
        const status = searchParams.get("status") || "";
        const category = searchParams.get("category") || "";
        const size = parseInt(searchParams.get("size") || "10");

        setCurrentPage(page);
        setSortField(sort);
        setSortDirection(order);
        setStatusFilter(status);
        setCategoryFilter(category);
        setItemsPerPage(size);
    }, [searchParams]);

    // カテゴリ一覧を取得
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

    useEffect(() => {
        if (!authReady) return;

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchPosts(
                    undefined,
                    currentPage,
                    itemsPerPage,
                    sortField,
                    sortDirection,
                    statusFilter,
                    categoryFilter
                );
                setPostsResponse(data);
                // スケルトンを少し長めに表示するために遅延を追加
                setTimeout(() => {
                    setLoading(false);
                }, 200); // 100ms の追加遅延
            } catch (e: unknown) {
                if (!(isApiError(e) && e.response?.status === 401)) {
                    setError(
                        e instanceof Error ? e.message : "取得に失敗しました"
                    );
                }
                setLoading(false); // エラー時は即座にローディング終了
            }
        };
        load();
    }, [
        authReady,
        currentPage,
        sortField,
        sortDirection,
        statusFilter,
        categoryFilter,
        itemsPerPage,
    ]); // currentPage, sortField, sortDirection, statusFilter, categoryFilter, itemsPerPage が変わったら再取得

    const handleSort = (field: SortField) => {
        const newDirection =
            sortField === field && sortDirection === "asc" ? "desc" : "asc";
        setSortField(field);
        setSortDirection(newDirection);
        setCurrentPage(0); // ソート変更時は最初のページに戻る (0始まり)
        updateURL(
            0,
            field,
            newDirection,
            statusFilter,
            categoryFilter,
            itemsPerPage
        );
    };

    const handleStatusFilter = (status: string) => {
        const actualStatus = status === "all" ? "" : status;
        setStatusFilter(actualStatus);
        setCurrentPage(0); // フィルター変更時は最初のページに戻る
        updateURL(
            0,
            sortField,
            sortDirection,
            actualStatus,
            categoryFilter,
            itemsPerPage
        );
    };

    const handleCategoryFilter = (categoryId: string) => {
        const actualCategoryId = categoryId === "all" ? "" : categoryId;
        setCategoryFilter(actualCategoryId);
        setCurrentPage(0); // フィルター変更時は最初のページに戻る
        updateURL(
            0,
            sortField,
            sortDirection,
            statusFilter,
            actualCategoryId,
            itemsPerPage
        );
    };

    const handleItemsPerPageChange = (size: string) => {
        const newSize = parseInt(size);
        setItemsPerPage(newSize);
        setCurrentPage(0); // 件数変更時は最初のページに戻る
        updateURL(
            0,
            sortField,
            sortDirection,
            statusFilter,
            categoryFilter,
            newSize
        );
    };

    // バックエンドからソート済みのデータを直接使用
    const posts = postsResponse?.content || [];

    // バックエンドのページネーション情報を使用
    const totalPages = postsResponse?.totalPages || 0;

    const handlePageChange = (page: number) => {
        setCurrentPage(page - 1); // UIは1始まり、バックエンドは0始まり
        updateURL(
            page - 1,
            sortField,
            sortDirection,
            statusFilter,
            categoryFilter,
            itemsPerPage
        );
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) {
            return <ArrowUpDown className="ml-2 h-4 w-4" />;
        }
        return sortDirection === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
        ) : (
            <ArrowDown className="ml-2 h-4 w-4" />
        );
    };

    // スケルトンローコンポーネント
    const SkeletonRow = () => (
        <TableRow className="h-12">
            <TableCell>
                <Skeleton className="h-4 w-2/3" /> {/* タイトル: 可変幅 */}
            </TableCell>
            <TableCell>
                <Skeleton className="h-4 w-2/3" /> {/* カテゴリー: 可変幅 */}
            </TableCell>
            <TableCell>
                <Skeleton className="h-4 w-2/3" /> {/* タグ: 可変幅 */}
            </TableCell>
            <TableCell>
                <Skeleton className="h-4 w-2/3" /> {/* ステータス: 可変幅 */}
            </TableCell>
            <TableCell>
                <Skeleton className="h-4 w-2/3" /> {/* スラッグ: 可変幅 */}
            </TableCell>
            <TableCell>
                <Skeleton className="h-4 w-2/3" /> {/* 公開日: 可変幅 */}
            </TableCell>
        </TableRow>
    );

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold">記事一覧</h1>
                <Link href="/admin/posts/new">
                    <Button>新規作成</Button>
                </Link>
            </div>

            {/* フィルターセクション */}
            <div className="mb-6 flex gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">ステータス:</label>
                    <Select
                        value={statusFilter || "all"}
                        onValueChange={handleStatusFilter}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="すべて" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">すべて</SelectItem>
                            <SelectItem value="DRAFT">下書き</SelectItem>
                            <SelectItem value="PUBLISHED">公開済み</SelectItem>
                            <SelectItem value="ARCHIVED">アーカイブ</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">カテゴリー:</label>
                    <Select
                        value={categoryFilter || "all"}
                        onValueChange={handleCategoryFilter}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="すべて" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">すべて</SelectItem>
                            {buildCategoryTree(categories).map(
                                (category: CategoryWithLevel) => (
                                    <SelectItem
                                        key={category.id}
                                        value={category.id.toString()}
                                        className="text-sm"
                                    >
                                        <span className="flex items-center">
                                            {/* 階層レベルに応じてインデント */}
                                            {Array.from({
                                                length: category.level,
                                            }).map((_, i) => (
                                                <span
                                                    key={i}
                                                    className="inline-block w-4"
                                                />
                                            ))}
                                            {category.level > 0 && (
                                                <span className="text-muted-foreground mr-2">
                                                    └
                                                </span>
                                            )}
                                            {category.name}
                                        </span>
                                    </SelectItem>
                                )
                            )}
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

            {error && <div className="text-red-500 mb-4">{error}</div>}

            <div className="rounded-md border">
                <Table className="min-w-[900px] table-auto">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-2/5">
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort("title")}
                                    className="h-auto p-0 font-semibold hover:bg-transparent"
                                >
                                    タイトル
                                    {getSortIcon("title")}
                                </Button>
                            </TableHead>
                            <TableHead className="w-1/8">
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort("category")}
                                    className="h-auto p-0 font-semibold hover:bg-transparent"
                                >
                                    カテゴリー
                                    {getSortIcon("category")}
                                </Button>
                            </TableHead>
                            <TableHead className="w-1/6">タグ</TableHead>
                            <TableHead className="w-1/8">
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort("status")}
                                    className="h-auto p-0 font-semibold hover:bg-transparent"
                                >
                                    ステータス
                                    {getSortIcon("status")}
                                </Button>
                            </TableHead>
                            <TableHead className="w-1/6">
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort("slug")}
                                    className="h-auto p-0 font-semibold hover:bg-transparent"
                                >
                                    スラッグ
                                    {getSortIcon("slug")}
                                </Button>
                            </TableHead>
                            <TableHead className="w-1/8">
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort("publishedAt")}
                                    className="h-auto p-0 font-semibold hover:bg-transparent"
                                >
                                    公開日
                                    {getSortIcon("publishedAt")}
                                </Button>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: itemsPerPage }).map(
                                (_, index) => <SkeletonRow key={index} />
                            )
                        ) : posts.length === 0 ? (
                            <TableRow className="h-12">
                                <TableCell
                                    colSpan={6}
                                    className="text-center py-8 text-muted-foreground"
                                >
                                    記事がありません。
                                </TableCell>
                            </TableRow>
                        ) : (
                            posts.map((post) => (
                                <TableRow
                                    key={post.id}
                                    className="h-12 cursor-pointer hover:bg-muted/50"
                                    onClick={() =>
                                        router.push(
                                            `/admin/posts/${post.id}/edit`
                                        )
                                    }
                                >
                                    <TableCell className="font-medium whitespace-nowrap">
                                        {post.title}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {post.category?.name || "未設定"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {post.tags &&
                                            post.tags.length > 0 ? (
                                                post.tags.map((tag) => (
                                                    <TagBadge
                                                        key={tag.id}
                                                        tag={tag}
                                                        clickable={false}
                                                    />
                                                ))
                                            ) : (
                                                <span className="text-muted-foreground text-xs">
                                                    —
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        <div className="flex items-center gap-1">
                                            {post.status === "DRAFT" && (
                                                <span className="flex items-center border gap-1 px-2 py-1 rounded-lg text-xs">
                                                    <FileText className="h-4 w-4 text-gray-500" />
                                                    下書き
                                                </span>
                                            )}
                                            {post.status === "PUBLISHED" && (
                                                <span className="flex items-center border gap-1 px-2 py-1 rounded-lg text-xs">
                                                    <Eye className="h-4 w-4 text-green-600" />
                                                    公開済み
                                                </span>
                                            )}
                                            {post.status === "ARCHIVED" && (
                                                <span className="flex items-center border gap-1 px-2 py-1 rounded-lg text-xs">
                                                    <Archive className="h-4 w-4 text-orange-600" />
                                                    アーカイブ
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {post.slug}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {post.publishedAt
                                            ? new Date(
                                                  post.publishedAt
                                              ).toLocaleString("ja-JP", {
                                                  year: "numeric",
                                                  month: "2-digit",
                                                  day: "2-digit",
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                  timeZone: "Asia/Tokyo",
                                              })
                                            : "-"}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* ページネーション */}
            {postsResponse && totalPages > 1 && (
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

export default function AdminPostsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AdminPostsPageContent />
        </Suspense>
    );
}
