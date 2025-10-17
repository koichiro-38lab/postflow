"use client";

import React from "react";
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
import { useTagList } from "@/features/admin/tags/hooks/use-tag-list";
import { deleteTag } from "@/lib/api/admin/tags";
import { TagForm } from "./TagForm";
import { TagTableSkeleton } from "./TagTableSkeleton";
import { toast } from "sonner";

export function TagList() {
    // hook から必要な状態とハンドラを取得
    const {
        tags,
        editingTag,
        loading,
        isDialogOpen,
        lastCount,
        handleEdit,
        handleCreate,
        handleFormSuccess,
        handleCloseDialog,
        loadTags,
    } = useTagList();

    // タグ削除ハンドラ
    const handleDelete = async (id: number) => {
        try {
            await deleteTag(id);
            toast.success("タグを削除しました");
            loadTags();
            handleCloseDialog();
        } catch {
            toast.error("タグの削除に失敗しました");
        }
    };

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
                <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
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
                <TagTableSkeleton rowCount={lastCount} />
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
                                        colSpan={5}
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
