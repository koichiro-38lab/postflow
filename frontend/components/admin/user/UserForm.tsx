"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MediaPickerDialog } from "@/components/admin/media/MediaPickerDialog";
import type { SucceededMediaItem } from "@/features/admin/media/types";
import { fetchMediaDetail, MediaResponse } from "@/lib/media-api";
import { buildMediaUrl } from "@/lib/media-url";
import { ImageIcon, X, Save, Loader2 } from "lucide-react";
import type {
    UserResponse,
    UserProfileResponse,
    UserRole,
    UserStatus,
} from "@/lib/user-api";
import {
    getUserStatusLabel,
    getUserRoleLabel,
    USER_STATUS_LABELS,
} from "@/lib/user-utils";

// フォームモード定義
export type UserFormMode = "create" | "update";

// 基本ユーザーフォームスキーマ
const baseUserFormSchema = z.object({
    displayName: z
        .string()
        .min(1, "表示名は必須です")
        .max(100, "表示名は100文字以内で入力してください"),
    email: z.string().email("有効なメールアドレスを入力してください"),
    bio: z.string().max(5000, "自己紹介は5000文字以内で入力してください"),
    avatarMediaId: z.number().nullable(),
    role: z.enum(["ADMIN", "EDITOR", "AUTHOR"]),
    status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "DELETED"]),
});

