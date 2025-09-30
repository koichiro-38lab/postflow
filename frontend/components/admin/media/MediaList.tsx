import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type {
    FailedMediaItem,
    MediaListItem,
    SucceededMediaItem,
} from "@/features/admin/media/types";
import { UPLOAD_PHASE_LABEL } from "@/features/admin/media/types";
import { formatBytes } from "@/lib/media-utils";
import { cn } from "@/lib/utils";
import { AlertCircle, Check, Loader2 } from "lucide-react";

const THUMBNAIL_WIDTH = 128;
const THUMBNAIL_HEIGHT = 72;

export interface MediaListProps {
    items: MediaListItem[];
    buildMediaUrl: (storageKey?: string | null) => string | null;
    handleRetry: (item: FailedMediaItem) => void;
    onItemClick?: (item: SucceededMediaItem) => void;
    selectionMode?: boolean;
    selectedItemId?: number | null;
}

export function MediaList({
    items,
    buildMediaUrl,
    handleRetry,
    onItemClick,
    selectionMode = false,
    selectedItemId = null,
}: MediaListProps) {
    // アイテムを安定したキーで描画
    return (
        <ul className="list-none p-0 m-0 w-full overflow-x-hidden">
            {items.map((item) => {
                const key =
                    item.status === "succeeded"
                        ? `media-${item.id}`
                        : `upload-${item.id}`;
                return (
                    <li key={key} className="w-full">
                        <MediaListRow
                            item={item}
                            buildMediaUrl={buildMediaUrl}
                            handleRetry={handleRetry}
                            onItemClick={onItemClick}
                            selectionMode={selectionMode}
                            selectedItemId={selectedItemId}
                        />
                    </li>
                );
            })}
        </ul>
    );
}

interface MediaListRowProps {
    item: MediaListItem;
    buildMediaUrl: (storageKey?: string | null) => string | null;
    handleRetry: (item: FailedMediaItem) => void;
    onItemClick?: (item: SucceededMediaItem) => void;
    selectionMode: boolean;
    selectedItemId: number | null;
}

function MediaListRow({
    item,
    buildMediaUrl,
    handleRetry,
    onItemClick,
    selectionMode,
    selectedItemId,
}: MediaListRowProps) {
    if (item.status === "succeeded") {
        // 選択状態判定
        const isSelected = selectionMode && selectedItemId === item.id;
        // プレビュー用URL
        const mediaUrl = buildMediaUrl(item.storageKey);
        return (
            <div
                role={selectionMode ? "option" : "button"}
                tabIndex={0}
                onClick={() => onItemClick?.(item)}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onItemClick?.(item);
                    }
                }}
                aria-selected={selectionMode ? isSelected : undefined}
                className={cn(
                    "w-full box-border flex cursor-pointer items-start gap-3 border-b p-3 outline-none transition hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
                    isSelected ? "bg-primary/10" : ""
                )}
            >
                <div className="relative h-[72px] w-[128px] flex-none overflow-hidden rounded-md border bg-muted">
                    {mediaUrl ? (
                        <Image
                            src={mediaUrl}
                            alt={item.altText || item.filename}
                            width={THUMBNAIL_WIDTH}
                            height={THUMBNAIL_HEIGHT}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="h-full w-full bg-muted" />
                    )}
                    {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/40 text-primary-foreground">
                            <Check className="h-6 w-6" />
                        </div>
                    )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
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
            <div className="flex items-start gap-3 rounded-md border border-destructive/60 bg-destructive/10 p-4">
                <div className="relative flex h-[72px] w-[128px] flex-none items-center justify-center overflow-hidden rounded-md border bg-muted">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                    <div className="space-y-1">
                        <p className="truncate font-medium">{item.filename}</p>
                        <p className="text-xs text-muted-foreground">
                            {formatBytes(item.bytes)} ・ アップロードエラー
                        </p>
                    </div>
                    <div className="space-y-2">
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
            </div>
        );
    }

    return (
        <div className="flex items-start gap-3 rounded-md border border-primary/30 bg-muted/40 p-4">
            <div className="relative flex h-[72px] w-[128px] flex-none items-center justify-center overflow-hidden rounded-md border bg-muted">
                <div className="absolute inset-0 animate-pulse bg-muted-foreground/20" />
                <Loader2 className="relative h-6 w-6 animate-spin text-primary" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
                <div className="space-y-1">
                    <p className="truncate font-medium">{item.filename}</p>
                    <p className="text-xs text-muted-foreground">
                        {item.mime} ・ {UPLOAD_PHASE_LABEL[item.phase]}
                    </p>
                </div>
                <Progress value={item.progress} className="h-2" />
            </div>
        </div>
    );
}
