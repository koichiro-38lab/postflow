/**
 * 公開API用の型定義
 */

// カバーメディア情報
export interface PostCoverMedia {
    url: string;
    width: number;
    height: number;
    altText: string;
}

// カテゴリ情報
export interface PostCategory {
    id: number;
    name: string;
    slug: string;
}

// タグ情報
export interface PostTag {
    id: number;
    name: string;
    slug: string;
}

// 著者情報
export interface PostAuthor {
    id: number;
    username: string;
    displayName: string;
    avatarUrl?: string;
    bio?: string;
}

// 投稿一覧用レスポンス
export interface PostPublic {
    id: number;
    slug: string;
    title: string;
    excerpt: string;
    publishedAt: string;
    coverMedia: PostCoverMedia | null;
    category: PostCategory | null;
    tags: PostTag[];
}

// 投稿詳細用レスポンス
export interface PostPublicDetail extends PostPublic {
    contentJson: string;
    author: PostAuthor;
    metaTitle: string | null;
    metaDescription: string | null;
}

// ページング情報
export interface PageableResponse<T> {
    content: T[];
    pageable: {
        pageNumber: number;
        pageSize: number;
        sort: {
            sorted: boolean;
            unsorted: boolean;
            empty: boolean;
        };
        offset: number;
        paged: boolean;
        unpaged: boolean;
    };
    totalPages: number;
    totalElements: number;
    last: boolean;
    size: number;
    number: number;
    sort: {
        sorted: boolean;
        unsorted: boolean;
        empty: boolean;
    };
    numberOfElements: number;
    first: boolean;
    empty: boolean;
}

// カテゴリレスポンス
export interface CategoryPublic {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    parentId: number | null;
    postCount: number;
}

// タグレスポンス
export interface TagPublic {
    id: number;
    name: string;
    slug: string;
    postCount: number;
}

// 投稿一覧取得パラメーター
export interface GetPublicPostsParams {
    page?: number;
    size?: number;
    tag?: string;
    category?: string;
    categories?: string;
}
