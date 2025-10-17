import * as React from "react";
import { buttonVariants } from "@/components/ui/button";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
} from "@/components/ui/pagination";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminPaginationProps {
    currentPage: number; // 0始まり
    totalPages: number;
    loading: boolean;
    onPageChange: (page: number) => void; // 1始まりで受け取る
}

/**
 * 管理画面共通のページネーション
 */
export function AdminPagination({
    currentPage,
    totalPages,
    loading,
    onPageChange,
}: AdminPaginationProps) {
    if (totalPages <= 1) return null;

    return (
        <Pagination className="mt-4">
            <PaginationContent>
                {/* 前へボタン */}
                <PaginationItem>
                    <button
                        onClick={() => onPageChange(currentPage)}
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
                            (page >= currentPage - 1 && page <= currentPage + 1)
                        );
                    })
                    .map((page, index, array) => (
                        <React.Fragment key={page}>
                            {index > 0 && array[index - 1] !== page - 1 && (
                                <PaginationEllipsis />
                            )}
                            <PaginationItem>
                                <PaginationLink
                                    onClick={() => onPageChange(page + 1)}
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

                {/* 次へボタン */}
                <PaginationItem>
                    <button
                        onClick={() => onPageChange(currentPage + 2)}
                        disabled={currentPage === totalPages - 1 || loading}
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
    );
}
