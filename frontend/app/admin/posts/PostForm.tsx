"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { isApiError } from "@/lib/api";
import api from "@/lib/api";
import { fetchCategories, CategorySummary } from "@/lib/post-api";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { TipTapEditor } from "@/components/TipTapEditor";
import { MediaPickerDialog } from "@/components/admin/media/MediaPickerDialog";
import type { SucceededMediaItem } from "@/features/admin/media/types";
import Image from "next/image";
import { buildMediaUrl } from "@/lib/media-url";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Save, ArrowLeft, Trash2, CalendarIcon } from "lucide-react";
import Link from "next/link";

const postSchema = z.object({
    title: z
        .string()
        .min(1, "タイトルは必須です")
        .max(200, "タイトルは200文字以内で入力してください"),
    slug: z
        .string()
        .min(1, "スラッグは必須です")
        .max(100, "スラッグは100文字以内で入力してください"),
    content: z.string().min(1, "本文は必須です"),
    excerpt: z
        .string()
        .max(500, "概要は500文字以内で入力してください")
        .optional(),
    categoryId: z.string().optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
    publishedAt: z.string().optional(),
});

export type PostFormData = z.infer<typeof postSchema>;

interface PostFormProps {
    mode: "new" | "edit";
    postId?: number;
    initialData?: Partial<PostFormData>;
    // 初期カバー画像ID（編集時に渡す）
    initialCoverMediaId?: number | null;
    // 初期カバー画像プレビューURL（編集時に渡す）
    initialCoverPreviewUrl?: string | null;
}

const toUtcISOString = (date: Date) => date.toISOString();

