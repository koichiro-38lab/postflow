/**
 * 公開投稿詳細取得フック
 */

import { useState, useEffect } from "react";
import { getPublicPostBySlug } from "@/lib/api/public";
import type { PostPublicDetail } from "@/features/public/types";

interface UsePublicPostResult {
    post: PostPublicDetail | null;
    loading: boolean;
    error: Error | null;
}

/**
 * 投稿詳細を取得するフック
 */
export function usePublicPost(slug: string): UsePublicPostResult {
    const [post, setPost] = useState<PostPublicDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchPost = async () => {
            try {
                setLoading(true);
                setError(null);

                const data = await getPublicPostBySlug(slug);

                if (isMounted) {
                    setPost(data);
                }
            } catch (err) {
                if (isMounted) {
                    setError(
                        err instanceof Error
                            ? err
                            : new Error("Failed to fetch post")
                    );
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        if (slug) {
            fetchPost();
        }

        return () => {
            isMounted = false;
        };
    }, [slug]);

    return { post, loading, error };
}
