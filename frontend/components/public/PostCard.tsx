/**
 * 投稿カードコンポーネント
 */

import Link from "next/link";
import Image from "next/image";
import { FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PostPublic } from "@/features/public/types";

interface PostCardProps {
    post: PostPublic;
}

export function PostCard({ post }: PostCardProps) {
    return (
        <article className="group overflow-hidden rounded-md border bg-card hover:border-primary/50 transition-border">
            <Link href={`/posts/${post.slug}`}>
                <div className="flex flex-row sm:flex-col">
                    {/* カバー画像 */}
                    {post.coverMedia ? (
                        <div className="relative m-3 sm:m-0 w-24 h-24 sm:w-full sm:h-40 md:h-40 overflow-hidden flex-shrink-0">
                            <Image
                                src={post.coverMedia.url}
                                alt={post.coverMedia.altText || post.title}
                                fill
                                className="object-cover transition-transform rounded-md sm:rounded-none"
                            />
                        </div>
                    ) : (
                        <div className="relative m-3 sm:m-0 w-24 h-24 sm:w-full sm:h-40 md:h-40 bg-muted flex items-center justify-center flex-shrink-0 rounded-md sm:rounded-none">
                            <span className="text-muted-foreground text-xs">
                                No Image
                            </span>
                        </div>
                    )}

                    <div className="py-4 sm:p-4 space-y-2 flex-1">
                        {/* カテゴリ */}
                        <div className="flex flex-wrap gap-2">
                            {post.category && (
                                <Badge
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                >
                                    <FolderOpen className="h-3 w-3" />
                                    {post.category.name}
                                </Badge>
                            )}
                        </div>

                        {/* タイトル */}
                        <h2 className="text-sm line-clamp-2 group-hover:text-primary transition-colors">
                            {post.title}
                        </h2>

                        {/* 公開日時 */}
                        <div className="flex items-center justify-end text-xs text-muted-foreground mr-2">
                            <time dateTime={post.publishedAt}>
                                {(() => {
                                    const date = new Date(post.publishedAt);
                                    const year = date.getFullYear();
                                    const month = String(
                                        date.getMonth() + 1
                                    ).padStart(2, "0");
                                    const day = String(date.getDate()).padStart(
                                        2,
                                        "0"
                                    );
                                    return `${year}/${month}/${day}`;
                                })()}
                            </time>
                        </div>
                    </div>
                </div>
            </Link>
        </article>
    );
}
