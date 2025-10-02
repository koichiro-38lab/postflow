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
    postCount?: number; // オプション: 投稿数
}

export interface Tag {
    id: number;
    name: string;
    slug: string;
    postCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface Post {
    id: string;
    title: string;
    slug: string;
    publishedAt: string | null;
    category: CategorySummary | null;
    tags?: TagSummary[];
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

// タグ一覧取得（管理画面用）
// 投稿数を含む完全な情報を取得
export async function fetchTags(params?: {
    query?: string;
    page?: number;
    size?: number;
}): Promise<Tag[]> {
    const queryParams: Record<string, string | number> = {};

    if (params?.query) queryParams.query = params.query;
    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.size !== undefined) queryParams.size = params.size;

    const res = await api.get(`${API_BASE_URL}/api/admin/tags`, {
        params: queryParams,
    });
    return res.data;
}

// 個別タグ取得（投稿数を含む詳細情報）
export async function fetchTag(id: number): Promise<Tag> {
    const res = await api.get(`${API_BASE_URL}/api/admin/tags/${id}`);
    return res.data;
}

// スラッグでタグ取得（投稿数を含む詳細情報）
export async function fetchTagBySlug(slug: string): Promise<Tag> {
    const res = await api.get(`${API_BASE_URL}/api/admin/tags/slug/${slug}`);
    return res.data;
}

// タグ作成リクエスト型
export interface TagCreateRequest {
    name: string;
    slug: string;
}

// タグ作成
export async function createTag(request: TagCreateRequest): Promise<Tag> {
    const res = await api.post(`${API_BASE_URL}/api/admin/tags`, request);
    return res.data;
}

// タグ更新
export async function updateTag(
    id: number,
    request: TagCreateRequest
): Promise<Tag> {
    const res = await api.put(`${API_BASE_URL}/api/admin/tags/${id}`, request);
    return res.data;
}

// タグ削除
export async function deleteTag(id: number): Promise<void> {
    await api.delete(`${API_BASE_URL}/api/admin/tags/${id}`);
}
