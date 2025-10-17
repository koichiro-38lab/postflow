import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
    fetchCategories,
    deleteCategory,
    reorderCategories,
    Category,
    CategoryReorderRequest,
} from "@/lib/api/admin/categories";
import { buildCategoryTree } from "@/lib/category-utils";
import { TreeItem } from "@/components/admin/categories/SortableTree";
import {
    convertHierarchicalToTreeItems,
    convertFromTreeItems,
} from "../utils/tree-converters";
import { toast } from "sonner";

/**
 * 管理画面のカテゴリ一覧ページで使用する状態管理hook
 * カテゴリ取得、ツリー変更、再フェッチを管理
 */
export function useCategoryTree() {
    // カテゴリ一覧状態
    const [categories, setCategories] = useState<Category[]>([]);
    // 編集中のカテゴリ
    const [editingCategory, setEditingCategory] = useState<Category | null>(
        null
    );
    // ダイアログ開閉状態
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    // ローディング状態
    const [loading, setLoading] = useState(true);
    // スケルトン表示時の行数保持（初回は適度なデフォルト）
    const [lastCount, setLastCount] = useState<number>(5);
    // スケルトン表示時の行数を一時保存
    const pendingCountRef = useRef<number | null>(null);

    // カテゴリ一覧を取得
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
            }, 200);
        }
    }, []);

    // 初回ロード
    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

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
    const handleTreeChange = useCallback(
        async (newTree: TreeItem[]) => {
            // 新しい順序でカテゴリを更新
            const newCategories = convertFromTreeItems(
                newTree || [],
                categories
            ).sort((a, b) => a.sortOrder - b.sortOrder);
            setCategories(newCategories);

            try {
                // API に並び替えリクエストを送信
                const reorderRequests: CategoryReorderRequest[] =
                    newCategories.map((cat, index) => ({
                        categoryId: cat.id,
                        newSortOrder: index,
                    }));
                await reorderCategories(reorderRequests);
                toast.success("カテゴリの順序を更新しました");
            } catch {
                toast.error("並び替えに失敗しました");
                loadCategories(); // エラー時は元の状態に戻す
            }
        },
        [categories, loadCategories]
    );

    // カテゴリ編集クリックハンドラ
    const handleEdit = useCallback((category: Category) => {
        setEditingCategory(category);
        setIsDialogOpen(true);
    }, []);

    // 新規作成クリックハンドラ
    const handleCreate = useCallback(() => {
        setEditingCategory(null);
        setIsDialogOpen(true);
    }, []);

    // フォーム送信成功時のハンドラ
    const handleFormSuccess = useCallback(() => {
        setIsDialogOpen(false);
        loadCategories();
    }, [loadCategories]);

    // ダイアログ閉じるハンドラ
    const handleCloseDialog = useCallback(() => {
        setIsDialogOpen(false);
    }, []);

    // カテゴリ削除ハンドラ
    const handleDelete = useCallback(
        async (id: number) => {
            try {
                await deleteCategory(id);
                toast.success("カテゴリを削除しました");
                loadCategories();
                handleCloseDialog();
            } catch {
                toast.error("カテゴリの削除に失敗しました");
            }
        },
        [loadCategories, handleCloseDialog]
    );

    return {
        // データ
        categories,
        treeItems,
        editingCategory,
        // 状態
        loading,
        isDialogOpen,
        lastCount,
        // ハンドラ
        handleTreeChange,
        handleEdit,
        handleCreate,
        handleFormSuccess,
        handleCloseDialog,
        handleDelete,
    };
}
