"use client";

import { useEffect, useState } from "react";
import { fetchPosts, Post } from "@/lib/post-api";
import { useAuthStore } from "@/lib/auth-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function AdminPostsPage() {
    const { accessToken } = useAuthStore();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchPosts(accessToken || undefined);
                setPosts(data);
            } catch (e: unknown) {
                if (e instanceof Error) {
                    setError(e.message);
                } else {
                    setError("取得に失敗しました");
                }
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [accessToken]);

    return (
        <div className="max-w-4xl mx-auto py-8">
            <h2 className="text-2xl font-bold mb-6">記事一覧</h2>
            {loading && <div>読み込み中...</div>}
            {error && <div className="text-red-500">{error}</div>}
            <div className="space-y-4">
                {posts.map((post) => (
                    <Card key={post.id}>
                        <CardHeader>
                            <CardTitle>{post.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div>スラッグ: {post.slug}</div>
                            <div>公開日: {post.publishedAt || "未公開"}</div>
                        </CardContent>
                    </Card>
                ))}
                {!loading && posts.length === 0 && (
                    <div>記事がありません。</div>
                )}
            </div>
        </div>
    );
}
