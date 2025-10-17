import api from "@/lib/api";
import type {
    Category,
    CategoryCreateRequest,
    CategoryReorderRequest,
} from "@/lib/types/common";

// Re-export types for convenience
export type {
    Category,
    CategoryCreateRequest,
    CategoryReorderRequest,
} from "@/lib/types/common";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * カテゴリ一覧を取得
 */
export async function fetchCategories(): Promise<Category[]> {
    const res = await api.get(`${API_BASE_URL}/api/admin/categories`);
    return res.data;
}

/**
 * カテゴリを作成
 */
export async function createCategory(
    request: CategoryCreateRequest
): Promise<Category> {
    const res = await api.post(`${API_BASE_URL}/api/admin/categories`, request);
    return res.data;
}

/**
 * カテゴリを更新
 */
export async function updateCategory(
    id: number,
    request: CategoryCreateRequest
): Promise<Category> {
    const res = await api.put(
        `${API_BASE_URL}/api/admin/categories/${id}`,
        request
    );
    return res.data;
}

/**
 * カテゴリを削除
 */
export async function deleteCategory(id: number): Promise<void> {
    await api.delete(`${API_BASE_URL}/api/admin/categories/${id}`);
}

/**
 * カテゴリの並び順を更新
 */
export async function reorderCategories(
    requests: CategoryReorderRequest[]
): Promise<void> {
    await api.put(`${API_BASE_URL}/api/admin/categories/reorder`, requests);
}
