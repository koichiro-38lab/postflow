"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/lib/auth-store";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Home() {
    const router = useRouter();
    const { accessToken } = useAuthStore();

    useEffect(() => {
        if (accessToken) {
            router.push("/admin");
        }
    }, [accessToken, router]);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="flex-1 max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 w-full">
                <div className="px-4 py-6 sm:px-0">
                    <div className="text-center">
                        <h2 className="text-4xl font-bold text-foreground mb-4">
                            PostFlowへようこそ
                        </h2>
                        <p className="text-xl text-muted-foreground mb-8">
                            Next.jsとSpring Bootで構築されたモダンなCMS
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                        <Card>
                            <CardHeader>
                                <CardTitle>ブログ記事</CardTitle>
                                <CardDescription>
                                    ブログコンテンツを作成・管理
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    リッチテキストエディタで記事を書いたり、下書きを管理したり、コンテンツを公開したりできます。
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>メディアライブラリ</CardTitle>
                                <CardDescription>
                                    メディアファイルをアップロード・整理
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    画像、動画、ドキュメントを自動最適化して保存します。
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>カテゴリ</CardTitle>
                                <CardDescription>
                                    階層カテゴリでコンテンツを整理
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    ネストされたカテゴリを作成してコンテンツを効果的に構造化します。
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
