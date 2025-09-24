"use client";

import PostForm, { PostFormData } from "../../PostForm";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// 編集ページコンポーネント
export default function EditPostPage() {
    const params = useParams();
    const [initialData, setInitialData] =
        useState<Partial<PostFormData> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 記事データを取得
    useEffect(() => {
        const fetchPost = async () => {
            if (!params.id) return;
            try {
                const res = await api.get(
                    `${API_BASE_URL}/api/admin/posts/${params.id}`
                );
                const post = res.data;
                setInitialData({
                    title: post.title,
                    slug: post.slug,
                    content: post.contentJson,
                    excerpt: post.excerpt || "",
                    categoryId: post.category ? String(post.category.id) : "",
                    status: post.status,
                    publishedAt: post.publishedAt || "",
                });
            } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [params.id]);

    // ローディング中
    if (loading) return <div className="p-8 text-center"></div>;

    // エラー発生
    if (error)
        return <div className="p-8 text-center text-red-500">{error}</div>;

    // 記事データが存在しない場合
    if (!initialData)
        return <div className="p-8 text-center">記事が見つかりません</div>;

    return (
        <PostForm
            mode="edit"
            postId={Number(params.id)}
            initialData={initialData}
        />
    );
}
