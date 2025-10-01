"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Category,
    CategoryCreateRequest,
    createCategory,
    updateCategory,
    fetchCategories,
} from "@/lib/post-api";
import { toast } from "sonner";

interface CategoryFormProps {
    category?: Category | null;
    onSuccess: () => void;
    onDelete?: () => void;
}

// カテゴリとその子孫を再帰的に収集する関数
const getCategoryAndDescendants = (
    categories: Category[],
    categoryId: number
): number[] => {
    const result = [categoryId];
    const children = categories.filter((cat) => cat.parent?.id === categoryId);

    children.forEach((child) => {
        result.push(...getCategoryAndDescendants(categories, child.id));
    });

    return result;
};

export function CategoryForm({
    category,
    onSuccess,
    onDelete,
}: CategoryFormProps) {
    const [name, setName] = useState(category?.name || "");
    const [slug, setSlug] = useState(category?.slug || "");
    const [parentId, setParentId] = useState<string | undefined>(
        category?.parent?.id?.toString()
    );
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const data = await fetchCategories();
                setCategories(data);
            } catch {
                // エラー時は親カテゴリ選択なしで続行
            }
        };
        loadCategories();
    }, []);

    const generateSlug = (inputName: string) => {
        return inputName
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim();
    };

    const handleNameChange = (value: string) => {
        setName(value);
        if (!category) {
            // 新規作成時のみ自動生成
            setSlug(generateSlug(value));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const request: CategoryCreateRequest = {
            name: name.trim(),
            slug: slug.trim(),
            parentId: parentId ? parseInt(parentId) : undefined,
        };

        try {
            if (category) {
                await updateCategory(category.id, request);
                toast.success("カテゴリを更新しました。");
            } else {
                await createCategory(request);
                toast.success("カテゴリを作成しました。");
            }
            onSuccess();
        } catch {
            toast.error(
                category
                    ? "カテゴリの更新に失敗しました。"
                    : "カテゴリの作成に失敗しました。"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="name" className="block mb-3">
                        名前
                    </Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <Label htmlFor="slug" className="block mb-3">
                        スラッグ
                    </Label>
                    <Input
                        id="slug"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        required
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                        URLで使用される識別子です。
                    </p>
                </div>

                <div>
                    <Label htmlFor="parent" className="block mb-3">
                        親カテゴリ
                    </Label>
                    <Select
                        value={parentId || "none"}
                        onValueChange={(value) =>
                            setParentId(value === "none" ? undefined : value)
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="選択なし" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">選択なし</SelectItem>
                            {categories
                                .filter((cat) => {
                                    // 編集モードの場合、自分自身と子孫を除外
                                    if (category) {
                                        const excludedIds =
                                            getCategoryAndDescendants(
                                                categories,
                                                category.id
                                            );
                                        return !excludedIds.includes(cat.id);
                                    }
                                    return true;
                                })
                                .map((cat) => (
                                    <SelectItem
                                        key={cat.id}
                                        value={cat.id.toString()}
                                    >
                                        {cat.name}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex justify-between">
                    {category && onDelete && (
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => setIsDeleteDialogOpen(true)}
                        >
                            削除
                        </Button>
                    )}
                    <Button type="submit" disabled={loading}>
                        {loading ? "保存中..." : category ? "更新" : "作成"}
                    </Button>
                </div>
            </form>

            <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            カテゴリを削除しますか？
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            この操作は取り消すことができません。カテゴリとその関連データが完全に削除されます。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (onDelete) {
                                    await onDelete();
                                }
                                setIsDeleteDialogOpen(false);
                            }}
                        >
                            削除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
