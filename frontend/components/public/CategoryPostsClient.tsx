"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getPublicCategories, getPublicPosts } from "@/lib/api/public";
import type {
    CategoryPublic,
    PostPublic,
    PageableResponse,
} from "@/features/public/types";
import { PostCard } from "@/components/public/PostCard";
import { Pagination } from "@/components/public/Pagination";

interface Props {
    slug: string;
}

export default function CategoryPostsClient({ slug }: Props) {
    const searchParams = useSearchParams();
    const pageParam = searchParams.get("page");
    const [page, setPage] = useState<number>(
        pageParam ? parseInt(pageParam, 10) : 0
    );

    const [category, setCategory] = useState<CategoryPublic | null>(null);
    const [childCategories, setChildCategories] = useState<CategoryPublic[]>(
        []
    );
    const [response, setResponse] =
        useState<PageableResponse<PostPublic> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setPage(pageParam ? parseInt(pageParam, 10) : 0);
    }, [pageParam]);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);

        (async () => {
            try {
                const categories = await getPublicCategories();
                const cat = categories.find((c) => c.slug === slug) || null;
                if (!cat) {
                    throw new Error("Category not found");
                }
                if (!mounted) return;
                setCategory(cat);

                const childCats =
                    cat.parentId === null
                        ? categories.filter((c) => c.parentId === cat.id)
                        : [];
                setChildCategories(childCats);

                // 親カテゴリの場合は categories クエリでまとめて取得
                if (cat.parentId === null) {
                    const slugs = [cat.slug, ...childCats.map((c) => c.slug)];
                    const combined = await getPublicPosts({
                        page: 0,
                        size: 1000,
                        categories: slugs.join(","),
                    });
                    if (!mounted) return;
                    // 重複排除・ソート・ページネーション（同じロジックを維持）
                    const allPosts = combined.content;
                    const uniquePosts = Array.from(
                        new Map(allPosts.map((p) => [p.id, p])).values()
                    );
                    uniquePosts.sort(
                        (a, b) =>
                            new Date(b.publishedAt).getTime() -
                            new Date(a.publishedAt).getTime()
                    );
                    const pageSize = 12;
                    const startIndex = page * pageSize;
                    const endIndex = startIndex + pageSize;
                    const paginated = uniquePosts.slice(startIndex, endIndex);
                    const resp: PageableResponse<PostPublic> = {
                        content: paginated,
                        totalPages: Math.ceil(uniquePosts.length / pageSize),
                        totalElements: uniquePosts.length,
                        pageable: {
                            pageNumber: page,
                            pageSize,
                            sort: {
                                sorted: true,
                                unsorted: false,
                                empty: false,
                            },
                            offset: startIndex,
                            paged: true,
                            unpaged: false,
                        },
                        last: endIndex >= uniquePosts.length,
                        size: pageSize,
                        number: page,
                        sort: { sorted: true, unsorted: false, empty: false },
                        numberOfElements: paginated.length,
                        first: page === 0,
                        empty: paginated.length === 0,
                    };
                    setResponse(resp);
                } else {
                    const res = await getPublicPosts({
                        page,
                        size: 12,
                        category: slug,
                    });
                    if (!mounted) return;
                    setResponse(res);
                }
            } catch (e) {
                if (!mounted) return;
                setError(e instanceof Error ? e.message : String(e));
            } finally {
                if (!mounted) return;
                setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [slug, page]);

    if (loading) return <div className="py-12 text-center">読み込み中...</div>;
    if (error)
        return <div className="py-12 text-center text-red-500">{error}</div>;
    if (!response || !category) return null;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mt-8 mb-2">
                    {category.name}
                </h1>
                <p className="text-muted-foreground">
                    {category.description ||
                        `${category.name}カテゴリの記事一覧`}
                </p>
            </div>

            {childCategories.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">サブカテゴリ</h2>
                    <div className="flex flex-wrap gap-4">
                        {childCategories.map((child) => (
                            <a
                                key={child.id}
                                href={`/categories/${child.slug}`}
                                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-sm text-gray-800 dark:text-gray-200 hover:bg-primary hover:text-white transition-colors"
                            >
                                {child.name}
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {response.content.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    このカテゴリの記事はまだありません
                </div>
            ) : (
                <>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                        {response.content.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>

                    <Pagination
                        currentPage={page}
                        totalPages={response.totalPages}
                        basePath={`/categories/${slug}`}
                    />
                </>
            )}
        </div>
    );
}
