/**
 * 共通型定義
 * API レスポンスで共有される型をここに集約
 */

// ========== カテゴリ関連 ==========

export interface CategorySummary {
    id: number;
    name: string;
    slug: string;
    parent?: { id: number } | null;
    sortOrder: number;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    parent?: CategorySummary | null;
    sortOrder: number;
    postCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface CategoryCreateRequest {
    name: string;
    slug: string;
    parentId?: number;
}

export interface CategoryReorderRequest {
    categoryId: number;
    newSortOrder: number;
}

// ========== タグ関連 ==========

export interface TagSummary {
    id: number;
    name: string;
    slug: string;
    postCount?: number;
}

export interface Tag {
    id: number;
    name: string;
    slug: string;
    postCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface TagCreateRequest {
    name: string;
    slug: string;
}

// ========== メディア関連 ==========

export interface CoverMediaSummary {
    id: number;
    storageKey: string;
    publicUrl: string | null;
}

export interface MediaCreatedBy {
    id: number;
    displayName: string;
    role: UserRole;
}

export interface MediaResponse {
    id: number;
    filename: string;
    storageKey: string;
    mime: string;
    bytes: number;
    width: number | null;
    height: number | null;
    altText: string | null;
    publicUrl: string | null;
    createdAt: string;
    createdBy: MediaCreatedBy;
}

// ========== ユーザー関連 ==========

export type UserRole = "ADMIN" | "EDITOR" | "AUTHOR";
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED";

export interface AuthorSummary {
    id: number;
    displayName: string;
}

export interface UserProfileResponse {
    id: number;
    email: string;
    role: UserRole;
    displayName: string | null;
    bio: string | null;
    avatarMediaId: number | null;
    status: UserStatus;
    emailVerified: boolean;
    emailVerifiedAt: string | null;
    lastLoginAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface UserResponse {
    id: number;
    email: string;
    role: UserRole;
    displayName: string | null;
    bio: string | null;
    avatarMediaId: number | null;
    status: UserStatus;
    emailVerified: boolean;
    emailVerifiedAt: string | null;
    lastLoginAt: string | null;
    createdAt: string;
    updatedAt: string;
}

// ========== 投稿関連 ==========

export interface Post {
    id: string;
    title: string;
    slug: string;
    publishedAt: string | null;
    category: CategorySummary | null;
    tags?: TagSummary[];
    status: string;
    coverMedia?: CoverMediaSummary | null;
    author?: AuthorSummary | null;
}

export interface PostsResponse {
    content: Post[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number; // 現在のページ (0始まり)
}

// ========== ページネーション ==========

export interface PageResponse<T> {
    content: T[];
    pageable: {
        pageNumber: number;
        pageSize: number;
        sort: {
            sorted: boolean;
            empty: boolean;
            unsorted: boolean;
        };
        offset: number;
        paged: boolean;
        unpaged: boolean;
    };
    totalElements: number;
    totalPages: number;
    last: boolean;
    size: number;
    number: number;
    sort: {
        sorted: boolean;
        empty: boolean;
        unsorted: boolean;
    };
    first: boolean;
    numberOfElements: number;
    empty: boolean;
}
