/**
 * 公開サイト用ヘッダーコンポーネント
 */

import Link from "next/link";
import { getPublicCategories } from "@/lib/api/public";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ClientHeaderActions } from "./ClientHeaderActions";

export async function PublicHeader() {
    // サーバーサイドでカテゴリを取得
    const categories = await getPublicCategories();
    // 1階層目（parentIdがnull）のカテゴリのみフィルタリング
    const topLevelCategories = categories.filter((cat) => !cat.parentId);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    {/* サイトロゴ */}
                    <Link href="/" className="flex space-x-2">
                        <span className="text-2xl font-bold text-foreground cursor-pointer">
                            {process.env.NEXT_PUBLIC_SITE_NAME}
                        </span>
                    </Link>

                    {/* デスクトップナビゲーション */}
                    {/* デスクトップナビゲーション中央揃え */}
                    <nav className="hidden md:flex items-center space-x-6 ml-auto">
                        {/* 1階層目のカテゴリを動的に表示 */}
                        {topLevelCategories.map((category) => (
                            <Link
                                key={category.id}
                                href={`/categories/${category.slug}`}
                                className="text-sm font-medium transition-colors hover:text-primary"
                            >
                                {category.name}
                            </Link>
                        ))}
                    </nav>
                    {/* テーマ切り替えボタンを右寄せで配置 */}
                    <div className="ml-auto flex items-center">
                        <ThemeToggle />
                    </div>

                    {/* モバイルメニュー - クライアントコンポーネント */}
                    <ClientHeaderActions
                        topLevelCategories={topLevelCategories}
                    />
                </div>
            </div>
        </header>
    );
}
