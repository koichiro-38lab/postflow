/**
 * カテゴリ別投稿一覧ページ
 */

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getPublicCategories } from "@/lib/api/public";
import { getCategoryPosts } from "@/features/public/utils/category-posts";
import { PostCard } from "@/components/public/PostCard";
import { Pagination } from "@/components/public/Pagination";
import { generateCategoryPostsMetadata } from "@/features/public/utils/seo-metadata";
import type { Metadata } from "next";
import { FolderOpen } from "lucide-react";

interface CategoryPostsPageProps {
    params: Promise<{
        slug: string;
    }>;
    searchParams: Promise<{
        page?: string;
    }>;
}

// メタデータ生成
export async function generateMetadata({
    params,
}: CategoryPostsPageProps): Promise<Metadata> {
    const { slug } = await params;

    // カテゴリが存在するか確認
    const categories = await getPublicCategories();
    const category = categories.find((cat) => cat.slug === slug);

    if (!category) {
        return {
            title: "カテゴリが見つかりません",
        };
    }

    // description: null を undefined に変換して渡す
    return generateCategoryPostsMetadata({
        ...category,
        description: category.description ?? undefined,
    });
}

export default async function CategoryPostsPage({
    params,
    searchParams,
}: CategoryPostsPageProps) {
    const { slug } = await params;
    const searchParamsData = await searchParams;
    const page = searchParamsData.page
        ? parseInt(searchParamsData.page, 10)
        : 0;

    // カテゴリが存在するか確認
    const categories = await getPublicCategories();
    const category = categories.find((cat) => cat.slug === slug);

    if (!category) {
        notFound();
    }

    // 子カテゴリを取得（親カテゴリの場合のみ）
    const childCategories =
        category.parentId === null
            ? categories.filter((cat) => cat.parentId === category.id)
            : [];

    // カテゴリ別投稿一覧を取得（親カテゴリの場合は子カテゴリも含む）
    const response = await getCategoryPosts(slug, page, 12);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* ヘッダー */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold mt-8 mb-2">
                    {category.name}
                </h1>
                <p className="text-xs text-muted-foreground">
                    全 {response.totalElements} 件の記事
                </p>
            </div>
            {/* 子カテゴリが存在する場合 */}
            {childCategories.length > 0 && (
                <div className="mb-6">
                    <div className="flex flex-wrap gap-4">
                        {childCategories.map((child) => (
                            <a
                                key={child.id}
                                href={`/categories/${child.slug}`}
                                className="px-3 py-1 rounded-md text-sm border hover:text-primary transition-colors"
                            >
                                <FolderOpen className="w-4 h-4 inline-block mr-1" />
                                {child.name}
                            </a>
                        ))}
                    </div>
                </div>
            )}
            {/* 投稿一覧 */}
            {response.content.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    このカテゴリの記事はまだありません
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
                            basePath={`/categories/${slug}`}
                        />
                    </Suspense>
                </>
            )}
        </div>
    );
}
