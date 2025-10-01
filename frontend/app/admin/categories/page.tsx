import { CategoryList } from "@/components/admin/category/CategoryList";

export default function CategoriesPage() {
    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold">カテゴリ管理</h1>
            </div>
            <CategoryList />
        </div>
    );
}
