/**
 * 公開サイト用フッターコンポーネント
 */

import Link from "next/link";
import { getPublicCategories } from "@/lib/api/public";

export async function PublicFooter() {
    const currentYear = new Date().getFullYear();

    // サーバーサイドでカテゴリを取得
    const categories = await getPublicCategories();
    // 1階層目（parentIdがnull）のカテゴリのみフィルタリング
    const topLevelCategories = categories.filter((cat) => !cat.parentId);

    return (
        <footer className="bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    {/* サイト情報 */}
                    <div>
                        <h2 className="text-lg font-semibold mb-4">
                            {process.env.NEXT_PUBLIC_SITE_NAME}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Spring Boot と Next.js で構築する
                            <br />
                            CMS プラットフォーム
                        </p>
                    </div>

                    {/* リンク */}
                    <div>
                        <h2 className="text-lg font-semibold mb-4">
                            コンテンツ
                        </h2>
                        <div className="flex gap-10">
                            <ul className="space-y-2 text-sm">
                                <li>
                                    <Link
                                        href="/posts"
                                        className="text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        記事一覧
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/categories"
                                        className="text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        カテゴリ
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/tags"
                                        className="text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        タグ
                                    </Link>
                                </li>
                            </ul>

                            <ul className="space-y-2 text-sm">
                                {/* 1階層目のカテゴリを動的に表示 */}
                                {topLevelCategories.map((category) => (
                                    <li key={category.id}>
                                        <Link
                                            href={`/categories/${category.slug}`}
                                            className="text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            {category.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* コピーライト */}
                <div className="mt-8 mb-8">
                    <p className="text-xs text-muted-foreground">
                        &copy; {currentYear} {process.env.NEXT_PUBLIC_SITE_NAME}
                        . All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
