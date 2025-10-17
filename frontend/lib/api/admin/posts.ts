import api from "@/lib/api";
import type { PostsResponse } from "@/lib/types/common";

// 型を re-export（利便性のため）
export type { Post, PostsResponse } from "@/lib/types/common";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface FetchPostsParams {
    page?: number;
    size?: number;
    sort?: string;
    order?: string;
    status?: string;
    categoryId?: string;
}

/**
 * 管理画面用の投稿一覧を取得
 */
export async function fetchAdminPosts(
    params: FetchPostsParams = {}
): Promise<PostsResponse> {
    const { page = 0, size = 10, sort, order, status, categoryId } = params;

    const queryParams: Record<string, string | number> = {
        page,
        size,
    };

    if (sort) {
        queryParams.sort = order ? `${sort},${order}` : sort;
    }

    if (status) queryParams.status = status;
    if (categoryId) queryParams.categoryId = categoryId;

    const res = await api.get(`${API_BASE_URL}/api/admin/posts`, {
        params: queryParams,
    });
    return res.data;
}
