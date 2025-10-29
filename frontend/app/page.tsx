import Link from "next/link";
import { getPublicPosts, getPublicCategories } from "@/lib/api/public";
import { PostCard } from "@/components/public/PostCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen } from "lucide-react";
import type { Metadata } from "next";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import Background from "@/components/ui/background";

export const metadata: Metadata = {
    title: process.env.NEXT_PUBLIC_SITE_NAME || "",
    description: "Spring Boot × Next.js で構築する実用型CMS",
};

// 動的レンダリング: ランタイムでAPIからデータ取得
export const dynamic = "force-dynamic";
export const revalidate = 10; // 10秒ごとに再検証（キャッシュ）

export default async function HomePage() {
    // 最新記事を取得（トップページ用に6件）
    const postsResponse = await getPublicPosts({ size: 8 });
    const posts = postsResponse.content;

    // カテゴリを取得
    const categories = await getPublicCategories();
    const topLevelCategories = categories.filter((cat) => !cat.parentId);

    return (
        <>
            <PublicHeader />
            <div className="min-h-screen">
                {/* ヒーローセクション */}
                <section
                    className="relative h-[40vh] overflow-hidden border-b"
                    style={{ isolation: "isolate" }}
                >
                    <Background />
                    <div
                        className="relative flex items-center justify-center h-full"
                        style={{ zIndex: 10 }}
                    >
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
                            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
                                PostFlow
                            </h1>
                            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-7 md:leading-9">
                                Spring Boot と Next.js で実現する
                                <br className="hidden sm:block" />
                                次世代CMSプラットフォーム
                            </p>
                        </div>
                    </div>
                </section>

                {/* 最新記事セクション */}
                <section className="py-8 md:py-8 bg-background">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl md:text-3xl font-bold">
                                最新記事
                            </h2>
                        </div>

                        {posts.length > 0 ? (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {posts.map((post) => (
                                    <PostCard key={post.id} post={post} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                                <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                                <p className="text-muted-foreground text-lg mb-2">
                                    まだ記事がありません
                                </p>
                            </div>
                        )}
                        <div className="flex justify-center mt-8">
                            <Button variant="ghost" asChild>
                                <Link
                                    href="/posts"
                                    className="flex items-center group"
                                >
                                    すべての記事を見る
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* カテゴリセクション */}
                {topLevelCategories.length > 0 && (
                    <section className="py-8 md:py-8 bg-muted/30 border-t border-b">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl md:text-3xl font-bold">
                                    カテゴリから探す
                                </h2>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                {topLevelCategories.map((category) => (
                                    <Link
                                        key={category.id}
                                        href={`/categories/${category.slug}`}
                                        className="group relative bg-background border border-border hover:border-primary rounded-md p-4"
                                    >
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-lg group-hover:text-primary transition-colors">
                                                {category.name}
                                            </h3>
                                            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary " />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </div>
            <PublicFooter />
        </>
    );
}
