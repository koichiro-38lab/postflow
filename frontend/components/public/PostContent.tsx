import React from "react";
import Link from "next/link";
import { Calendar, FolderOpen, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { PostPublicDetail } from "@/features/public/types";
import { renderTipTapContent } from "@/features/public/utils/tiptap-renderer";
import Image from "next/image";

interface PostContentProps {
    post: PostPublicDetail;
}

export default function PostContent({ post }: PostContentProps) {
    // TipTap JSON をサーバー側でHTMLに変換
    const contentHtml = renderTipTapContent(post.contentJson);

    return (
        <article className="max-w-4xl mx-auto px-4 py-8">
            {/* カバー画像 */}
            {post.coverMedia && (
                <div className="mb-8 rounded-lg overflow-hidden">
                    <Image
                        src={post.coverMedia.url}
                        alt={post.coverMedia.altText || post.title}
                        width={1200}
                        height={630}
                        className="w-full h-auto object-cover"
                        priority
                    />
                </div>
            )}

            {/* タイトル */}
            <h1 className="text-3xl font-bold mb-4">{post.title}</h1>

            {/* メタ情報 */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-2">
                <div className="flex items-center gap-1">
                    <Avatar className="h-6 w-6">
                        <AvatarImage
                            src={post.author?.avatarUrl}
                            alt={
                                post.author?.displayName ||
                                post.author?.username ||
                                "Unknown"
                            }
                            className="object-cover"
                        />
                        <AvatarFallback className="text-xs">
                            {(
                                post.author?.displayName ||
                                post.author?.username ||
                                "U"
                            )
                                .charAt(0)
                                .toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <span>
                        {post.author?.displayName ||
                            post.author?.username ||
                            "Unknown"}
                    </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <time dateTime={post.publishedAt}>
                        {(() => {
                            const date = new Date(post.publishedAt);
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(
                                2,
                                "0"
                            );
                            const day = String(date.getDate()).padStart(2, "0");
                            return `${year}/${month}/${day}`;
                        })()}
                    </time>
                </div>
                {post.category && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <Link href={`/categories/${post.category.slug}`}>
                            <Badge
                                variant="secondary"
                                className="hover:bg-secondary/80 cursor-pointer font-normal"
                            >
                                <FolderOpen className="w-4 h-4 mr-1" />
                                {post.category.name}
                            </Badge>
                        </Link>
                    </div>
                )}
            </div>

            {/* タグ */}
            {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                    {post.tags.map((tag) => (
                        <Link key={tag.id} href={`/tags/${tag.slug}`}>
                            <Badge
                                variant="outline"
                                className="hover:bg-accent cursor-pointer"
                            >
                                <Hash className="h-3 w-3 mr-0.5" />
                                {tag.name}
                            </Badge>
                        </Link>
                    ))}
                </div>
            )}

            {/* 本文 */}
            <div
                className="prose prose-lg dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
            />

            {/* 著者情報 */}
            {post.author && (
                <Card className="mt-8">
                    <CardContent className="p-6">
                        <div className="flex flex-row items-start gap-4">
                            {/* アバター */}
                            <Avatar className="w-20 h-20">
                                <AvatarImage
                                    src={post.author.avatarUrl}
                                    alt={`${
                                        post.author.displayName ||
                                        post.author.username
                                    }のアバター`}
                                    className="object-cover"
                                />
                            </Avatar>

                            <div className="flex-1 min-w-0">
                                {/* 著者名 */}
                                <span className="text-sm text-muted-foreground rounded">
                                    ライター
                                </span>
                                <h3 className="font-semibold text-foreground mb-1">
                                    {post.author.displayName}
                                </h3>

                                {/* バイオ */}
                                {post.author.bio && (
                                    <p className="text-sm mb-3">
                                        {post.author.bio}
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </article>
    );
}
