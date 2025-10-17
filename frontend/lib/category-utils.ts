import type { CategorySummary } from "@/lib/types/common";

// 階層付きカテゴリ型
export type CategoryWithLevel = CategorySummary & { level: number };

// レベル→Tailwind padding クラスのマップ（必要に応じて拡張）
export const PL_CLASSES: string[] = ["pl-3", "pl-6", "pl-9", "pl-12"];

/**
 * utility: 親情報の ID を正規化して返す
 * - API により parent が `{ id: number }` の場合
 * - あるいは親が数値 `parent: 1` の場合
 * - あるいは `parentId` フィールドを持つ場合
 */
const getParentId = (c: CategorySummary): number | null => {
    const record = c as unknown as Record<string, unknown>;
    const p = record.parent;
    if (p == null) return null;
    if (typeof p === "number") return p;
    if (
        typeof p === "object" &&
        p !== null &&
        typeof (p as Record<string, unknown>).id === "number"
    )
        return (p as Record<string, unknown>).id as number;
    // 互換性のため parentId を探す
    if (typeof record.parentId === "number") return record.parentId as number;
    return null;
};

// カテゴリを階層構造に組み立てて、フラットな配列に level を付与する
// 入力: CategorySummary[]（各カテゴリは id, name, parent?: {id} | number, sortOrder を持つ想定）
// 出力: CategorySummary に level:number を付与した配列（表示順: 親 -> 子...）
export const buildCategoryTree = (
    cats: CategorySummary[]
): CategoryWithLevel[] => {
    const childrenMap = new Map<number, CategorySummary[]>();

    // すべてのカテゴリに空配列を初期化（存在しない parent の場合も後で作成される）
    cats.forEach((c) => {
        if (!childrenMap.has(c.id)) childrenMap.set(c.id, []);
    });

    // 親 ID を正規化して子を登録
    cats.forEach((c) => {
        const parentId = getParentId(c);
        if (parentId !== null && typeof parentId === "number") {
            if (!childrenMap.has(parentId)) childrenMap.set(parentId, []);
            childrenMap.get(parentId)!.push(c);
        }
    });

    const result: CategoryWithLevel[] = [];

    const addWithChildren = (node: CategorySummary, level: number) => {
        result.push({ ...node, level });
        const children = childrenMap.get(node.id) || [];
        children
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .forEach((ch) => addWithChildren(ch, level + 1));
    };

    // ルート（parent が absent）をソートして追加
    const roots = cats
        .filter((c) => getParentId(c) === null)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    roots.forEach((r) => addWithChildren(r, 0));

    return result;
};
