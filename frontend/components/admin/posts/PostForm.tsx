"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { isApiError } from "@/lib/api";
import api from "@/lib/api";
import { fetchCategories } from "@/lib/api/admin/categories";
import { fetchTags } from "@/lib/api/admin/tags";
import type { CategorySummary, TagSummary } from "@/lib/types/common";
import { buildCategoryTree, CategoryWithLevel } from "@/lib/category-utils";
import { cn } from "@/lib/utils";
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
import { TipTapEditor } from "@/components/admin/tiptap/TipTapEditor";
import { MediaPickerDialog } from "@/components/admin/media/MediaPickerDialog";
import { TagSelector } from "@/components/admin/tags/TagSelector";
import type { SucceededMediaItem } from "@/features/admin/media/types";
import Image from "next/image";
import { buildMediaUrl } from "@/lib/media-url";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
    Save,
    ArrowLeft,
    Trash2,
    CalendarIcon,
    ImageIcon,
    X,
    Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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
    tagIds: z.array(z.number()).optional(),
});

export type PostFormData = z.infer<typeof postSchema>;

interface PostFormProps {
    mode: "new" | "edit";
    postId?: number;
    initialData?: Partial<PostFormData> & {
        tags?: Array<{ id: number; name: string; slug: string }>;
    };
    // 初期カバー画像ID（編集時に渡す）
    initialCoverMediaId?: number | null;
    // 初期カバー画像プレビューURL（編集時に渡す）
    initialCoverPreviewUrl?: string | null;
    // 初期投稿者名（編集時に渡す）
    initialAuthorName?: string;
}

const toUtcISOString = (date: Date) => date.toISOString();

