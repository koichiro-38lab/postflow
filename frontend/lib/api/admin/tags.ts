import api from "@/lib/api";
import type { Tag, TagCreateRequest } from "@/lib/types/common";

// Re-export types for convenience
export type { Tag, TagSummary, TagCreateRequest } from "@/lib/types/common";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface FetchTagsParams {
    query?: string;
    page?: number;
    size?: number;
}

/**
 * タグ一覧を取得（管理画面用）
 * 投稿数を含む完全な情報を取得
 */
export async function fetchTags(params?: FetchTagsParams): Promise<Tag[]> {
    const queryParams: Record<string, string | number> = {};

    if (params?.query) queryParams.query = params.query;
    if (params?.page !== undefined) queryParams.page = params.page;
    if (params?.size !== undefined) queryParams.size = params.size;

    const res = await api.get(`${API_BASE_URL}/api/admin/tags`, {
        params: queryParams,
    });
    return res.data;
}

/**
 * 個別タグを取得（投稿数を含む詳細情報）
 */
export async function fetchTag(id: number): Promise<Tag> {
    const res = await api.get(`${API_BASE_URL}/api/admin/tags/${id}`);
    return res.data;
}

/**
 * スラッグでタグを取得（投稿数を含む詳細情報）
 */
export async function fetchTagBySlug(slug: string): Promise<Tag> {
    const res = await api.get(`${API_BASE_URL}/api/admin/tags/slug/${slug}`);
    return res.data;
}

/**
 * タグを作成
 */
export async function createTag(request: TagCreateRequest): Promise<Tag> {
    const res = await api.post(`${API_BASE_URL}/api/admin/tags`, request);
    return res.data;
}

/**
 * タグを更新
 */
export async function updateTag(
    id: number,
    request: TagCreateRequest
): Promise<Tag> {
    const res = await api.put(`${API_BASE_URL}/api/admin/tags/${id}`, request);
    return res.data;
}

/**
 * タグを削除
 */
export async function deleteTag(id: number): Promise<void> {
    await api.delete(`${API_BASE_URL}/api/admin/tags/${id}`);
}
