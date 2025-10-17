import { Category } from "@/lib/api/admin/categories";
import { buildCategoryTree, CategoryWithLevel } from "@/lib/category-utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface AdminPostsFiltersProps {
    statusFilter: string;
    categoryFilter: string;
    itemsPerPage: number;
    categories: Category[];
    onStatusChange: (status: string) => void;
    onCategoryChange: (categoryId: string) => void;
    onItemsPerPageChange: (size: string) => void;
}

/**
 * 管理画面投稿一覧のフィルタUI
 * ステータス・カテゴリ・表示件数のセレクトボックスを提供
 */
export function AdminPostsFilters({
    statusFilter,
    categoryFilter,
    itemsPerPage,
    categories,
    onStatusChange,
    onCategoryChange,
    onItemsPerPageChange,
}: AdminPostsFiltersProps) {
    return (
        <div className="mb-6 flex gap-4 flex-wrap">
            {/* ステータスフィルタ */}
            <div className="flex items-center gap-2">
                <label className="text-sm font-medium">ステータス:</label>
                <Select
                    value={statusFilter || "all"}
                    onValueChange={onStatusChange}
                >
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="すべて" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">すべて</SelectItem>
                        <SelectItem value="DRAFT">下書き</SelectItem>
                        <SelectItem value="PUBLISHED">公開済み</SelectItem>
                        <SelectItem value="ARCHIVED">アーカイブ</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* カテゴリフィルタ */}
            <div className="flex items-center gap-2">
                <label className="text-sm font-medium">カテゴリー:</label>
                <Select
                    value={categoryFilter || "all"}
                    onValueChange={onCategoryChange}
                >
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="すべて" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">すべて</SelectItem>
                        {buildCategoryTree(categories).map(
                            (category: CategoryWithLevel) => (
                                <SelectItem
                                    key={category.id}
                                    value={category.id.toString()}
                                    className="text-sm"
                                >
                                    <span className="flex items-center">
                                        {/* 階層レベルに応じてインデント */}
                                        {Array.from({
                                            length: category.level,
                                        }).map((_, i) => (
                                            <span
                                                key={i}
                                                className="inline-block w-4"
                                            />
                                        ))}
                                        {category.level > 0 && (
                                            <span className="text-muted-foreground mr-2">
                                                └
                                            </span>
                                        )}
                                        {category.name}
                                    </span>
                                </SelectItem>
                            )
                        )}
                    </SelectContent>
                </Select>
            </div>

            {/* 表示件数フィルタ */}
            <div className="flex items-center gap-2">
                <label className="text-sm font-medium">表示件数:</label>
                <Select
                    value={itemsPerPage.toString()}
                    onValueChange={onItemsPerPageChange}
                >
                    <SelectTrigger className="w-24">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="10">10件</SelectItem>
                        <SelectItem value="20">20件</SelectItem>
                        <SelectItem value="50">50件</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
