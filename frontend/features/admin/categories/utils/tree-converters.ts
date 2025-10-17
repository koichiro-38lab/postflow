import { CategoryWithLevel } from "@/lib/category-utils";
import { Category } from "@/lib/api/admin/categories";
import { TreeItem } from "@/components/admin/categories/SortableTree";

/**
 * 階層構造付きカテゴリを TreeItem に変換
 */
export function convertHierarchicalToTreeItems(
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

/**
 * TreeItem を Category に変換（並び替え反映）
 */
export function convertFromTreeItems(
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

    // 元のカテゴリをコピーして sortOrder を更新
    const newCategories = originalCategories.map((cat) => ({ ...cat }));
    flatTree.forEach((item, index) => {
        const cat = newCategories.find((c) => c.id === Number(item.id));
        if (cat) cat.sortOrder = index;
    });

    return newCategories;
}
