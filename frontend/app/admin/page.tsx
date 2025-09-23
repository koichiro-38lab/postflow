"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function AdminPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-background">
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6">
                    <div className="grid grid-cols-5 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>ユーザー</CardTitle>
                                <CardDescription>
                                    ユーザーを管理
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    onClick={() => router.push("/admin/users")}
                                >
                                    ユーザーを表示
                                </Button>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>記事</CardTitle>
                                <CardDescription>
                                    ブログ記事を管理
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    onClick={() => router.push("/admin/posts")}
                                >
                                    記事を表示
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>メディア</CardTitle>
                                <CardDescription>
                                    メディアファイルを管理
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    onClick={() => router.push("/admin/media")}
                                >
                                    メディアを表示
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>カテゴリ</CardTitle>
                                <CardDescription>
                                    カテゴリを管理
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    onClick={() =>
                                        router.push("/admin/categories")
                                    }
                                >
                                    カテゴリを表示
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>タグ</CardTitle>
                                <CardDescription>タグを管理</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    onClick={() => router.push("/admin/tags")}
                                >
                                    タグを表示
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
