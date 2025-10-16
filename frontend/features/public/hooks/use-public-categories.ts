/**
 * 公開カテゴリ一覧取得フック
 */

import { useState, useEffect } from "react";
import { getPublicCategories } from "@/lib/api/public";
import type { CategoryPublic } from "@/features/public/types";

interface UsePublicCategoriesResult {
    categories: CategoryPublic[];
    loading: boolean;
    error: Error | null;
}

/**
 * 公開カテゴリ一覧を取得するフック
 */
export function usePublicCategories(): UsePublicCategoriesResult {
    const [categories, setCategories] = useState<CategoryPublic[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchCategories = async () => {
            try {
                setLoading(true);
                setError(null);

                const data = await getPublicCategories();

                if (isMounted) {
                    setCategories(data);
                }
            } catch (err) {
                if (isMounted) {
                    setError(
                        err instanceof Error
                            ? err
                            : new Error("Failed to fetch categories")
                    );
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchCategories();

        return () => {
            isMounted = false;
        };
    }, []);

    return { categories, loading, error };
}