// 作成用スキーマ（パスワード必須）
const createUserFormSchema = baseUserFormSchema
    .extend({
        password: z.string().min(8, "パスワードは8文字以上で入力してください"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "パスワードが一致しません",
        path: ["confirmPassword"],
    });

// 更新用スキーマ（パスワード任意）
const updateUserFormSchema = baseUserFormSchema
    .extend({
        password: z.string().optional().or(z.literal("")),
        confirmPassword: z.string().optional().or(z.literal("")),
    })
    .refine(
        (data) => {
            if (data.password || data.confirmPassword) {
                return (
                    data.password === data.confirmPassword &&
                    (data.password?.length ?? 0) >= 8
                );
            }
            return true;
        },
        {
            message:
                "パスワードは8文字以上で、確認用パスワードと一致している必要があります",
            path: ["confirmPassword"],
        }
    );

export type CreateUserFormData = z.infer<typeof createUserFormSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserFormSchema>;
export type UserFormData = CreateUserFormData | UpdateUserFormData;

interface UserFormProps {
    mode: UserFormMode;
    title: string;
    onSubmit: (data: UserFormData) => Promise<void>;
    defaultValues?: Partial<UserFormData>;
    existingUser?: UserResponse | UserProfileResponse | null;
    submitLabel?: string;
    showCancel?: boolean;
    onCancel?: () => void;
    // 現在のユーザーID（自分のプロフィール編集時にロール・ステータスを非表示にするため）
    currentUserId?: number | null;
}

export function UserForm({
    mode,
    title,
    onSubmit,
    defaultValues,
    existingUser,
    submitLabel,
    showCancel = false,
    onCancel,
    currentUserId,
}: UserFormProps) {
    // フォーム送信状態管理
    const [isSubmitting, setIsSubmitting] = useState(false);

    // アバター関連の状態
    const [avatarStorageKey, setAvatarStorageKey] = useState<string | null>(
        null
    );
    const [avatarMedia, setAvatarMedia] = useState<MediaResponse | null>(null);

    // メディアピッカーダイアログの表示状態
    const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

    // 自分のプロフィール編集かどうか判定
    // 自分のプロフィール編集時はロール・ステータス変更を許可しない
    const isOwnProfile =
        currentUserId !== null &&
        existingUser !== null &&
        existingUser !== undefined &&
        existingUser.id === currentUserId;

    // パスワード欄の表示可否
    const canEditPassword = !isOwnProfile;

    // モードに応じたスキーマ選択
    const schema =
        mode === "create" ? createUserFormSchema : updateUserFormSchema;

    // デフォルト値の設定
    const defaultFormValues = {
        displayName:
            defaultValues?.displayName || existingUser?.displayName || "",
        email: defaultValues?.email || existingUser?.email || "",
        bio:
            defaultValues?.bio ||
            (existingUser && "bio" in existingUser ? existingUser.bio : "") ||
            "",
        avatarMediaId:
            defaultValues?.avatarMediaId || existingUser?.avatarMediaId || null,
        role: (defaultValues?.role ||
            existingUser?.role ||
            "AUTHOR") as UserRole,
        status: (defaultValues?.status ||
            existingUser?.status ||
            "ACTIVE") as UserStatus,
        password: defaultValues?.password || "",
        confirmPassword: defaultValues?.confirmPassword || "",
    };

    // フォーム初期化
    const form = useForm<UserFormData>({
        resolver: zodResolver(schema),
        defaultValues: defaultFormValues,
    });

    // フォームの値を監視
    const avatarMediaId = form.watch("avatarMediaId") as number | null;
    const displayName = form.watch("displayName") as string;
    const email = form.watch("email") as string;

    // アバター情報の取得
    useEffect(() => {
        const loadAvatarInfo = async () => {
            if (avatarMediaId) {
                try {
                    const media = await fetchMediaDetail(avatarMediaId);
                    setAvatarMedia(media);
                    setAvatarStorageKey(media.storageKey);
                } catch (error) {
                    console.warn("Avatar media fetch failed:", error);
                    setAvatarStorageKey(null);
                    setAvatarMedia(null);
                }
            } else {
                setAvatarStorageKey(null);
                setAvatarMedia(null);
            }
        };

        loadAvatarInfo();
    }, [avatarMediaId]);

    // メディア選択ハンドラ
    const handleMediaSelect = (item: SucceededMediaItem) => {
        form.setValue("avatarMediaId", item.id);
        setAvatarStorageKey(item.storageKey);
        setMediaPickerOpen(false);
        toast.success("アバター画像を選択しました");
    };

    // アバター削除ハンドラ
    const handleRemoveAvatar = () => {
        form.setValue("avatarMediaId", null);
        setAvatarStorageKey(null);
        setAvatarMedia(null);
        toast.success("アバター画像を削除しました");
    };

    // アバター画像URLを取得
    const getAvatarUrl = () => {
        if (avatarMedia) {
            return (
                avatarMedia.publicUrl ?? buildMediaUrl(avatarMedia.storageKey)
            );
        }
        if (avatarStorageKey) {
            return buildMediaUrl(avatarStorageKey);
        }
        return null;
    };

    // ユーザーのイニシャルを取得
    const getInitials = () => {
        if (displayName) {
            return displayName.charAt(0).toUpperCase();
        }
        if (email) {
            return email.charAt(0).toUpperCase();
        }
        return "U";
    };

    // フォーム送信処理
    // マウント状態の参照（アンマウント後に非同期処理が続行するのを防ぐ）
    const isMountedRef = useRef(true);
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // 即時の多重送信を防ぐための ref（state 更新は非同期なので ref を使う）
    const isSubmittingRef = useRef(false);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleFormSubmit = (data: UserFormData) => {
        // 実際に送信処理が走っていれば新しい要求は無視
        if (isSubmittingRef.current) return;

        // 既存のタイマーをクリアして最新の data でスケジュール
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // UI はスケジュール時点で送信中表示にする
        setIsSubmitting(true);

        saveTimeoutRef.current = setTimeout(async () => {
            // 実際の送信を開始
            isSubmittingRef.current = true;

            try {
                if (!isMountedRef.current) return;
                await onSubmit(data);
            } catch (error) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "予期しないエラーが発生しました";
                toast.error(errorMessage);
            } finally {
                if (isMountedRef.current) {
                    setIsSubmitting(false);
                }
                isSubmittingRef.current = false;
                if (saveTimeoutRef.current) {
                    clearTimeout(saveTimeoutRef.current);
                    saveTimeoutRef.current = null;
                }
            }
        }, 500);
    };

    // アンマウント時にタイマーをクリア
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
                saveTimeoutRef.current = null;
            }
            isSubmittingRef.current = false;
        };
    }, []);

    // Ctrl/Cmd+S で保存するショートカットを追加
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "s") {
                event.preventDefault();
                form.handleSubmit(handleFormSubmit)();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    });

    return (
        <div className="mx-auto">
            <h2 className="text-2xl font-bold mb-6">{title}</h2>

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(handleFormSubmit)}
                    className="space-y-6"
                >
                    <div className="p-6 border rounded-lg grid lg:gap-8 md:grid-cols-[300px_1fr_1fr]">
                        {/* アバター画像 */}
                        <div className="space-y-2">
                            <div className="items-center gap-4">
                                <Avatar className="h-64 w-64 mx-auto">
                                    <AvatarImage
                                        src={getAvatarUrl() || undefined}
                                        alt={displayName || email}
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="text-2xl">
                                        {getInitials()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex gap-2 my-6 justify-center">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setMediaPickerOpen(true)}
                                    >
                                        <ImageIcon className="h-4 w-4" />
                                        画像を選択
                                    </Button>
                                    {avatarMediaId && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleRemoveAvatar}
                                        >
                                            <X className="h-4 w-4" />
                                            削除
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            {/* 既存ユーザーの場合の情報表示 */}
                            {existingUser && (
                                <div className="text-sm flex flex-col gap-2 mb-4">
                                    <div>
                                        <span className="text-muted-foreground">
                                            ステータス:
                                        </span>
                                        <span className="ml-2 font-medium">
                                            {getUserStatusLabel(
                                                existingUser.status
                                            )}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            ロール:
                                        </span>
                                        <span className="ml-2 font-medium">
                                            {getUserRoleLabel(
                                                existingUser.role
                                            )}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">
                                            登録日:
                                        </span>
                                        <span className="ml-2 font-medium">
                                            {new Date(
                                                existingUser.createdAt + "Z"
                                            ).toLocaleString("ja-JP", {
                                                timeZone: "Asia/Tokyo",
                                                year: "numeric",
                                                month: "2-digit",
                                                day: "2-digit",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                    </div>
                                    {existingUser.lastLoginAt && (
                                        <div>
                                            <span className="text-muted-foreground">
                                                最終ログイン:
                                            </span>
                                            <span className="ml-2 font-medium">
                                                {new Date(
                                                    existingUser.lastLoginAt +
                                                        "Z"
                                                ).toLocaleString("ja-JP", {
                                                    timeZone: "Asia/Tokyo",
                                                    year: "numeric",
                                                    month: "2-digit",
                                                    day: "2-digit",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* メールアドレス */}
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem className="mb-4">
                                        <FormLabel>メールアドレス</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="メールアドレスを入力"
                                                disabled={mode === "update"}
                                                className={
                                                    mode === "update"
                                                        ? "bg-muted"
                                                        : ""
                                                }
                                                {...field}
                                            />
                                        </FormControl>
                                        {mode === "update" && (
                                            <p className="text-sm text-muted-foreground">
                                                メールアドレスは変更できません
                                            </p>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* ロール（自分のプロフィール編集時は非表示） */}
                            {!isOwnProfile && (
                                <FormField
                                    control={form.control}
                                    name="role"
                                    render={({ field }) => (
                                        <FormItem className="mb-4">
                                            <FormLabel>ロール</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="ロールを選択" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="AUTHOR">
                                                        {getUserRoleLabel(
                                                            "AUTHOR"
                                                        )}
                                                    </SelectItem>
                                                    <SelectItem value="EDITOR">
                                                        {getUserRoleLabel(
                                                            "EDITOR"
                                                        )}
                                                    </SelectItem>
                                                    <SelectItem value="ADMIN">
                                                        {getUserRoleLabel(
                                                            "ADMIN"
                                                        )}
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {/* ステータス（自分のプロフィール編集時は非表示） */}
                            {mode === "update" && !isOwnProfile && (
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem className="mb-4">
                                            <FormLabel>ステータス</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="ステータスを選択" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="ACTIVE">
                                                        {
                                                            USER_STATUS_LABELS.ACTIVE
                                                        }
                                                    </SelectItem>
                                                    <SelectItem value="INACTIVE">
                                                        {
                                                            USER_STATUS_LABELS.INACTIVE
                                                        }
                                                    </SelectItem>
                                                    <SelectItem value="SUSPENDED">
                                                        {
                                                            USER_STATUS_LABELS.SUSPENDED
                                                        }
                                                    </SelectItem>
                                                    <SelectItem value="DELETED">
                                                        {
                                                            USER_STATUS_LABELS.DELETED
                                                        }
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {/* パスワード */}
                            {canEditPassword && (
                                <>
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem className="mb-4">
                                                <FormLabel>
                                                    パスワード
                                                    {mode === "update" && (
                                                        <span className="text-sm text-gray-500 ml-2">
                                                            （変更する場合のみ入力）
                                                        </span>
                                                    )}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder={
                                                            mode === "create"
                                                                ? "パスワードを入力"
                                                                : "新しいパスワード（任意）"
                                                        }
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* パスワード確認 */}
                                    <FormField
                                        control={form.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem className="mb-4">
                                                <FormLabel>
                                                    パスワード確認
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder="パスワードを再入力"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </>
                            )}
                        </div>

                        <div>
                            {/* 表示名 */}
                            <FormField
                                control={form.control}
                                name="displayName"
                                render={({ field }) => (
                                    <FormItem className="mb-4">
                                        <FormLabel>表示名</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="表示名を入力"
                                                maxLength={100}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* 自己紹介 */}
                            <FormField
                                control={form.control}
                                name="bio"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>自己紹介</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="自己紹介を入力"
                                                maxLength={5000}
                                                rows={12}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    {/* 保存ボタン */}
                    <div className="flex justify-end gap-4">
                        {showCancel && onCancel && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                disabled={isSubmitting}
                            >
                                キャンセル
                            </Button>
                        )}
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {submitLabel ||
                                (mode === "create" ? "作成" : "更新")}
                        </Button>
                    </div>
                </form>
            </Form>

            {/* メディアピッカーダイアログ */}
            <MediaPickerDialog
                open={mediaPickerOpen}
                onOpenChange={setMediaPickerOpen}
                onSelect={handleMediaSelect}
            />
        </div>
    );
}