export default function PostForm({ mode, postId, initialData, initialCoverMediaId = null, initialCoverPreviewUrl = null, }: PostFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categories, setCategories] = useState<CategorySummary[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    // カバー画像ID（送信用）
    const [coverMediaId, setCoverMediaId] = useState<number | null>(initialCoverMediaId);
    // カバー画像プレビューURL
    const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(initialCoverPreviewUrl);
    // カバー画像のメディアピッカー表示状態
    const [coverPickerOpen, setCoverPickerOpen] = useState(false);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const fetchedCategories = await fetchCategories();
                setCategories(fetchedCategories);
            } catch (error) {
                console.error("Failed to load categories:", error);
                // 認証系はグローバルで扱う。ここでは一般エラーのみ表示
                if (!(isApiError(error) && error.response?.status === 401)) {
                    toast({
                        title: "エラー",
                        description: "カテゴリの読み込みに失敗しました。",
                        variant: "destructive",
                    });
                }
            } finally {
                setIsLoadingCategories(false);
            }
        };

        loadCategories();
    }, [toast]);

    // statusがnull/undefined/空文字なら"DRAFT"をセット
    const safeInitialData = initialData
        ? {
              ...initialData,
              status: initialData.status != null ? initialData.status : "DRAFT",
          }
        : undefined;
    const form = useForm<PostFormData>({
        resolver: zodResolver(postSchema),
        defaultValues: safeInitialData || {
            title: "",
            slug: "",
            content: '{"type":"doc","content":[]}',
            excerpt: "",
            categoryId: "",
            status: "DRAFT",
            publishedAt: "",
        },
    });

    const onSubmit = async (data: PostFormData) => {
        // トークンチェックはグローバル処理に任せる
        setIsSubmitting(true);
        try {
            // /api/admin/users/me から現在のユーザー情報を取得
            const meRes = await api.get("/api/admin/users/me");
            const me = meRes.data;

            const requestData = {
                title: data.title,
                slug: data.slug,
                status: data.status,
                excerpt: data.excerpt || null,
                contentJson: data.content,
                categoryId: data.categoryId ? parseInt(data.categoryId) : null,
                authorId: me.id,
                coverMediaId: coverMediaId ?? null,
                publishedAt:
                    data.status === "PUBLISHED" && !data.publishedAt
                        ? toUtcISOString(new Date())
                        : data.publishedAt || null,
            };

            let response;
            if (mode === "edit" && postId) {
                response = await api.put(
                    `/api/admin/posts/${postId}`,
                    requestData
                );
            } else {
                response = await api.post("/api/admin/posts", requestData);
            }

            const result = response.data;
            if (mode === "new") {
                router.push(`/admin/posts/${result.id}/edit`);
            } else {
                toast({
                    title: "成功",
                    description: "保存しました",
                });
            }
        } catch (error) {
            console.error("投稿保存エラー:", error);
            // 認証はグローバル処理に任せる
            if (!(isApiError(error) && error.response?.status === 401)) {
                toast({
                    title: "エラー",
                    description: "投稿の保存に失敗しました",
                    variant: "destructive",
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // カバー画像選択時の処理
    const handleSelectCover = useCallback((item: SucceededMediaItem) => {
        setCoverMediaId(item.id);
        const src = item.publicUrl ?? buildMediaUrl(item.storageKey) ?? null;
        setCoverPreviewUrl(src ?? null);
        setCoverPickerOpen(false);
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "s") {
                event.preventDefault();
                form.handleSubmit(onSubmit)();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    });

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
                <h2 className="text-2xl font-bold mb-6">
                    {mode === "edit" ? "投稿を編集" : "新規投稿"}
                </h2>
                <Link href="/admin/posts">
                    <Button variant="outline" className="mb-2">
                        <ArrowLeft className="h-4 w-1" />
                        記事一覧に戻る
                    </Button>
                </Link>
            </div>
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                >
                    <Card>
                        <CardContent className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <FormLabel>カバー画像</FormLabel>
                                <div className="grid gap-3 md:grid-cols-[auto_auto] md:items-start">
                                    <div className="relative overflow-hidden rounded-md border bg-muted w-[180px] h-[102px] md:w-[224px] md:h-[126px] justify-self-start">
                                        {coverPreviewUrl ? (
                                            <Image
                                                src={coverPreviewUrl}
                                                alt="カバー画像"
                                                fill
                                                sizes="(min-width: 1024px) 224px, 180px"
                                                className="object-contain"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                                                カバー画像が未選択
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2 md:flex-col">
                                        <Button type="button" variant="outline" onClick={() => setCoverPickerOpen(true)}>
                                            メディアから選択
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => {
                                                setCoverMediaId(null);
                                                setCoverPreviewUrl(null);
                                            }}
                                            disabled={!coverMediaId}
                                        >
                                            クリア
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>タイトル *</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="記事のタイトルを入力"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="slug"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>スラッグ *</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="URLに使用される識別子"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="categoryId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>カテゴリ</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="カテゴリを選択" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {isLoadingCategories ? (
                                                        <SelectItem
                                                            value="loading"
                                                            disabled
                                                        >
                                                            カテゴリを読み込み中...
                                                        </SelectItem>
                                                    ) : (
                                                        categories.map(
                                                            (category) => (
                                                                <SelectItem
                                                                    key={
                                                                        category.id
                                                                    }
                                                                    value={category.id.toString()}
                                                                >
                                                                    {
                                                                        category.name
                                                                    }
                                                                </SelectItem>
                                                            )
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>公開設定 *</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="DRAFT">
                                                        下書き
                                                    </SelectItem>
                                                    <SelectItem value="PUBLISHED">
                                                        公開
                                                    </SelectItem>
                                                    <SelectItem value="ARCHIVED">
                                                        アーカイブ
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="publishedAt"
                                render={({ field }) => {
                                    const selectedDate = field.value
                                        ? new Date(field.value)
                                        : undefined;

                                    const handleDateSelect = (date?: Date) => {
                                        if (!date) {
                                            field.onChange("");
                                            return;
                                        }
                                        const base = selectedDate ?? new Date();
                                        const next = new Date(date);
                                        next.setHours(
                                            base.getHours(),
                                            base.getMinutes(),
                                            0,
                                            0
                                        );
                                        field.onChange(toUtcISOString(next));
                                    };

                                    const handleTimeChange = (
                                        event: React.ChangeEvent<HTMLInputElement>
                                    ) => {
                                        const value = event.target.value;
                                        if (!value) {
                                            field.onChange("");
                                            return;
                                        }
                                        const [hourStr, minuteStr] =
                                            value.split(":");
                                        const hours = Number(hourStr);
                                        const minutes = Number(minuteStr);
                                        if (
                                            Number.isNaN(hours) ||
                                            Number.isNaN(minutes)
                                        ) {
                                            return;
                                        }
                                        const base = selectedDate ?? new Date();
                                        const next = new Date(base);
                                        next.setHours(hours, minutes, 0, 0);
                                        field.onChange(toUtcISOString(next));
                                    };

                                    return (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>公開日時</FormLabel>
                                            <Popover
                                                open={isDatePickerOpen}
                                                onOpenChange={
                                                    setIsDatePickerOpen
                                                }
                                            >
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "justify-start text-left font-normal",
                                                            !selectedDate &&
                                                                "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {selectedDate
                                                            ? format(
                                                                  selectedDate,
                                                                  "yyyy年MM月dd日 HH:mm"
                                                              )
                                                            : "公開日時を選択"}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-auto p-0"
                                                    align="start"
                                                >
                                                    <Calendar
                                                        mode="single"
                                                        selected={selectedDate}
                                                        locale={ja}
                                                        onSelect={
                                                            handleDateSelect
                                                        }
                                                        initialFocus
                                                    />
                                                    <div className="border-t p-3 space-y-3">
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                type="time"
                                                                value={
                                                                    selectedDate
                                                                        ? format(
                                                                              selectedDate,
                                                                              "HH:mm"
                                                                          )
                                                                        : ""
                                                                }
                                                                onChange={
                                                                    handleTimeChange
                                                                }
                                                            />
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    field.onChange(
                                                                        ""
                                                                    );
                                                                    setIsDatePickerOpen(
                                                                        false
                                                                    );
                                                                }}
                                                            >
                                                                クリア
                                                            </Button>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            未入力の場合は保存時に現在時刻が設定されます。
                                                        </p>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    );
                                }}
                            />
                            <FormField
                                control={form.control}
                                name="excerpt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>概要</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="記事の概要を入力（オプション）"
                                                rows={3}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="content"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <TipTapEditor
                                                content={field.value}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                    <div className="flex justify-end space-x-2">
                        {mode === "edit" && (
                            <Button
                                type="button"
                                variant="destructive"
                                className="mr-auto"
                                disabled={isSubmitting}
                                onClick={() =>
                                    toast({
                                        title: "情報",
                                        description: "削除機能は未実装です",
                                    })
                                }
                            >
                                <Trash2 className="h-4 w-1 mr-1" />
                                削除
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push("/admin/posts")}
                        >
                            キャンセル
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            <Save className="h-4 w-4" />
                            {isSubmitting ? "保存中..." : "保存"}
                        </Button>
                    </div>
                </form>
            </Form>
            <MediaPickerDialog
                open={coverPickerOpen}
                onOpenChange={setCoverPickerOpen}
                onSelect={handleSelectCover}
            />
        </div>
    );
}
