/**
 * ページネーションコンポーネント
 */

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    basePath?: string;
}

export function Pagination({
    currentPage,
    totalPages,
    basePath = "/posts",
}: PaginationProps) {
    const searchParams = useSearchParams();

    // URLパラメーターを構築
    const buildUrl = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", page.toString());
        return `${basePath}?${params.toString()}`;
    };

    // ページ番号の配列を生成（最大7ページ表示）
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 7;

        if (totalPages <= maxVisible) {
            // 全ページを表示
            for (let i = 0; i < totalPages; i++) {
                pages.push(i);
            }
        } else {
            // 省略表示
            if (currentPage < 3) {
                // 先頭付近
                for (let i = 0; i < 5; i++) {
                    pages.push(i);
                }
                pages.push("...");
                pages.push(totalPages - 1);
            } else if (currentPage > totalPages - 4) {
                // 末尾付近
                pages.push(0);
                pages.push("...");
                for (let i = totalPages - 5; i < totalPages; i++) {
                    pages.push(i);
                }
            } else {
                // 中間
                pages.push(0);
                pages.push("...");
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push("...");
                pages.push(totalPages - 1);
            }
        }

        return pages;
    };

    if (totalPages <= 1) {
        return null;
    }

    return (
        <div className="flex items-center justify-center gap-2 mb-8">
            {/* 前へ */}
            <Button
                variant="outline"
                size="icon"
                disabled={currentPage === 0}
                asChild={currentPage > 0}
            >
                {currentPage > 0 ? (
                    <Link href={buildUrl(currentPage - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">前へ</span>
                    </Link>
                ) : (
                    <>
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">前へ</span>
                    </>
                )}
            </Button>

            {/* ページ番号 */}
            {getPageNumbers().map((page, index) =>
                typeof page === "number" ? (
                    <Button
                        key={index}
                        variant={page === currentPage ? "default" : "outline"}
                        size="icon"
                        asChild={page !== currentPage}
                    >
                        {page === currentPage ? (
                            <span>{page + 1}</span>
                        ) : (
                            <Link href={buildUrl(page)}>{page + 1}</Link>
                        )}
                    </Button>
                ) : (
                    <span key={index} className="px-2">
                        {page}
                    </span>
                )
            )}

            {/* 次へ */}
            <Button
                variant="outline"
                size="icon"
                disabled={currentPage >= totalPages - 1}
                asChild={currentPage < totalPages - 1}
            >
                {currentPage < totalPages - 1 ? (
                    <Link href={buildUrl(currentPage + 1)}>
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">次へ</span>
                    </Link>
                ) : (
                    <>
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">次へ</span>
                    </>
                )}
            </Button>
        </div>
    );
}
