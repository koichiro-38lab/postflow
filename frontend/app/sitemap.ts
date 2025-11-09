import { MetadataRoute } from "next";
import {
    getPublicPosts,
    getPublicCategories,
    getPublicTags,
} from "@/lib/api/public";

// 動的sitemap: ランタイムでAPIからデータ取得
export const dynamic = "force-dynamic";
export const revalidate = 0; // 60秒ごとに再生成

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";

    try {
        // ランタイムでAPI呼び出し（ビルド時には実行されない）
        const postsResponse = await getPublicPosts({ page: 0, size: 1000 });
        const posts = postsResponse.content;

        const categories = await getPublicCategories();
        const tags = await getPublicTags();

        // 投稿のサイトマップエントリ
        const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
            url: `${baseUrl}/posts/${post.slug}`,
            lastModified: new Date(post.publishedAt),
            changeFrequency: "weekly",
            priority: 0.8,
        }));

        // カテゴリのサイトマップエントリ
        const categoryEntries: MetadataRoute.Sitemap = categories.map(
            (category) => ({
                url: `${baseUrl}/categories/${category.slug}`,
                lastModified: new Date(),
                changeFrequency: "daily",
                priority: 0.6,
            })
        );

        // タグのサイトマップエントリ
        const tagEntries: MetadataRoute.Sitemap = tags.map((tag) => ({
            url: `${baseUrl}/tags/${tag.slug}`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.5,
        }));

        // 静的ページ
        const staticPages: MetadataRoute.Sitemap = [
            {
                url: baseUrl,
                lastModified: new Date(),
                changeFrequency: "daily",
                priority: 1,
            },
            {
                url: `${baseUrl}/posts`,
                lastModified: new Date(),
                changeFrequency: "daily",
                priority: 0.9,
            },
            {
                url: `${baseUrl}/categories`,
                lastModified: new Date(),
                changeFrequency: "weekly",
                priority: 0.7,
            },
            {
                url: `${baseUrl}/tags`,
                lastModified: new Date(),
                changeFrequency: "weekly",
                priority: 0.7,
            },
        ];

        return [
            ...staticPages,
            ...postEntries,
            ...categoryEntries,
            ...tagEntries,
        ];
    } catch (error) {
        console.error("Sitemap generation failed:", error);
        // フォールバック: 静的ページのみ返す
        return [
            {
                url: baseUrl,
                lastModified: new Date(),
                changeFrequency: "daily",
                priority: 1,
            },
            {
                url: `${baseUrl}/posts`,
                lastModified: new Date(),
                changeFrequency: "daily",
                priority: 0.9,
            },
        ];
    }
}
