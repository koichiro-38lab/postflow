/**
 * 投稿一覧ページ
 */

import { Suspense } from "react";
import { getPublicPosts } from "@/lib/api/public";
import { PostCard } from "@/components/public/PostCard";
import { Pagination } from "@/components/public/Pagination";
import { generatePostsListMetadata } from "@/features/public/utils/seo-metadata";
import type { Metadata } from "next";

interface PostsPageProps {
    searchParams: Promise<{
        page?: string;
        tag?: string;
        category?: string;
    }>;
}

// メタデータ生成
export async function generateMetadata({
    searchParams,
}: PostsPageProps): Promise<Metadata> {
    const params = await searchParams;
    return generatePostsListMetadata({
        tag: params.tag,
        category: params.category,
    });
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
    const params = await searchParams;
    const page = params.page ? parseInt(params.page, 10) : 0;
    const tag = params.tag;
    const category = params.category;

    // 投稿一覧を取得
    const response = await getPublicPosts({
        page,
        size: 12,
        tag,
        category,
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* ヘッダー */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mt-8 mb-2">
                    {tag
                        ? `タグ「${tag}」の記事`
                        : category
                        ? `カテゴリ「${category}」の記事`
                        : "記事一覧"}
                </h1>
                <p className="text-xs text-muted-foreground">
                    全 {response.totalElements} 件の記事
                </p>
            </div>

            {/* 投稿一覧 */}
            {response.content.length > 0 ? (
                <>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                        {response.content.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>

                    {/* ページネーション */}
                    <Suspense fallback={<div>読み込み中...</div>}>
                        <Pagination
                            currentPage={response.number}
                            totalPages={response.totalPages}
                            basePath="/posts"
                        />
                    </Suspense>
                </>
            ) : (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">
                        記事が見つかりませんでした。
                    </p>
                </div>
            )}
        </div>
    );
}
