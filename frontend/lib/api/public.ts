/**
 * 公開API関数
 */

import {
    PostPublic,
    PostPublicDetail,
    PageableResponse,
    CategoryPublic,
    TagPublic,
    GetPublicPostsParams,
} from "@/features/public/types";
import { getApiBaseUrl } from "@/lib/api-base-url";

const API_BASE_URL = getApiBaseUrl();

/**
 * 公開投稿一覧を取得
 */
export async function getPublicPosts(
    params: GetPublicPostsParams = {}
): Promise<PageableResponse<PostPublic>> {
    const searchParams = new URLSearchParams();

    if (params.page !== undefined) {
        searchParams.append("page", params.page.toString());
    }
    if (params.size !== undefined) {
        searchParams.append("size", params.size.toString());
    }
    if (params.tag) {
        searchParams.append("tag", params.tag);
    }
    if (params.category) {
        searchParams.append("category", params.category);
    }
    if (params.categories) {
        // すでに category がある場合でも categories を優先する
        searchParams.delete("category");
        searchParams.append("categories", params.categories);
    }

    const url = `${API_BASE_URL}/api/public/posts?${searchParams.toString()}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        // Next.js 15のキャッシュ戦略: ISR（10秒ごとに再検証）
        next: { revalidate: 10 },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.statusText}`);
    }

    return response.json();
}

/**
 * 投稿詳細を取得
 */
export async function getPublicPostBySlug(
    slug: string
): Promise<PostPublicDetail> {
    const url = `${API_BASE_URL}/api/public/posts/${slug}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        // Next.js 15のキャッシュ戦略: ISR（10秒ごとに再検証）
        next: { revalidate: 10 },
    });

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error("Post not found");
        }
        throw new Error(`Failed to fetch post: ${response.statusText}`);
    }

    return response.json();
}

/**
 * 公開カテゴリ一覧を取得
 */
export async function getPublicCategories(): Promise<CategoryPublic[]> {
    const url = `${API_BASE_URL}/api/public/categories`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        // Next.js 15のキャッシュ戦略: ISR（60秒ごとに再検証）
        next: { revalidate: 60 },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }

    return response.json();
}

/**
 * 公開タグ一覧を取得
 */
export async function getPublicTags(): Promise<TagPublic[]> {
    const url = `${API_BASE_URL}/api/public/tags`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        // Next.js 15のキャッシュ戦略: ISR（60秒ごとに再検証）
        next: { revalidate: 60 },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch tags: ${response.statusText}`);
    }

    return response.json();
}
