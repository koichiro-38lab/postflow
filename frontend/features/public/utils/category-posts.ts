import { getPublicPosts, getPublicCategories } from "@/lib/api/public";
import {
    CategoryPublic,
    PostPublic,
    PageableResponse,
} from "@/features/public/types";

/**
 * カテゴリ別投稿取得関数
 * 親カテゴリの場合、子カテゴリの投稿も含めて取得する
 */
export async function getCategoryPosts(
    slug: string,
    page: number,
    pageSize: number = 12
): Promise<PageableResponse<PostPublic>> {
    // カテゴリ一覧を取得
    const categories = await getPublicCategories();
    const category = categories.find((cat) => cat.slug === slug);

    if (!category) {
        throw new Error("Category not found");
    }

    // 親カテゴリの場合、子カテゴリの投稿も含めて取得
    if (category.parentId === null) {
        return await getCategoryPostsWithChildren(
            category,
            categories,
            page,
            pageSize
        );
    } else {
        // 子カテゴリの場合、そのカテゴリの投稿のみ取得
        return await getPublicPosts({
            page,
            size: pageSize,
            category: slug,
        });
    }
}

/**
 * 親カテゴリ + 子カテゴリの投稿を取得して統合
 */
async function getCategoryPostsWithChildren(
    parentCategory: CategoryPublic,
    allCategories: CategoryPublic[],
    page: number,
    pageSize: number
): Promise<PageableResponse<PostPublic>> {
    // 子カテゴリを取得
    const childCategories = allCategories.filter(
        (cat) => cat.parentId === parentCategory.id
    );

    // 親カテゴリ + 子カテゴリのスラッグを取得
    const categorySlugs = [
        parentCategory.slug,
        ...childCategories.map((cat) => cat.slug),
    ];

    // 単一リクエストで複数カテゴリを取得する（バックエンドが categories=slug1,slug2 をサポートしている想定）
    const combined = await getPublicPosts({
        page: 0,
        size: 1000,
        categories: categorySlugs.join(","),
    });

    // 全ての投稿を combined から取得
    const allPosts = combined.content;

    // 重複排除（同じ投稿が複数カテゴリに属する場合）
    const uniquePosts = Array.from(
        new Map(allPosts.map((post) => [post.id, post])).values()
    );

    // 公開日時でソート（新しい順）
    uniquePosts.sort(
        (a, b) =>
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
    );

    // ページネーション適用
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedPosts = uniquePosts.slice(startIndex, endIndex);

    return {
        content: paginatedPosts,
        totalPages: Math.ceil(uniquePosts.length / pageSize),
        totalElements: uniquePosts.length,
        pageable: {
            pageNumber: page,
            pageSize,
            sort: { sorted: true, unsorted: false, empty: false },
            offset: startIndex,
            paged: true,
            unpaged: false,
        },
        last: endIndex >= uniquePosts.length,
        size: pageSize,
        number: page,
        sort: { sorted: true, unsorted: false, empty: false },
        numberOfElements: paginatedPosts.length,
        first: page === 0,
        empty: paginatedPosts.length === 0,
    };
}