export default function PostForm({
    mode,
    postId,
    initialData,
    initialCoverMediaId = null,
    initialCoverPreviewUrl = null,
    initialAuthorName = "",
}: PostFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categories, setCategories] = useState<CategorySummary[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [tags, setTags] = useState<TagSummary[]>([]);
    const [isLoadingTags, setIsLoadingTags] = useState(true);
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    // 削除確認ダイアログの表示状態
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    // 削除処理中のローディング状態
    const [isDeleting, setIsDeleting] = useState(false);
    // カバー画像ID（送信用）
    const [coverMediaId, setCoverMediaId] = useState<number | null>(
        initialCoverMediaId
    );
    // カバー画像プレビューURL
    const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(
        initialCoverPreviewUrl
    );
    // カバー画像のメディアピッカー表示状態
    const [coverPickerOpen, setCoverPickerOpen] = useState(false);
    // 投稿者情報
    const [authorName, setAuthorName] = useState<string>("");
    const [isLoadingAuthor, setIsLoadingAuthor] = useState(true);
    // ユーザー情報（ロール判定用）
    const [userRole, setUserRole] = useState<string>("");
    const [isLoadingUser, setIsLoadingUser] = useState(true);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const fetchedCategories = await fetchCategories();
                setCategories(fetchedCategories);
            } catch (error) {
                console.error("Failed to load categories:", error);
                // 認証系はグローバルで扱う。ここでは一般エラーのみ表示
                if (!(isApiError(error) && error.response?.status === 401)) {
                    toast.error("カテゴリの読み込みに失敗しました");
                }
            } finally {
                setIsLoadingCategories(false);
            }
        };

        loadCategories();
    }, []);

    // 編集モードで初期投稿者名がある場合はそれを使用
    useEffect(() => {
        if (mode === "edit" && initialAuthorName) {
            setAuthorName(initialAuthorName);
            setIsLoadingAuthor(false);
        }
    }, [mode, initialAuthorName]);

    // ユーザー情報とロールを取得（新規作成時の投稿者名取得とロール判定用）
    useEffect(() => {
        const loadUserInfo = async () => {
            try {
                const meRes = await api.get("/api/admin/users/me");
                const me = meRes.data;

                // ユーザーロールを設定
                setUserRole(me.role || "");

                // 新規作成時は現在のユーザー情報を投稿者として使用
                if (mode === "new") {
                    setAuthorName(me.displayName || me.username || "不明");
                    setIsLoadingAuthor(false);
                }
            } catch (error) {
                console.error("Failed to load user info:", error);
                if (!(isApiError(error) && error.response?.status === 401)) {
                    toast.error("ユーザー情報の読み込みに失敗しました");
                }
            } finally {
                setIsLoadingUser(false);
            }
        };

        loadUserInfo();
    }, [mode]);

    useEffect(() => {
        const loadTags = async () => {
            try {
                const fetchedTags = await fetchTags();
                console.log("取得されたタグ:", fetchedTags);
                setTags(fetchedTags);
            } catch (error) {
                console.error("Failed to load tags:", error);
                if (!(isApiError(error) && error.response?.status === 401)) {
                    toast.error("タグの読み込みに失敗しました");
                }
            } finally {
                setIsLoadingTags(false);
            }
        };

        loadTags();
    }, []);

    // statusがnull/undefined/空文字なら"DRAFT"をセット
    const safeInitialData = initialData
        ? {
              ...initialData,
              status: initialData.status != null ? initialData.status : "DRAFT",
          }
        : undefined;

    // 初期タグIDを設定
    useEffect(() => {
        if (initialData?.tags && initialData.tags.length > 0) {
            const tagIds = initialData.tags.map((tag) => tag.id);
            console.log(
                "初期データのタグ:",
                initialData.tags,
                "抽出されたタグID:",
                tagIds
            );
            setSelectedTagIds(tagIds);
        }
    }, [initialData?.tags]);
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
            tagIds: [],
        },
    });

    // selectedTagIds が変わったら form の tagIds を更新
    useEffect(() => {
        console.log("selectedTagIds変更:", selectedTagIds);
        form.setValue("tagIds", selectedTagIds);
    }, [selectedTagIds, form]);

    // デバウンス用 refs
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const latestFormDataRef = useRef<PostFormData | null>(null);

    // 実際の保存処理（遅延実行側）
    const performSave = useCallback(
        async (data: PostFormData) => {
            try {
                const requestData: Record<string, unknown> = {
                    title: data.title,
                    slug: data.slug,
                    status: data.status,
                    excerpt: data.excerpt || null,
                    contentJson: data.content,
                    categoryId: data.categoryId
                        ? parseInt(data.categoryId)
                        : null,
                    coverMediaId: coverMediaId ?? null,
                    tagIds: selectedTagIds,
                    publishedAt:
                        data.status === "PUBLISHED" && !data.publishedAt
                            ? toUtcISOString(new Date())
                            : data.publishedAt || null,
                };

                // 新規作成時のみauthorIdを送信（編集時は既存のauthorを保持）
                if (mode === "new") {
                    const meRes = await api.get("/api/admin/users/me");
                    const me = meRes.data;
                    requestData.authorId = me.id;
                }

                console.log("送信データ:", requestData);
                console.log("選択されたタグID:", selectedTagIds);

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
                    toast.success("保存しました");
                }
            } catch (error) {
                console.error("投稿保存エラー:", error);
                // 認証はグローバル処理に任せる
                if (!(isApiError(error) && error.response?.status === 401)) {
                    toast.error("投稿の保存に失敗しました");
                }
            } finally {
                setIsSubmitting(false);
            }
        },
        [coverMediaId, selectedTagIds, mode, postId, router]
    );

    // デバウンスされた onSubmit（呼び出しはここから）
    const onSubmit = useCallback(
        (data: PostFormData) => {
            // 既存のタイマーがあればクリアして最新データを保存対象にする
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            latestFormDataRef.current = data;
            // ボタン等の無効化はスケジュール時点で行う
            setIsSubmitting(true);
            saveTimeoutRef.current = setTimeout(() => {
                const latest = latestFormDataRef.current;
                if (latest) {
                    performSave(latest);
                }
                saveTimeoutRef.current = null;
            }, 500);
        },
        [performSave]
    );

    // コンポーネントアンマウント時はタイマーをクリア
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
                saveTimeoutRef.current = null;
            }
        };
    }, []);

    // 投稿削除処理
    const handleDelete = async () => {
        if (!postId) return;

        setIsDeleting(true);
        try {
            await api.delete(`/api/admin/posts/${postId}`);
            toast.success("投稿を削除しました");
            router.push("/admin/posts");
        } catch (error) {
            console.error("投稿削除エラー:", error);
            if (!(isApiError(error) && error.response?.status === 401)) {
                toast.error("投稿の削除に失敗しました");
            }
        } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
        }
    };

    // カバー画像選択時の処理
    const handleSelectCover = useCallback((item: SucceededMediaItem) => {
        setCoverMediaId(item.id);
        const src = item.publicUrl ?? buildMediaUrl(item.storageKey) ?? null;
        setCoverPreviewUrl(src ?? null);
        setCoverPickerOpen(false);
    }, []);

    // フォーム全体のキーボードショートカット(Ctrl+S / Cmd+S)による保存
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
                        <CardContent className="mt-4 grid grid-cols-1 md:grid-cols-[3fr_1fr] gap-6">
                            {/* 左カラム: メインコンテンツ */}
                            <div className="space-y-4">
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
                            </div>
                            {/* 右カラム: サイドバー */}
                            <div
                                className="space-y-4 sticky self-start"
                                style={{ top: 72 }}
                            >
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
                                                    未選択
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2 md:flex-col">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size={"sm"}
                                                onClick={() =>
                                                    setCoverPickerOpen(true)
                                                }
                                            >
                                                <ImageIcon className="h-4 w-4" />
                                                画像を選択
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size={"sm"}
                                                onClick={() => {
                                                    setCoverMediaId(null);
                                                    setCoverPreviewUrl(null);
                                                }}
                                                disabled={!coverMediaId}
                                            >
                                                <X className="h-4 w-4" />
                                                削除
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <FormLabel>投稿者</FormLabel>
                                    <div className="text-sm text-muted-foreground">
                                        {isLoadingAuthor ? "" : authorName}
                                    </div>
                                </div>
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
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>公開設定 *</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                                disabled={
                                                    isLoadingUser ||
                                                    (userRole !== "ADMIN" &&
                                                        userRole !== "EDITOR")
                                                }
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
                                <FormField
                                    control={form.control}
                                    name="publishedAt"
                                    render={({ field }) => {
                                        const selectedDate = field.value
                                            ? new Date(field.value)
                                            : undefined;

                                        const handleDateSelect = (
                                            date?: Date
                                        ) => {
                                            if (!date) {
                                                field.onChange("");
                                                return;
                                            }
                                            const base =
                                                selectedDate ?? new Date();
                                            const next = new Date(date);
                                            next.setHours(
                                                base.getHours(),
                                                base.getMinutes(),
                                                0,
                                                0
                                            );
                                            field.onChange(
                                                toUtcISOString(next)
                                            );
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
                                            const base =
                                                selectedDate ?? new Date();
                                            const next = new Date(base);
                                            next.setHours(hours, minutes, 0, 0);
                                            field.onChange(
                                                toUtcISOString(next)
                                            );
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
                                                            disabled={
                                                                isLoadingUser ||
                                                                (userRole !==
                                                                    "ADMIN" &&
                                                                    userRole !==
                                                                        "EDITOR")
                                                            }
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
                                                            selected={
                                                                selectedDate
                                                            }
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
                                                        buildCategoryTree(
                                                            categories
                                                        ).map(
                                                            (
                                                                category: CategoryWithLevel
                                                            ) => (
                                                                <SelectItem
                                                                    key={
                                                                        category.id
                                                                    }
                                                                    value={category.id.toString()}
                                                                    className="text-sm"
                                                                >
                                                                    <span className="flex items-center">
                                                                        {/* 階層レベルに応じてインデント */}
                                                                        {Array.from(
                                                                            {
                                                                                length: category.level,
                                                                            }
                                                                        ).map(
                                                                            (
                                                                                _,
                                                                                i
                                                                            ) => (
                                                                                <span
                                                                                    key={
                                                                                        i
                                                                                    }
                                                                                    className="inline-block w-4"
                                                                                />
                                                                            )
                                                                        )}
                                                                        {category.level >
                                                                            0 && (
                                                                            <span className="text-muted-foreground mr-2">
                                                                                └
                                                                            </span>
                                                                        )}
                                                                        {
                                                                            category.name
                                                                        }
                                                                    </span>
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
                                <TagSelector
                                    tags={tags}
                                    selectedTagIds={selectedTagIds}
                                    onChange={setSelectedTagIds}
                                    onTagCreated={(newTag) => {
                                        // 新しく作成されたタグをtagsリストに追加
                                        setTags((prev) => [...prev, newTag]);
                                    }}
                                    isLoading={isLoadingTags}
                                    allowCreate={
                                        userRole === "ADMIN" ||
                                        userRole === "EDITOR"
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>
                    <div className="flex justify-end space-x-2">
                        {mode === "edit" && (
                            <Button
                                type="button"
                                variant="destructive"
                                className="mr-auto"
                                disabled={isSubmitting || isDeleting}
                                onClick={() => setIsDeleteDialogOpen(true)}
                            >
                                <Trash2 className="h-4 w-4 mr-1" />
                                {isDeleting ? "削除中..." : "削除"}
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
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            保存
                        </Button>
                    </div>
                </form>
            </Form>

            {/* メディアピッカーダイアログ */}
            <MediaPickerDialog
                open={coverPickerOpen}
                onOpenChange={setCoverPickerOpen}
                onSelect={handleSelectCover}
            />

            {/* 削除確認ダイアログ */}
            <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            投稿を削除しますか？
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            この操作は元に戻すことができません。投稿と関連するデータが完全に削除されます。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                            キャンセル
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "削除中..." : "削除"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
