/**
 * タグ別投稿一覧ページ
 */

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getPublicPosts, getPublicTags } from "@/lib/api/public";
import { PostCard } from "@/components/public/PostCard";
import { Pagination } from "@/components/public/Pagination";
import { generateTagPostsMetadata } from "@/features/public/utils/seo-metadata";
import type { Metadata } from "next";
import { HashIcon } from "lucide-react";

interface TagPostsPageProps {
    params: Promise<{
        slug: string;
        name: string;
    }>;
    searchParams: Promise<{
        page?: string;
    }>;
}

// メタデータ生成
export async function generateMetadata({
    params,
}: TagPostsPageProps): Promise<Metadata> {
    const { slug } = await params;

    // タグが存在するか確認
    const tags = await getPublicTags();
    const tag = tags.find((t) => t.slug === slug);

    if (!tag) {
        return {
            title: "タグが見つかりません",
        };
    }

    return generateTagPostsMetadata(tag);
}

export default async function TagPostsPage({
    params,
    searchParams,
}: TagPostsPageProps) {
    const { slug } = await params;
    const searchParamsData = await searchParams;
    const page = searchParamsData.page
        ? parseInt(searchParamsData.page, 10)
        : 0;

    // タグが存在するか確認
    const tags = await getPublicTags();
    const tag = tags.find((t) => t.slug === slug);

    if (!tag) {
        notFound();
    }

    // タグ別投稿一覧を取得
    const response = await getPublicPosts({
        page,
        size: 12,
        tag: slug,
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* ヘッダー */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mt-8 mb-2 flex items-center gap-1">
                    <HashIcon />
                    {tag.name}
                </h1>
                <p className="text-xs text-muted-foreground">
                    全 {response.totalElements} 件の記事
                </p>
            </div>

            {/* 投稿一覧 */}
            {response.content.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    このタグの記事はまだありません
                </div>
            ) : (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                        {response.content.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>

                    {/* ページネーション */}
                    <Suspense fallback={<div>読み込み中...</div>}>
                        <Pagination
                            currentPage={page}
                            totalPages={response.totalPages}
                            basePath={`/tags/${slug}`}
                        />
                    </Suspense>
                </>
            )}
        </div>
    );
}
