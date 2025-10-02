"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Tag, TagCreateRequest, createTag, updateTag } from "@/lib/post-api";
import { toast } from "sonner";

interface TagFormProps {
    tag?: Tag | null;
    onSuccess: () => void;
    onDelete?: () => void;
}

export function TagForm({ tag, onSuccess, onDelete }: TagFormProps) {
    // フォーム入力状態
    const [name, setName] = useState(tag?.name || "");
    const [slug, setSlug] = useState(tag?.slug || "");

    // ローディング・ダイアログ状態
    const [loading, setLoading] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // タグが変更されたらフォームをリセット
    useEffect(() => {
        setName(tag?.name || "");
        setSlug(tag?.slug || "");
    }, [tag]);

    // スラッグ自動生成関数
    const generateSlug = (inputName: string) => {
        return inputName
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim();
    };

    // 名前変更時のハンドラ
    const handleNameChange = (value: string) => {
        setName(value);
        // 新規作成時のみスラッグを自動生成
        if (!tag) {
            setSlug(generateSlug(value));
        }
    };

    // フォーム送信ハンドラ
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // リクエストボディの構築
        const request: TagCreateRequest = {
            name: name.trim(),
            slug: slug.trim(),
        };

        try {
            if (tag) {
                // 更新
                await updateTag(tag.id, request);
                toast.success("タグを更新しました。");
            } else {
                // 作成
                await createTag(request);
                toast.success("タグを作成しました。");
            }
            onSuccess();
        } catch {
            toast.error(
                tag
                    ? "タグの更新に失敗しました。"
                    : "タグの作成に失敗しました。"
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
                        placeholder="例: プログラミング"
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
                        placeholder="例: programming"
                        required
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                        URLで使用される識別子です。
                    </p>
                </div>

                <div className="flex justify-between">
                    {tag && onDelete && (
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => setIsDeleteDialogOpen(true)}
                        >
                            削除
                        </Button>
                    )}
                    <Button
                        type="submit"
                        disabled={loading}
                        className="ml-auto"
                    >
                        {loading ? "保存中..." : tag ? "更新" : "作成"}
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
                            タグを削除しますか？
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            この操作は取り消すことができません。タグとその関連データが完全に削除されます。
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
