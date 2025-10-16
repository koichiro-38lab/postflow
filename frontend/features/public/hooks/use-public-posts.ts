/**
 * 公開投稿一覧取得フック
 */

import { useState, useEffect } from "react";
import { getPublicPosts } from "@/lib/api/public";
import type {
    GetPublicPostsParams,
    PostPublic,
    PageableResponse,
} from "@/features/public/types";

interface UsePublicPostsResult {
    posts: PostPublic[];
    loading: boolean;
    error: Error | null;
    pageInfo: {
        currentPage: number;
        totalPages: number;
        totalElements: number;
        hasNext: boolean;
        hasPrevious: boolean;
    } | null;
}

/**
 * 公開投稿一覧を取得するフック
 */
export function usePublicPosts(
    params: GetPublicPostsParams = {}
): UsePublicPostsResult {
    const [posts, setPosts] = useState<PostPublic[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [pageInfo, setPageInfo] =
        useState<UsePublicPostsResult["pageInfo"]>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchPosts = async () => {
            try {
                setLoading(true);
                setError(null);

                const response: PageableResponse<PostPublic> =
                    await getPublicPosts(params);

                if (isMounted) {
                    setPosts(response.content);
                    setPageInfo({
                        currentPage: response.number,
                        totalPages: response.totalPages,
                        totalElements: response.totalElements,
                        hasNext: !response.last,
                        hasPrevious: !response.first,
                    });
                }
            } catch (err) {
                if (isMounted) {
                    setError(
                        err instanceof Error
                            ? err
                            : new Error("Failed to fetch posts")
                    );
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchPosts();

        return () => {
            isMounted = false;
        };
    }, [params]);

    return { posts, loading, error, pageInfo };
}
