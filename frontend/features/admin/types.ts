// カテゴリ型定義
export type Category = {
    id: number;
    name: string;
    slug: string;
    parentId?: number | null;
    // 必要に応じてプロパティ追加
};
