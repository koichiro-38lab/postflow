/**
 * 公開タグ一覧取得フック
 */

import { useState, useEffect } from "react";
import { getPublicTags } from "@/lib/api/public";
import type { TagPublic } from "@/features/public/types";

interface UsePublicTagsResult {
    tags: TagPublic[];
    loading: boolean;
    error: Error | null;
}

/**
 * 公開タグ一覧を取得するフック
 */
export function usePublicTags(): UsePublicTagsResult {
    const [tags, setTags] = useState<TagPublic[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchTags = async () => {
            try {
                setLoading(true);
                setError(null);

                const data = await getPublicTags();

                if (isMounted) {
                    setTags(data);
                }
            } catch (err) {
                if (isMounted) {
                    setError(
                        err instanceof Error
                            ? err
                            : new Error("Failed to fetch tags")
                    );
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchTags();

        return () => {
            isMounted = false;
        };
    }, []);

    return { tags, loading, error };
}
