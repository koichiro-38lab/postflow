import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type {
    FailedMediaItem,
    MediaListItem,
    SucceededMediaItem,
} from "@/features/admin/media/types";
import { UPLOAD_PHASE_LABEL } from "@/features/admin/media/use-media-uploader";
import { formatBytes } from "@/lib/media-utils";
import {
    AlertCircle,
    Loader2,
} from "lucide-react";
import Image from "next/image";

export interface MediaGridProps {
    items: MediaListItem[];
    buildMediaUrl: (storageKey?: string | null) => string | null;
    handleRetry: (item: FailedMediaItem) => void;
    onOpenDetail: (item: SucceededMediaItem) => void;
}

export function MediaGrid({
    items,
    buildMediaUrl,
    handleRetry,
    onOpenDetail,
}: MediaGridProps) {
    // グリッド表示用にカードを展開
    return (
        <ul className="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
            {items.map((item) => {
                const key =
                    item.status === "succeeded"
                        ? `media-${item.id}`
                        : `upload-${item.id}`;
                return (
                    <li key={key}>
                        <MediaGridCard
                            item={item}
                            buildMediaUrl={buildMediaUrl}
                            handleRetry={handleRetry}
                            onOpenDetail={onOpenDetail}
                        />
                    </li>
                );
            })}
        </ul>
    );
}

interface MediaGridCardProps {
    item: MediaListItem;
    buildMediaUrl: (storageKey?: string | null) => string | null;
    handleRetry: (item: FailedMediaItem) => void;
    onOpenDetail: (item: SucceededMediaItem) => void;
}

function MediaGridCard({
    item,
    buildMediaUrl,
    handleRetry,
    onOpenDetail,
}: MediaGridCardProps) {
    if (item.status === "succeeded") {
        const mediaUrl = buildMediaUrl(item.storageKey);
        return (
            <div
                role="button"
                tabIndex={0}
                onClick={() => onOpenDetail(item)}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onOpenDetail(item);
                    }
                }}
                className="flex h-full cursor-pointer flex-col overflow-hidden rounded-lg border bg-background outline-none transition hover:border-primary/50 hover:shadow focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
            >
                <div className="relative overflow-hidden bg-muted" style={{ aspectRatio: "16 / 9" }}>
                    {mediaUrl ? (
                        <Image
                            src={mediaUrl}
                            alt={item.altText || item.filename}
                            fill
                            sizes="(min-width: 1024px) 200px, 50vw"
                            className="object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-muted" />
                    )}
                </div>
                <div className="flex flex-1 flex-col gap-1 p-3 text-sm">
                    <p className="truncate font-medium">{item.filename}</p>
                    <p className="text-xs text-muted-foreground">
                        {item.mime} ・ {formatBytes(item.bytes)}
                    </p>
                </div>
            </div>
        );
    }

    if (item.status === "failed") {
        return (
            <div className="flex h-full flex-col gap-3 rounded-lg border border-destructive/60 bg-destructive/10 p-4">
                <div className="flex h-32 items-center justify-center rounded-md border bg-muted">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <div className="space-y-2 text-sm">
                    <p className="truncate font-medium">{item.filename}</p>
                    <p className="text-xs text-muted-foreground">
                        {formatBytes(item.bytes)} ・ アップロードエラー
                    </p>
                    <p className="text-xs text-destructive">{item.error}</p>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleRetry(item)}
                        >
                            再試行
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-lg border border-primary/30 bg-muted/40">
            <div className="relative flex h-32 items-center justify-center border-b bg-muted">
                <div className="absolute inset-0 animate-pulse bg-muted-foreground/20" />
                <Loader2 className="relative h-6 w-6 animate-spin text-primary" />
            </div>
            <div className="flex flex-1 flex-col gap-2 p-3 text-sm">
                <div className="space-y-1">
                    <p className="truncate font-medium">{item.filename}</p>
                    <p className="text-xs text-muted-foreground">
                        {formatBytes(item.bytes)} ・ {UPLOAD_PHASE_LABEL[item.phase]}
                    </p>
                </div>
                <div className="mt-auto">
                    <Progress value={item.progress} className="h-2" />
                </div>
            </div>
        </div>
    );
}
