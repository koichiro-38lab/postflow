"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { PostFlowIcon } from "@/components/ui/postflow-icon";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Menu } from "lucide-react";
import { UserProfileResponse, UserRole } from "@/lib/api/admin/users";
import { getUserRoleLabel } from "@/lib/user-utils";
import { fetchMediaDetail } from "@/lib/api/admin/media";
import { buildMediaUrl, normalizeMediaPublicUrl } from "@/lib/media-url";
import api from "@/lib/api";

interface AdminHeaderClientProps {
    profile: UserProfileResponse | null;
    avatarUrl: string | null;
}

export function AdminHeaderClient({
    profile: initialProfile,
    avatarUrl: initialAvatarUrl,
}: AdminHeaderClientProps) {
    const router = useRouter();
    const { logout } = useAuthStore();
    // モバイルメニューの開閉状態
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    // プロフィール情報（サーバーから渡された初期値を使用）
    const [profile, setProfile] = useState<UserProfileResponse | null>(
        initialProfile
    );
    // アバターURL（サーバーから渡された初期値を使用）
    const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);

    // ログアウト処理
    const handleLogout = () => {
        logout();
        router.push("/");
    };

    // アバターのイニシャル取得
    const getInitials = () => {
        if (profile?.displayName) {
            return profile.displayName.charAt(0).toUpperCase();
        }
        if (profile?.email) {
            return profile.email.charAt(0).toUpperCase();
        }
        return "U";
    };

    // プロフィール変更イベントをlistenしてアバターを更新
    useEffect(() => {
        const handleProfileUpdate = async () => {
            try {
                // 最新のプロフィール情報を取得
                const response = await api.get("/api/admin/users/me");
                const updatedProfile = response.data;
                setProfile(updatedProfile);

                // アバターが変更された場合、メディア情報を再取得
                if (updatedProfile.avatarMediaId) {
                    try {
                        const mediaData = await fetchMediaDetail(
                            updatedProfile.avatarMediaId
                        );
                        const newAvatarUrl =
                            normalizeMediaPublicUrl(mediaData.publicUrl) ??
                            buildMediaUrl(mediaData.storageKey);
                        setAvatarUrl(newAvatarUrl);
                    } catch (error) {
                        console.warn(
                            "Failed to load updated avatar media:",
                            error
                        );
                        setAvatarUrl(null);
                    }
                } else {
                    setAvatarUrl(null);
                }
            } catch (error) {
                console.error("Failed to refresh profile:", error);
            }
        };

        // カスタムイベントをlisten
        window.addEventListener("profileUpdated", handleProfileUpdate);

        return () => {
            window.removeEventListener("profileUpdated", handleProfileUpdate);
        };
    }, []);

    return (
        <>
            {/* モバイルメニュー */}
            <div className="flex items-center gap-1">
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                        >
                            <Menu className="h-6 w-6" />
                            <span className="sr-only">メニュー</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-64">
                        <SheetHeader>
                            <SheetTitle></SheetTitle>
                        </SheetHeader>
                        <nav className="flex flex-col gap-4 mt-6">
                            <Link
                                href="/admin/posts"
                                className="text-sm font-medium hover:text-primary transition-colors px-2 py-1"
                                onClick={() => setIsSheetOpen(false)}
                            >
                                記事
                            </Link>
                            <Link
                                href="/admin/media"
                                className="text-sm font-medium hover:text-primary transition-colors px-2 py-1"
                                onClick={() => setIsSheetOpen(false)}
                            >
                                メディア
                            </Link>
                            {/* カテゴリとタグは ADMIN/EDITOR のみ表示 */}
                            {profile?.role &&
                                (profile.role === "ADMIN" ||
                                    profile.role === "EDITOR") && (
                                    <>
                                        <Link
                                            href="/admin/categories"
                                            className="text-sm font-medium hover:text-primary transition-colors px-2 py-1"
                                            onClick={() =>
                                                setIsSheetOpen(false)
                                            }
                                        >
                                            カテゴリ
                                        </Link>
                                        <Link
                                            href="/admin/tags"
                                            className="text-sm font-medium hover:text-primary transition-colors px-2 py-1"
                                            onClick={() =>
                                                setIsSheetOpen(false)
                                            }
                                        >
                                            タグ
                                        </Link>
                                    </>
                                )}
                            {/* ユーザー管理は ADMIN のみ表示 */}
                            {profile?.role === "ADMIN" && (
                                <Link
                                    href="/admin/users"
                                    className="text-sm font-medium hover:text-primary transition-colors px-2 py-1"
                                    onClick={() => setIsSheetOpen(false)}
                                >
                                    ユーザー
                                </Link>
                            )}
                        </nav>
                    </SheetContent>
                </Sheet>

                <Link href="/admin">
                    <PostFlowIcon />
                </Link>
            </div>

            {/* ナビゲーションメニュー（デスクトップ） */}
            <nav className="hidden md:flex items-center gap-6">
                <Link
                    href="/admin/posts"
                    className="text-sm font-medium hover:text-primary transition-colors"
                >
                    記事
                </Link>
                <Link
                    href="/admin/media"
                    className="text-sm font-medium hover:text-primary transition-colors"
                >
                    メディア
                </Link>
                {/* カテゴリとタグは ADMIN/EDITOR のみ表示 */}
                {profile?.role &&
                    (profile.role === "ADMIN" || profile.role === "EDITOR") && (
                        <>
                            <Link
                                href="/admin/categories"
                                className="text-sm font-medium hover:text-primary transition-colors"
                            >
                                カテゴリ
                            </Link>
                            <Link
                                href="/admin/tags"
                                className="text-sm font-medium hover:text-primary transition-colors"
                            >
                                タグ
                            </Link>
                        </>
                    )}
                {/* ユーザー管理は ADMIN のみ表示 */}
                {profile?.role === "ADMIN" && (
                    <Link
                        href="/admin/users"
                        className="text-sm font-medium hover:text-primary transition-colors"
                    >
                        ユーザー
                    </Link>
                )}
            </nav>

            {/* 右側メニュー */}
            <div className="flex items-center gap-3">
                <ThemeToggle />

                {profile && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="relative h-10 w-10 rounded-full"
                            >
                                <Avatar className="h-10 w-10">
                                    <AvatarImage
                                        src={avatarUrl || undefined}
                                        alt={
                                            profile?.displayName ||
                                            profile.email
                                        }
                                        className="object-cover"
                                    />
                                    <AvatarFallback>
                                        {getInitials()}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-56"
                            align="end"
                            forceMount
                        >
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-md font-medium leading-none mb-1">
                                        {profile?.displayName || "ユーザー"}
                                    </p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {profile.email}
                                    </p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {getUserRoleLabel(
                                            profile.role as UserRole
                                        )}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => router.push("/admin/profile")}
                            >
                                プロフィール
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout}>
                                ログアウト
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </>
    );
}
