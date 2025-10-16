/**
 * SEOメタデータ生成ユーティリティ
 */

import type { Metadata } from "next";
import { PostPublicDetail } from "@/features/public/types";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/**
 * 投稿詳細ページのメタデータを生成
 */
export function generatePostMetadata(post: PostPublicDetail): Metadata {
    // タイトルにサイト名を付与
    const title = `${post.metaTitle || post.title} | ${SITE_NAME}`;
    const description =
        post.metaDescription || post.excerpt || `${post.title}の記事です。`;
    const url = `${SITE_URL}/posts/${post.slug}`;
    const imageUrl = post.coverMedia?.url || `${SITE_URL}/og-default.png`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url,
            siteName: SITE_NAME,
            images: [
                {
                    url: imageUrl,
                    width: post.coverMedia?.width || 1200,
                    height: post.coverMedia?.height || 630,
                    alt: post.coverMedia?.altText || title,
                },
            ],
            locale: "ja_JP",
            type: "article",
            publishedTime: post.publishedAt,
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [imageUrl],
        },
        alternates: {
            canonical: url,
        },
    };
}

/**
 * 投稿一覧ページのメタデータを生成
 */
export function generatePostsListMetadata(params?: {
    tag?: string;
    category?: string;
}): Metadata {
    let title = "記事一覧";
    let description = "最新の記事一覧です。";

    if (params?.tag) {
        title = `タグ「${params.tag}」の記事一覧`;
        description = `タグ「${params.tag}」が付いた記事の一覧です。`;
    }

    if (params?.category) {
        title = `カテゴリ「${params.category}」の記事一覧`;
        description = `カテゴリ「${params.category}」の記事一覧です。`;
    }

    const url = `${SITE_URL}/posts`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url,
            siteName: SITE_NAME,
            locale: "ja_JP",
            type: "website",
        },
        twitter: {
            card: "summary",
            title,
            description,
        },
        alternates: {
            canonical: url,
        },
    };
}

/**
 * カテゴリ別投稿一覧のメタデータを生成
 */
export function generateCategoryPostsMetadata(category: {
    name: string;
    slug: string;
    description?: string;
}): Metadata {
    const title = `${category.name} | ${SITE_NAME}`;
    const description =
        category.description || `${category.name}カテゴリの記事一覧です。`;
    const url = `${SITE_URL}/categories/${category.slug}`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url,
            siteName: SITE_NAME,
            type: "website",
            locale: "ja_JP",
        },
        twitter: {
            card: "summary",
            title,
            description,
        },
        alternates: {
            canonical: url,
        },
    };
}

/**
 * タグ別投稿一覧のメタデータを生成
 */
export function generateTagPostsMetadata(tag: {
    name: string;
    slug: string;
}): Metadata {
    const title = `${tag.name} | ${SITE_NAME}`;
    const description = `${tag.name}タグの記事一覧です。`;
    const url = `${SITE_URL}/tags/${tag.slug}`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url,
            siteName: SITE_NAME,
            type: "website",
            locale: "ja_JP",
        },
        twitter: {
            card: "summary",
            title,
            description,
        },
        alternates: {
            canonical: url,
        },
    };
}

/**
 * 構造化データ（JSON-LD）を生成
 */
export function generateArticleJsonLd(post: PostPublicDetail) {
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: post.excerpt,
        image: post.coverMedia?.url,
        datePublished: post.publishedAt,
        author: {
            "@type": "Person",
            name: post.author.displayName,
        },
        publisher: {
            "@type": "Organization",
            name: SITE_NAME,
            logo: {
                "@type": "ImageObject",
                url: `${SITE_URL}/logo.png`,
            },
        },
        mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `${SITE_URL}/posts/${post.slug}`,
        },
    };
}
