import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CategoryPublic } from "@/features/public/types";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";

interface CategoryTreeProps {
    categories: CategoryPublic[];
}

export default function CategoryTree({ categories }: CategoryTreeProps) {
    // デバッグ: カテゴリデータを確認
    console.log("All categories:", categories);
    categories.forEach((cat) => {
        console.log(
            `Category: ${cat.name} (id: ${cat.id}, parentId: ${
                cat.parentId
            }, type: ${typeof cat.parentId})`
        );
    });

    // 親カテゴリと子カテゴリに分類
    const parentCategories = categories.filter((cat) => cat.parentId === null);
    const childCategoriesMap = categories.reduce((acc, cat) => {
        if (cat.parentId !== null) {
            console.log(
                `Child category ${cat.name} has parentId: ${
                    cat.parentId
                } (type: ${typeof cat.parentId})`
            );
            if (!acc[cat.parentId]) {
                acc[cat.parentId] = [];
            }
            acc[cat.parentId].push(cat);
        }
        return acc;
    }, {} as Record<number, CategoryPublic[]>);

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {parentCategories.map((parent) => {
                const children = childCategoriesMap[parent.id] || [];

                return (
                    <Card key={parent.id}>
                        <CardHeader>
                            <Link
                                href={`/categories/${parent.slug}`}
                                className="group"
                            >
                                <CardTitle className="font-normal flex items-center gap-2 group-hover:text-primary transition-colors">
                                    {parent.name}
                                </CardTitle>
                                {parent.description && (
                                    <CardDescription className="mt-2">
                                        {parent.description}
                                    </CardDescription>
                                )}
                            </Link>

                            {/* 子カテゴリ */}
                            {children.length > 0 && (
                                <div className="mt-2 space-y-2 pt-2">
                                    {children.map((child) => (
                                        <Link
                                            key={child.id}
                                            href={`/categories/${child.slug}`}
                                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                            {child.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardHeader>
                    </Card>
                );
            })}
        </div>
    );
}
