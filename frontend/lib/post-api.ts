import api from "@/lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface CategorySummary {
    id: number;
    name: string;
    slug: string;
    parent?: { id: number } | null;
    sortOrder: number;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    parent?: CategorySummary | null;
    sortOrder: number;
    postCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface TagSummary {
    id: number;
    name: string;
    slug: string;
}

export interface Post {
    id: string;
    title: string;
    slug: string;
    publishedAt: string | null;
    category: CategorySummary | null;
    status: string;
    // 必要に応じて他のフィールドも追加
}

export interface PostsResponse {
    content: Post[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number; // 現在のページ (0始まり)
}

export async function fetchPosts(
    _accessToken?: string,
    page: number = 0,
    size: number = 10,
    sort?: string,
    order?: string,
    status?: string,
    categoryId?: string
): Promise<PostsResponse> {
    const params: Record<string, string | number> = {
        page,
        size,
    };

    if (sort) {
        params.sort = sort;
        if (order) {
            params.sort = `${sort},${order}`;
        }
    }

    if (status) params.status = status;
    if (categoryId) params.categoryId = categoryId;

    const res = await api.get(`${API_BASE_URL}/api/admin/posts`, { params });
    return res.data;
}

export async function fetchCategories(): Promise<Category[]> {
    const res = await api.get(`${API_BASE_URL}/api/admin/categories`);
    return res.data;
}

export interface CategoryCreateRequest {
    name: string;
    slug: string;
    parentId?: number;
}

export async function createCategory(
    request: CategoryCreateRequest
): Promise<Category> {
    const res = await api.post(`${API_BASE_URL}/api/admin/categories`, request);
    return res.data;
}

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

export async function deleteCategory(id: number): Promise<void> {
    await api.delete(`${API_BASE_URL}/api/admin/categories/${id}`);
}

export interface CategoryReorderRequest {
    categoryId: number;
    newSortOrder: number;
}

export async function reorderCategories(
    requests: CategoryReorderRequest[]
): Promise<void> {
    await api.put(`${API_BASE_URL}/api/admin/categories/reorder`, requests);
}

export async function fetchTags(): Promise<TagSummary[]> {
    const res = await api.get(`${API_BASE_URL}/api/admin/tags`);
    return res.data;
}

export interface TagCreateRequest {
    name: string;
    slug: string;
}

export async function createTag(
    request: TagCreateRequest
): Promise<TagSummary> {
    const res = await api.post(`${API_BASE_URL}/api/admin/tags`, request);
    return res.data;
}
