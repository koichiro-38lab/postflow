import { Metadata } from "next";
import { notFound } from "next/navigation";
import PostContent from "@/components/public/PostContent";
import { PostCard } from "@/components/public/PostCard";
import { getPublicPostBySlug, getPublicPosts } from "@/lib/api/public";
import { generatePostMetadata } from "@/features/public/utils/seo-metadata";
import type { PostPublic } from "@/features/public/types";

interface PostDetailPageProps {
    params: Promise<{
        slug: string;
    }>;
}

// メタデータ生成
export async function generateMetadata({
    params,
}: PostDetailPageProps): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPublicPostBySlug(slug);

    if (!post) {
        return {
            title: "記事が見つかりません",
        };
    }

    return generatePostMetadata(post);
}

// 投稿詳細ページ
export default async function PostDetailPage({ params }: PostDetailPageProps) {
    const { slug } = await params;
    const post = await getPublicPostBySlug(slug);

    if (!post) {
        notFound();
    }

    // 関連記事を取得（同じカテゴリの他の記事）
    let relatedPosts: PostPublic[] = [];
    if (post.category) {
        try {
            const response = await getPublicPosts({
                category: post.category.slug,
                size: 6, // 少し多めに取得して現在の投稿を除外
            });
            relatedPosts = response.content
                .filter((p) => p.id !== post.id)
                .slice(0, 5);
        } catch (error) {
            // エラーが発生してもページを表示
            console.error("Failed to fetch related posts:", error);
        }
    }

    // JSON-LDスキーマ追加
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        image: post.coverMedia?.url,
        datePublished: post.publishedAt,
        dateModified: post.publishedAt,
        author: {
            "@type": "Person",
            name:
                post.author?.displayName || post.author?.username || "Unknown",
        },
        description: post.metaDescription || post.excerpt,
        articleBody: post.excerpt,
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <PostContent post={post} />
            {relatedPosts.length > 0 && (
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <h2 className="text-2xl font-bold mb-4">関連記事</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {relatedPosts.map((relatedPost) => (
                            <PostCard key={relatedPost.id} post={relatedPost} />
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
