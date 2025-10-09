"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Hash, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    TableCell,
    TableRow,
    TableHeader,
    TableHead,
    TableBody,
    Table,
} from "@/components/ui/table";
import { Tag, fetchTags, deleteTag } from "@/lib/post-api";
import { TagForm } from "./TagForm";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export function TagList() {
    // タグ一覧状態
    const [tags, setTags] = useState<Tag[]>([]);
    // 編集中のタグ
    const [editingTag, setEditingTag] = useState<Tag | null>(null);
    // ダイアログ開閉状態
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    // ローディング状態
    const [loading, setLoading] = useState(true);
    // スケルトン表示時の行数保持
    const [lastCount, setLastCount] = useState<number>(5);

    // タグ一覧取得
    const loadTags = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchTags();
            setTags(data);
            // 次回のスケルトン表示用にデータ件数を記憶
            setLastCount(Math.max(1, data.length));
        } catch {
            toast.error("タグの取得に失敗しました");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTags();
    }, [loadTags]);

    // タグ削除ハンドラ
    const handleDelete = async (id: number) => {
        try {
            await deleteTag(id);
            toast.success("タグを削除しました");
            loadTags();
            setIsDialogOpen(false);
        } catch {
            toast.error("タグの削除に失敗しました");
        }
    };

    // タグ編集クリックハンドラ
    const handleEdit = (tag: Tag) => {
        setEditingTag(tag);
        setIsDialogOpen(true);
    };

    // 新規作成クリックハンドラ
    const handleCreate = () => {
        setEditingTag(null);
        setIsDialogOpen(true);
    };

    // フォーム送信成功時のハンドラ
    const handleFormSuccess = () => {
        setIsDialogOpen(false);
        loadTags();
    };

    // スケルトン行コンポーネント
    const SkeletonRow = () => (
        <TableRow className="h-12">
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
    );

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold">タグ一覧</h1>
                <Button onClick={handleCreate}>
                    <Hash className="h-4 w-4" />
                    新規作成
                </Button>
            </div>
            <div className="mb-4">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingTag ? "タグ編集" : "タグ作成"}
                            </DialogTitle>
                        </DialogHeader>
                        <TagForm
                            tag={editingTag}
                            onSuccess={handleFormSuccess}
                            onDelete={
                                editingTag
                                    ? () => handleDelete(editingTag.id)
                                    : undefined
                            }
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="rounded-md border">
                    <Table className="min-w-[700px] table-auto">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="whitespace-nowrap min-w-[200px]">
                                    タグ名
                                </TableHead>
                                <TableHead className="whitespace-nowrap min-w-[140px]">
                                    スラッグ
                                </TableHead>
                                <TableHead className="whitespace-nowrap min-w-[80px]">
                                    投稿数
                                </TableHead>
                                <TableHead className="whitespace-nowrap min-w-[160px]">
                                    作成日
                                </TableHead>
                                <TableHead className="whitespace-nowrap min-w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: Math.max(1, lastCount) }).map(
                                (_, index) => (
                                    <SkeletonRow key={index} />
                                )
                            )}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table className="min-w-[700px] table-auto">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="whitespace-nowrap min-w-[200px]">
                                    タグ名
                                </TableHead>
                                <TableHead className="whitespace-nowrap min-w-[140px]">
                                    スラッグ
                                </TableHead>
                                <TableHead className="whitespace-nowrap min-w-[80px]">
                                    投稿数
                                </TableHead>
                                <TableHead className="whitespace-nowrap min-w-[160px]">
                                    作成日
                                </TableHead>
                                <TableHead className="whitespace-nowrap min-w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tags.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="h-24 text-center"
                                    >
                                        タグがありません
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tags.map((tag) => (
                                    <TableRow key={tag.id}>
                                        <TableCell
                                            onClick={() => handleEdit(tag)}
                                            className="cursor-pointer"
                                        >
                                            <Hash className="mr-1 inline-block h-4 w-4 text-muted-foreground" />
                                            <span>{tag.name}</span>
                                        </TableCell>
                                        <TableCell
                                            onClick={() => handleEdit(tag)}
                                            className="cursor-pointer"
                                        >
                                            {tag.slug}
                                        </TableCell>
                                        <TableCell
                                            onClick={() => handleEdit(tag)}
                                            className="cursor-pointer"
                                        >
                                            {tag.postCount}
                                        </TableCell>
                                        <TableCell
                                            onClick={() => handleEdit(tag)}
                                            className="cursor-pointer"
                                        >
                                            {new Date(
                                                tag.createdAt + "Z"
                                            ).toLocaleString("ja-JP", {
                                                timeZone: "Asia/Tokyo",
                                            })}
                                        </TableCell>
                                        <TableCell
                                            onClick={() => handleEdit(tag)}
                                            className="cursor-pointer"
                                        >
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(tag)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                                編集
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
