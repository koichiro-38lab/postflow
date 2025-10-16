import { Metadata } from "next";
import CategoryTree from "@/components/public/CategoryTree";
import { getPublicCategories } from "@/lib/api/public";

export const metadata: Metadata = {
    title: "カテゴリ一覧",
    description: "記事をカテゴリ別に探す",
};

export default async function CategoriesPage() {
    // カテゴリ一覧を取得
    const categories = await getPublicCategories();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mt-8 mb-2">カテゴリ一覧</h1>
                <p className="text-muted-foreground">
                    記事をカテゴリ別に探すことができます
                </p>
            </div>

            {categories.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    カテゴリがまだありません
                </div>
            ) : (
                <CategoryTree categories={categories} />
            )}
        </div>
    );
}
