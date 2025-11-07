"use client";

import React from "react";
import { Folder, GripVertical, Pencil } from "lucide-react";
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
import { useCategoryTree } from "@/features/admin/categories/hooks/use-category-tree";
import { CategoryForm } from "./CategoryForm";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { SortableTree, FlattenedItem } from "./SortableTree";
import { useSortable } from "@dnd-kit/sortable";

export function CategoryList() {
    // hook から必要な状態とハンドラを取得
    const {
        categories,
        treeItems,
        editingCategory,
        loading,
        isDialogOpen,
        lastCount,
        handleTreeChange,
        handleEdit,
        handleCreate,
        handleFormSuccess,
        handleCloseDialog,
        handleDelete,
    } = useCategoryTree();
    // カテゴリ総件数
    const totalCount = categories.length;

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
            <TableCell>
                <Skeleton className="h-4 w-2/3" />
            </TableCell>
        </TableRow>
    );

    // カスタムアイテムレンダラー（ドラッグ&ドロップ対応）
    const renderCategoryItem = (
        item: FlattenedItem,
        listeners?: ReturnType<typeof useSortable>["listeners"],
        attributes?: ReturnType<typeof useSortable>["attributes"]
    ) => {
        const category = categories.find((c) => c.id === Number(item.id));
        if (!category) return null;

        return (
            <React.Fragment>
                <TableCell
                    style={{ paddingLeft: `${item.depth * 24}px` }}
                    onClick={() => handleEdit(category)}
                    className="cursor-pointer"
                >
                    <div
                        {...(attributes ?? {})}
                        {...(listeners ?? {})}
                        className={
                            listeners
                                ? "cursor-grab inline-block mr-2"
                                : "inline-block mr-2"
                        }
                        style={{ touchAction: "none" }}
                    >
                        {listeners ? (
                            <GripVertical className="ml-2 h-4 w-4 text-muted-foreground" />
                        ) : null}
                    </div>
                    <Folder className="mr-2 inline-block h-4 w-4 text-muted-foreground" />
                    <span>{category.name}</span>
                </TableCell>
                <TableCell
                    onClick={() => handleEdit(category)}
                    className="cursor-pointer"
                >
                    {category.slug}
                </TableCell>
                <TableCell
                    onClick={() => handleEdit(category)}
                    className="cursor-pointer"
                >
                    {category.postCount}
                </TableCell>
                <TableCell
                    onClick={() => handleEdit(category)}
                    className="cursor-pointer"
                >
                    {new Date(category.createdAt + "Z").toLocaleString(
                        "ja-JP",
                        { timeZone: "Asia/Tokyo" }
                    )}
                </TableCell>
                <TableCell
                    onClick={() => handleEdit(category)}
                    className="cursor-pointer"
                >
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(category)}
                    >
                        <Pencil className="h-4 w-4" />
                        編集
                    </Button>
                </TableCell>
            </React.Fragment>
        );
    };

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold">カテゴリ一覧</h1>
                <Button onClick={handleCreate}>
                    <Folder className="h-4 w-4" />
                    新規作成
                </Button>
            </div>
            {/* 将来別コンポーネントに件数を渡す場合は props 拡張で対応 */}
            <div className="text-sm text-muted-foreground mb-3">
                {loading ? (
                    <Skeleton className="h-4 w-14" />
                ) : (
                    `全 ${totalCount} 件`
                )}
            </div>
            <div className="mb-4">
                <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingCategory
                                    ? "カテゴリ編集"
                                    : "カテゴリ作成"}
                            </DialogTitle>
                        </DialogHeader>
                        <CategoryForm
                            category={editingCategory}
                            onSuccess={handleFormSuccess}
                            onDelete={
                                editingCategory
                                    ? () => handleDelete(editingCategory.id)
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
                                <TableHead className="whitespace-nowrap min-w-[220px]">
                                    カテゴリー名
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
                    <SortableTree
                        items={treeItems}
                        onChange={handleTreeChange}
                        onInvalidMove={(reason) => toast.error(reason)}
                        renderItem={renderCategoryItem}
                    />
                </div>
            )}
        </div>
    );
}
