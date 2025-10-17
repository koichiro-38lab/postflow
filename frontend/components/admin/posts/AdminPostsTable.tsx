import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Post } from "@/lib/api/admin/posts";
import { buildMediaUrl } from "@/lib/media-url";
import { SortField, SortDirection } from "../../types";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    FileText,
    Eye,
    Archive,
    Pencil,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminPostsTableProps {
    posts: Post[];
    loading: boolean;
    itemsPerPage: number;
    sortField: SortField;
    sortDirection: SortDirection;
    onSort: (field: SortField) => void;
}

// スケルトン行コンポーネント
const SkeletonRow = () => (
    <TableRow className="h-16">
        <TableCell className="w-20">
            <Skeleton className="h-12 w-16" />
        </TableCell>
        <TableCell className="w-[300px]">
            <Skeleton className="h-4 w-full" />
        </TableCell>
        <TableCell className="w-32">
            <Skeleton className="h-4 w-20" />
        </TableCell>
        <TableCell className="w-28">
            <Skeleton className="h-4 w-20" />
        </TableCell>
        <TableCell className="w-28">
            <Skeleton className="h-4 w-20" />
        </TableCell>
        <TableCell className="w-40">
            <Skeleton className="h-4 w-32" />
        </TableCell>
        <TableCell className="w-40">
            <Skeleton className="h-4 w-32" />
        </TableCell>
        <TableCell className="w-20">
            <Skeleton className="h-4 w-12" />
        </TableCell>
    </TableRow>
);

/**
 * 管理画面投稿一覧テーブル
 * 行描画とソート UI を担当
 */
export function AdminPostsTable({
    posts,
    loading,
    itemsPerPage,
    sortField,
    sortDirection,
    onSort,
}: AdminPostsTableProps) {
    const router = useRouter();

    // ソートアイコンを取得
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

    return (
        <div className="rounded-md border">
            <Table className="min-w-[1200px] table-fixed">
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-20"></TableHead>
                        <TableHead className="w-[300px]">
                            <Button
                                variant="ghost"
                                onClick={() => onSort("title")}
                                className="h-auto p-0 font-semibold hover:bg-transparent"
                            >
                                タイトル
                                {getSortIcon("title")}
                            </Button>
                        </TableHead>
                        <TableHead className="w-32">
                            <Button
                                variant="ghost"
                                onClick={() => onSort("category")}
                                className="h-auto p-0 font-semibold hover:bg-transparent"
                            >
                                カテゴリー
                                {getSortIcon("category")}
                            </Button>
                        </TableHead>
                        <TableHead className="w-28">
                            <Button
                                variant="ghost"
                                onClick={() => onSort("status")}
                                className="h-auto p-0 font-semibold hover:bg-transparent"
                            >
                                ステータス
                                {getSortIcon("status")}
                            </Button>
                        </TableHead>
                        <TableHead className="w-28">
                            <Button
                                variant="ghost"
                                onClick={() => onSort("author")}
                                className="h-auto p-0 font-semibold hover:bg-transparent"
                            >
                                投稿者
                                {getSortIcon("author")}
                            </Button>
                        </TableHead>
                        <TableHead className="w-40">
                            <Button
                                variant="ghost"
                                onClick={() => onSort("slug")}
                                className="h-auto p-0 font-semibold hover:bg-transparent"
                            >
                                スラッグ
                                {getSortIcon("slug")}
                            </Button>
                        </TableHead>
                        <TableHead className="w-40">
                            <Button
                                variant="ghost"
                                onClick={() => onSort("publishedAt")}
                                className="h-auto p-0 font-semibold hover:bg-transparent"
                            >
                                公開日
                                {getSortIcon("publishedAt")}
                            </Button>
                        </TableHead>
                        <TableHead className="w-20"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        Array.from({ length: itemsPerPage }).map((_, index) => (
                            <SkeletonRow key={index} />
                        ))
                    ) : posts.length === 0 ? (
                        <TableRow className="h-1">
                            <TableCell
                                colSpan={8}
                                className="text-center py-8 text-muted-foreground"
                            >
                                記事がありません。
                            </TableCell>
                        </TableRow>
                    ) : (
                        posts.map((post) => {
                            // アイキャッチ画像のURLを生成
                            const coverImageUrl = post.coverMedia
                                ? post.coverMedia.publicUrl ||
                                  buildMediaUrl(post.coverMedia.storageKey)
                                : null;

                            return (
                                <TableRow
                                    key={post.id}
                                    className="h-12 cursor-pointer hover:bg-muted/50"
                                    onClick={() =>
                                        router.push(
                                            `/admin/posts/${post.id}/edit`
                                        )
                                    }
                                >
                                    <TableCell className="w-20 py-2">
                                        {coverImageUrl ? (
                                            <div className="relative w-16 h-12 rounded overflow-hidden bg-muted">
                                                <Image
                                                    src={coverImageUrl}
                                                    alt={post.title}
                                                    fill
                                                    className="object-cover"
                                                    sizes="64px"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-16 h-12 rounded bg-muted flex items-center justify-center">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="w-[300px] font-medium">
                                        <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                                            {post.title}
                                        </span>
                                    </TableCell>
                                    <TableCell className="w-32 whitespace-nowrap overflow-hidden text-ellipsis">
                                        {post.category?.name || "未設定"}
                                    </TableCell>
                                    <TableCell className="w-28">
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
                                    <TableCell className="w-28 whitespace-nowrap overflow-hidden text-ellipsis">
                                        {post.author?.displayName || "未設定"}
                                    </TableCell>
                                    <TableCell className="w-40 whitespace-nowrap overflow-hidden text-ellipsis">
                                        {post.slug}
                                    </TableCell>
                                    <TableCell className="w-40 whitespace-nowrap">
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
                                    <TableCell className="w-20">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            asChild
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Link
                                                href={`/admin/posts/${post.id}/edit`}
                                            >
                                                <Pencil className="h-4 w-4" />
                                                編集
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
