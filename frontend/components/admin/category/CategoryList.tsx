"use client";

import React, {
    useState,
    useEffect,
    useCallback,
    useMemo,
    useRef,
} from "react";
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
import {
    Category,
    fetchCategories,
    deleteCategory,
    reorderCategories,
    CategoryReorderRequest,
} from "@/lib/post-api";
import { CategoryForm } from "./CategoryForm";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { buildCategoryTree, CategoryWithLevel } from "@/lib/category-utils";

// TreeItem型とSortableTreeをインポート
import { SortableTree, TreeItem, FlattenedItem } from "./SortableTree";
import { useSortable } from "@dnd-kit/sortable";

// buildCategoryTreeの結果をTreeItemに変換する関数
function convertHierarchicalToTreeItems(
    hierarchicalCategories: CategoryWithLevel[]
): TreeItem[] {
    const result: TreeItem[] = [];
    const stack: {
        category: CategoryWithLevel;
        treeItem: TreeItem;
        level: number;
    }[] = [];

    hierarchicalCategories.forEach((category) => {
        const treeItem: TreeItem = {
            id: String(category.id),
            name: category.name,
            children: [],
        };

        if (category.level === 0) {
            // ルートレベル
            result.push(treeItem);
            stack.push({ category, treeItem, level: 0 });
        } else {
            // 子レベル - 適切な親を見つける
            while (
                stack.length > 0 &&
                stack[stack.length - 1].level >= category.level
            ) {
                stack.pop();
            }

            if (stack.length > 0) {
                const parent = stack[stack.length - 1].treeItem;
                parent.children!.push(treeItem);
                stack.push({ category, treeItem, level: category.level });
            }
        }
    });

    return result;
}

// TreeItem[] を Category[] に変換（並び替え反映）
function convertFromTreeItems(
    treeItems: TreeItem[],
    originalCategories: Category[]
): Category[] {
    // TreeItemをフラット化して順序を取得
    const flatten = (
        items: TreeItem[],
        depth = 0
    ): { id: string; depth: number }[] => {
        return (items || []).reduce<{ id: string; depth: number }[]>(
            (acc, item) => [
                ...acc,
                { id: item.id, depth },
                ...(item.children ? flatten(item.children, depth + 1) : []),
            ],
            []
        );
    };
    const flatTree = flatten(treeItems);

    const newCategories = originalCategories.map((cat) => ({ ...cat }));
    flatTree.forEach((item, index) => {
        const cat = newCategories.find((c) => c.id === Number(item.id));
        if (cat) cat.sortOrder = index;
    });
    return newCategories;
}

export function CategoryList() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [editingCategory, setEditingCategory] = useState<Category | null>(
        null
    );
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    // スケルトン表示時の行数を保持（初回は適度なデフォルト）
    const [lastCount, setLastCount] = useState<number>(5);
    const pendingCountRef = useRef<number | null>(null);

    const loadCategories = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchCategories();
            setCategories(data.sort((a, b) => a.sortOrder - b.sortOrder));
            // データの行数は一旦 pending に保存し、loading が解除されたタイミングで lastCount を更新する
            pendingCountRef.current = data.length;
        } catch {
            toast.error("カテゴリの取得に失敗しました");
        } finally {
            // スケルトンを少し長めに表示するために遅延を追加
            setTimeout(() => {
                setLoading(false);
                if (pendingCountRef.current !== null) {
                    setLastCount(Math.max(1, pendingCountRef.current));
                    pendingCountRef.current = null;
                }
            }, 200); // 100ms の追加遅延
        }
    }, []);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    const handleDelete = async (id: number) => {
        try {
            await deleteCategory(id);
            toast.success("カテゴリを削除しました");
            loadCategories();
            setIsDialogOpen(false);
        } catch {
            toast.error("カテゴリの削除に失敗しました");
        }
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingCategory(null);
        setIsDialogOpen(true);
    };

    const handleFormSuccess = () => {
        setIsDialogOpen(false);
        loadCategories();
    };

    // 階層構造付きカテゴリを取得
    const hierarchicalCategories = useMemo(
        () => buildCategoryTree(categories || []),
        [categories]
    );

    // TreeItem[] へ変換
    const treeItems = useMemo(
        () => convertHierarchicalToTreeItems(hierarchicalCategories),
        [hierarchicalCategories]
    );

    // ツリー並び替え時の処理
    const handleTreeChange = async (newTree: TreeItem[]) => {
        const newCategories = convertFromTreeItems(
            newTree || [],
            categories
        ).sort((a, b) => a.sortOrder - b.sortOrder);
        setCategories(newCategories);

        try {
            const reorderRequests: CategoryReorderRequest[] = newCategories.map(
                (cat, index) => ({
                    categoryId: cat.id,
                    newSortOrder: index,
                })
            );
            await reorderCategories(reorderRequests);
            toast.success("カテゴリの順序を更新しました");
        } catch {
            toast.error("並び替えに失敗しました");
            loadCategories();
        }
    };

    // スケルトンローコンポーネント
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
            <div className="mb-4">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
