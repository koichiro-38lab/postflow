export type SortField =
    | "title"
    | "slug"
    | "author"
    | "publishedAt"
    | "category"
    | "status";

export type SortDirection = "asc" | "desc";

export interface PostsFilterParams {
    page: number; // 0始まり（内部管理用）
    size: number;
    sortField: SortField;
    sortDirection: SortDirection;
    statusFilter: string;
    categoryFilter: string;
}
