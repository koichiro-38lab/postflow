"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import type { TagSummary } from "@/lib/post-api";
import { createTag } from "@/lib/post-api";
import { toast } from "sonner";

interface TagComboboxProps {
    availableTags: TagSummary[];
    selectedTagIds: number[];
    onAddTag: (tagId: number) => void;
    isLoading: boolean;
}

function TagCombobox({
    availableTags,
    selectedTagIds,
    onAddTag,
    isLoading,
}: TagComboboxProps) {
    const [open, setOpen] = useState(false);

    if (availableTags.length === 0) {
        return null;
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    disabled={isLoading}
                >
                    タグを選択...
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command>
                    <CommandInput placeholder="タグを検索..." />
                    <CommandList>
                        <CommandEmpty>
                            該当するタグが見つかりません。
                        </CommandEmpty>
                        <CommandGroup>
                            {availableTags.map((tag) => (
                                <CommandItem
                                    key={tag.id}
                                    value={tag.name}
                                    onSelect={() => {
                                        onAddTag(tag.id);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedTagIds.includes(tag.id)
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
                                    {tag.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

interface TagSelectorProps {
    tags: TagSummary[];
    selectedTagIds: number[];
    onChange: (tagIds: number[]) => void;
    onTagCreated?: (tag: TagSummary) => void;
    isLoading?: boolean;
}

export function TagSelector({
    tags,
    selectedTagIds,
    onChange,
    onTagCreated,
    isLoading = false,
}: TagSelectorProps) {
    const [newTagName, setNewTagName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    // 選択済みタグを取得
    const selectedTags = tags.filter((tag) => selectedTagIds.includes(tag.id));

    // 未選択タグを取得
    const availableTags = tags.filter(
        (tag) => !selectedTagIds.includes(tag.id)
    );

    const handleAddTag = (tagId: number) => {
        console.log("タグ追加:", tagId, "現在の選択:", selectedTagIds);
        onChange([...selectedTagIds, tagId]);
    };

    const handleRemoveTag = (tagId: number) => {
        console.log("タグ削除:", tagId, "現在の選択:", selectedTagIds);
        onChange(selectedTagIds.filter((id) => id !== tagId));
    };

    // タグ名をスラッグに変換する関数
    const generateSlug = (name: string): string => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "") // 英数字とスペース、ハイフンのみ許可
            .replace(/\s+/g, "-") // スペースをハイフンに変換
            .replace(/-+/g, "-") // 連続するハイフンを単一に
            .trim();
    };

    const handleCreateTag = async () => {
        const trimmedName = newTagName.trim();
        if (!trimmedName) return;

        setIsCreating(true);
        try {
            const slug = generateSlug(trimmedName);
            const newTag = await createTag({
                name: trimmedName,
                slug: slug,
            });

            // 新しいタグを選択状態に追加
            onChange([...selectedTagIds, newTag.id]);

            // 親コンポーネントに新しいタグを通知（タグリストを更新するため）
            if (onTagCreated) {
                onTagCreated(newTag);
            }

            setNewTagName("");
            toast.success("タグを作成しました");
        } catch (error) {
            console.error("タグ作成エラー:", error);
            toast.error("タグの作成に失敗しました");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">タグ</label>
            {/* Combobox形式のタグ選択 */}
            <TagCombobox
                availableTags={availableTags}
                selectedTagIds={selectedTagIds}
                onAddTag={handleAddTag}
                isLoading={isLoading}
            />
            {/* 選択済みタグ */}
            {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {selectedTags.map((tag) => (
                        <Badge
                            key={tag.id}
                            variant="secondary"
                            className="flex items-center gap-1 text-sm font-normal"
                        >
                            {tag.name}
                            <button
                                type="button"
                                onClick={() => handleRemoveTag(tag.id)}
                                className="hover:bg-secondary-foreground/20 rounded-full p-1"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}

            {/* 新規タグ作成 */}
            <div className="flex gap-2 pt-4">
                <Input
                    placeholder="新規タグ名"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            handleCreateTag();
                        }
                    }}
                    className="flex-1"
                    disabled={isLoading || isCreating}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCreateTag}
                    disabled={!newTagName.trim() || isLoading || isCreating}
                >
                    <Plus
                        className={cn("h-4 w-4", isCreating && "animate-spin")}
                    />
                </Button>
            </div>
        </div>
    );
}
