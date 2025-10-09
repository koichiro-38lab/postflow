import type { RefObject } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
    FailedMediaItem,
    MediaListItem,
    SucceededMediaItem,
    ViewMode,
} from "@/features/admin/media/types";
import { LayoutGrid, List, Loader2 } from "lucide-react";

import { MediaGrid } from "./MediaGrid";
import { MediaList } from "./MediaList";

export interface MediaListSectionProps {
    items: MediaListItem[];
    viewMode: ViewMode;
    onChangeViewMode: (mode: ViewMode) => void;
    listError: string | null;
    showInitialLoading: boolean;
    showLoadMoreSpinner: boolean;
    listContainerRef: RefObject<HTMLDivElement | null>;
    buildMediaUrl: (storageKey?: string | null) => string | null;
    handleRetry: (item: FailedMediaItem) => void;
    onOpenDetail?: (item: SucceededMediaItem) => void;
    onSelectItem?: (item: SucceededMediaItem) => void;
    selectionMode?: boolean;
    selectedItemId?: number | null;
}

export function MediaListSection({
    items,
    viewMode,
    onChangeViewMode,
    listError,
    showInitialLoading,
    showLoadMoreSpinner,
    listContainerRef,
    buildMediaUrl,
    handleRetry,
    onOpenDetail,
    onSelectItem,
    selectionMode = false,
    selectedItemId = null,
}: MediaListSectionProps) {
    // 初回ロード後に一覧が空かどうかを判定
    const hasItems = items.length > 0;
    // アイテムクリック時のハンドラ
    const itemClickHandler = onSelectItem ?? onOpenDetail;

    return (
        <div className="rounded-md border bg-background/50">
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3 text-sm font-medium text-muted-foreground">
                <span>メディア一覧</span>
                <ViewModeToggle mode={viewMode} onChange={onChangeViewMode} />
            </div>
            <div
                ref={listContainerRef}
                className={cn(
                    "relative w-full overflow-y-auto overflow-x-hidden",
                    showInitialLoading ? "flex items-center justify-center" : ""
                )}
                style={{ height: "min(420px, 50vh)" }}
            >
                {listError && (
                    <p className="mb-3 px-4 text-sm text-destructive">
                        {listError}
                    </p>
                )}

                {showInitialLoading ? (
                    <InitialLoadingNotice />
                ) : !hasItems ? (
                    <p className="px-4 py-6 text-sm text-muted-foreground">
                        まだアップロードされたメディアはありません。
                    </p>
                ) : viewMode === "list" ? (
                    <MediaList
                        items={items}
                        buildMediaUrl={buildMediaUrl}
                        handleRetry={handleRetry}
                        onItemClick={itemClickHandler}
                        selectionMode={selectionMode}
                        selectedItemId={selectedItemId}
                        showLoadMoreSpinner={showLoadMoreSpinner}
                    />
                ) : (
                    <MediaGrid
                        items={items}
                        buildMediaUrl={buildMediaUrl}
                        handleRetry={handleRetry}
                        onItemClick={itemClickHandler}
                        selectionMode={selectionMode}
                        selectedItemId={selectedItemId}
                        showLoadMoreSpinner={showLoadMoreSpinner}
                    />
                )}
            </div>
        </div>
    );
}

function ViewModeToggle({
    mode,
    onChange,
}: {
    mode: ViewMode;
    onChange: (mode: ViewMode) => void;
}) {
    return (
        <div className="flex items-center gap-1">
            <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="リスト表示"
                aria-pressed={mode === "list"}
                className={cn(
                    "h-8 w-8 border",
                    mode === "list"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                onClick={() => onChange("list")}
            >
                <List className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="タイル表示"
                aria-pressed={mode === "grid"}
                className={cn(
                    "h-8 w-8 border",
                    mode === "grid"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                onClick={() => onChange("grid")}
            >
                <LayoutGrid className="h-4 w-4" aria-hidden="true" />
            </Button>
        </div>
    );
}

function InitialLoadingNotice() {
    return (
        <div className="flex max-w-sm flex-col items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                <span className="sr-only">読み込み中...</span>
            </span>
        </div>
    );
}
