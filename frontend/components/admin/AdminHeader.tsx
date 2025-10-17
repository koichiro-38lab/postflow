"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
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
import { fetchMediaDetail, MediaResponse } from "@/lib/api/admin/media";
import { buildMediaUrl } from "@/lib/media-url";
import { getUserRoleLabel } from "@/lib/user-utils";
import api from "@/lib/api";

export default function AdminHeader() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [isClient, setIsClient] = useState(false);
    const [profile, setProfile] = useState<UserProfileResponse | null>(null);
    const [avatarMedia, setAvatarMedia] = useState<MediaResponse | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    const loadProfile = useCallback(async () => {
        try {
            const response = await api.get("/api/admin/users/me");
            const data = response.data;

            setProfile(data);

            // アバターのメディア情報を取得（権限がない場合はエラーを無視）
            if (data.avatarMediaId) {
                try {
                    const mediaData = await fetchMediaDetail(
                        data.avatarMediaId
                    );
                    setAvatarMedia(mediaData);
                } catch (error) {
                    console.warn(
                        "Failed to load avatar media (might be permission issue):",
                        error
                    );
                    setAvatarMedia(null);
                }
            } else {
                setAvatarMedia(null);
            }
        } catch (error) {
            console.error("Failed to load profile:", error);
        }
    }, []);

    // プロフィール情報取得（マウント時のみ）
    useEffect(() => {
        setIsClient(true);
        if (user) {
            loadProfile();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]); // user が変更されたら再取得
    const getInitials = () => {
        if (profile?.displayName) {
            return profile.displayName.charAt(0).toUpperCase();
        }
        if (user?.email) {
            return user.email.charAt(0).toUpperCase();
        }
        return "U";
    };

    // アバター画像URL
    const avatarUrl = avatarMedia
        ? avatarMedia.publicUrl ?? buildMediaUrl(avatarMedia.storageKey)
        : null;

    return (
        <header className="bg-card border-b sticky top-0 z-50">
            <div className="max-w-7xl mx-auto pr-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
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
                                            onClick={() =>
                                                setIsSheetOpen(false)
                                            }
                                        >
                                            ユーザー
                                        </Link>
                                    )}
                                </nav>
                            </SheetContent>
                        </Sheet>

                        <Link href="/admin">
                            <span className="text-2xl font-bold text-foreground cursor-pointer">
                                {process.env.NEXT_PUBLIC_SITE_NAME}{" "}
                                <span className="text-sm text-muted-foreground">
                                    Admin
                                </span>
                            </span>
                        </Link>
                    </div>

                    {/* ナビゲーションメニュー */}
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
                            (profile.role === "ADMIN" ||
                                profile.role === "EDITOR") && (
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

                        {isClient && user && (
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
                                                    user.email
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
                                                {profile?.displayName ||
                                                    "ユーザー"}
                                            </p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                {user.email}
                                            </p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                {getUserRoleLabel(
                                                    user.roles[0] as UserRole
                                                )}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() =>
                                            router.push("/admin/profile")
                                        }
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
                </div>
            </div>
        </header>
    );
}
