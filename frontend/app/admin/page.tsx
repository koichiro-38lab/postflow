"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAdminSession } from "@/features/admin/common/hooks/use-admin-session";
import api from "@/lib/api";

type DashboardStats = {
    userCount: number;
    postCount: number;
    mediaCount: number;
    categoryCount: number;
    tagCount: number;
};

export default function AdminPage() {
    const router = useRouter();
    // 認証セッション情報を取得
    const { user, authReady, isLoading: authSessionLoading } =
        useAdminSession();
    // ダッシュボード統計データの状態管理
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // ユーザー権限に基づく表示制御（パフォーマンス最適化）
    const userRoles = user?.roles?.map((role) => role.toLowerCase()) ?? [];
    const isAdmin = userRoles.includes("admin");
    const isEditor = userRoles.includes("editor");
    const isAuthor = userRoles.includes("author");

    // ダッシュボード統計データを取得
    useEffect(() => {
        const fetchStats = async () => {
            if (!authReady || !user) return;

            try {
                setIsLoading(true);
                const promises = [];

                // 各エンティティの件数を並列で取得
                if (isAdmin) {
                    promises.push(api.get("/api/admin/users?page=0&size=1"));
                }
                if (isAdmin || isEditor || isAuthor) {
                    promises.push(api.get("/api/admin/posts?page=0&size=1"));
                    promises.push(api.get("/api/admin/media?page=0&size=1"));
                }
                if (isAdmin || isEditor) {
                    // カテゴリとタグはリスト形式なので全件取得して件数をカウント
                    promises.push(api.get("/api/admin/categories"));
                    promises.push(api.get("/api/admin/tags"));
                }

                const results = await Promise.allSettled(promises);

                // レスポンスから総件数を抽出
                let statIndex = 0;
                const newStats: DashboardStats = {
                    userCount: 0,
                    postCount: 0,
                    mediaCount: 0,
                    categoryCount: 0,
                    tagCount: 0,
                };

                if (isAdmin && results[statIndex]?.status === "fulfilled") {
                    const result = results[
                        statIndex
                    ] as PromiseFulfilledResult<{
                        data: { totalElements: number };
                    }>;
                    newStats.userCount = result.value.data.totalElements || 0;
                    statIndex++;
                }
                if (
                    (isAdmin || isEditor || isAuthor) &&
                    results[statIndex]?.status === "fulfilled"
                ) {
                    const result = results[
                        statIndex
                    ] as PromiseFulfilledResult<{
                        data: { totalElements: number };
                    }>;
                    newStats.postCount = result.value.data.totalElements || 0;
                    statIndex++;
                }
                if (
                    (isAdmin || isEditor || isAuthor) &&
                    results[statIndex]?.status === "fulfilled"
                ) {
                    const result = results[
                        statIndex
                    ] as PromiseFulfilledResult<{
                        data: { totalElements: number };
                    }>;
                    newStats.mediaCount = result.value.data.totalElements || 0;
                    statIndex++;
                }
                if (
                    (isAdmin || isEditor) &&
                    results[statIndex]?.status === "fulfilled"
                ) {
                    // カテゴリはリスト形式なので配列の長さをカウント
                    const result = results[
                        statIndex
                    ] as PromiseFulfilledResult<{
                        data: Array<{ id: number; name: string }>;
                    }>;
                    newStats.categoryCount = result.value.data.length || 0;
                    statIndex++;
                }
                if (
                    (isAdmin || isEditor) &&
                    results[statIndex]?.status === "fulfilled"
                ) {
                    // タグはリスト形式なので配列の長さをカウント
                    const result = results[
                        statIndex
                    ] as PromiseFulfilledResult<{
                        data: Array<{ id: number; name: string }>;
                    }>;
                    newStats.tagCount = result.value.data.length || 0;
                }

                setStats(newStats);
            } catch (error) {
                console.error("ダッシュボード統計の取得に失敗:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, [authReady, user, isAdmin, isEditor, isAuthor]);

    // バッジ表示用のローディング判定
    const displayLoading = authSessionLoading || !authReady || isLoading;

    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    {/* ユーザー管理カード - adminのみ表示 */}
                    {isAdmin && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text- font-medium">
                                    ユーザー
                                </CardTitle>
                                {!displayLoading && stats && (
                                    <Badge
                                        variant="secondary"
                                        className="px-2 py-1"
                                    >
                                        {stats.userCount}件
                                    </Badge>
                                )}
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="mb-4">
                                    ユーザーを管理
                                </CardDescription>
                                <Button
                                    onClick={() => router.push("/admin/users")}
                                >
                                    ユーザーを表示
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* 記事管理カード - admin, editor, author表示 */}
                    {(isAdmin || isEditor || isAuthor) && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text- font-medium">
                                    記事
                                </CardTitle>
                                {!displayLoading && stats && (
                                    <Badge
                                        variant="secondary"
                                        className="px-2 py-1"
                                    >
                                        {stats.postCount}件
                                    </Badge>
                                )}
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="mb-4">
                                    ブログ記事を管理
                                </CardDescription>
                                <Button
                                    onClick={() => router.push("/admin/posts")}
                                >
                                    記事を表示
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* メディア管理カード - admin, editor, author表示 */}
                    {(isAdmin || isEditor || isAuthor) && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text- font-medium">
                                    メディア
                                </CardTitle>
                                {!displayLoading && stats && (
                                    <Badge
                                        variant="secondary"
                                        className="px-2 py-1"
                                    >
                                        {stats.mediaCount}件
                                    </Badge>
                                )}
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="mb-4">
                                    メディアファイルを管理
                                </CardDescription>
                                <Button
                                    onClick={() => router.push("/admin/media")}
                                >
                                    メディアを表示
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* カテゴリ管理カード - admin, editor表示 */}
                    {(isAdmin || isEditor) && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text- font-medium">
                                    カテゴリ
                                </CardTitle>
                                {!displayLoading && stats && (
                                    <Badge
                                        variant="secondary"
                                        className="px-2 py-1"
                                    >
                                        {stats.categoryCount}件
                                    </Badge>
                                )}
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="mb-4">
                                    カテゴリを管理
                                </CardDescription>
                                <Button
                                    onClick={() =>
                                        router.push("/admin/categories")
                                    }
                                >
                                    カテゴリを表示
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* タグ管理カード - admin, editor表示 */}
                    {(isAdmin || isEditor) && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text- font-medium">
                                    タグ
                                </CardTitle>
                                {!displayLoading && stats && (
                                    <Badge
                                        variant="secondary"
                                        className="px-2 py-1"
                                    >
                                        {stats.tagCount}件
                                    </Badge>
                                )}
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="mb-4">
                                    タグを管理
                                </CardDescription>
                                <Button
                                    onClick={() => router.push("/admin/tags")}
                                >
                                    タグを表示
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
