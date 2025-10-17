"use client";

import PostForm, { PostFormData } from "@/components/admin/posts/PostForm";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { fetchMediaDetail } from "@/lib/api/admin/media";
import { buildMediaUrl } from "@/lib/media-url";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// 編集ページコンポーネント
export default function EditPostPage() {
    const params = useParams();
    const [initialData, setInitialData] = useState<
        | (Partial<PostFormData> & {
              tags?: Array<{ id: number; name: string; slug: string }>;
          })
        | null
    >(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [initialCoverMediaId, setInitialCoverMediaId] = useState<
        number | null
    >(null);
    const [initialCoverPreviewUrl, setInitialCoverPreviewUrl] = useState<
        string | null
    >(null);
    const [initialAuthorName, setInitialAuthorName] = useState<string>("");

    // 記事データを取得
    useEffect(() => {
        const fetchPost = async () => {
            if (!params.id) return;
            try {
                const res = await api.get(
                    `${API_BASE_URL}/api/admin/posts/${params.id}`
                );
                const post = res.data;

                // 投稿者名を設定
                setInitialAuthorName(
                    post.author?.displayName || post.author?.username || "不明"
                );
                setInitialData({
                    title: post.title,
                    slug: post.slug,
                    content: post.contentJson,
                    excerpt: post.excerpt || "",
                    categoryId: post.category ? String(post.category.id) : "",
                    status: post.status,
                    publishedAt: post.publishedAt || "",
                    tags: post.tags || [],
                });

                if (post.coverMedia && post.coverMedia.id) {
                    try {
                        const detail = await fetchMediaDetail(
                            post.coverMedia.id
                        );
                        const url =
                            detail.publicUrl ??
                            buildMediaUrl(detail.storageKey);
                        setInitialCoverMediaId(detail.id);
                        setInitialCoverPreviewUrl(url ?? null);
                    } catch {
                        // noop: カバー画像の詳細取得に失敗してもフォームは表示する
                    }
                } else {
                    setInitialCoverMediaId(null);
                    setInitialCoverPreviewUrl(null);
                }
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
            initialCoverMediaId={initialCoverMediaId}
            initialCoverPreviewUrl={initialCoverPreviewUrl}
            initialAuthorName={initialAuthorName}
        />
    );
}
